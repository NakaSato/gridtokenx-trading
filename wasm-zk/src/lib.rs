//! GridTokenX ZK wasm module (ElGamal keypairs, Pedersen commitments,
//! range proofs, a balance-conservation proof, stealth key derivation).
//!
//! Lives in its own crate because solana-zk-token-sdk dominates binary size;
//! the main gridtokenx-wasm module stays small and this one is lazily loaded
//! on first ZK use (lib/wasm-bridge.ts#loadZkModule).
//!
//! ## Balance / transfer proof soundness (READ BEFORE ENABLING ON MAINNET)
//!
//! `create_transfer_proof` emits, for a shielded transfer of `amount` out of
//! `sender_balance`:
//!   - `amount_commitment`     C_amt = amount·G + r_amt·H
//!   - `remaining_range_proof.commitment` C_new = remaining·G + r_new·H
//!   - two bulletproof range proofs (amount and remaining are in [0, 2^64))
//!   - `balance_proof`: a real Schnorr (Okamoto) proof of knowledge of the
//!     opening (amount, r_amt) of C_amt, Fiat–Shamir challenged.
//!
//! Blindings are chosen so `r_new = r_old - r_amt`, which makes
//!   C_old == C_amt + C_new   (C_old = sender's currently-stored commitment).
//! That single ristretto-point identity IS the conservation guarantee: it forces
//! `value(C_old) = value(C_amt) + value(C_new)` (mod l), so no value is minted.
//! The on-chain `private_transfer` verifier (Phase 1) checks that identity plus
//! this Okamoto proof.
//!
//! PHASE 1 IS NOT MAINNET-SOUND ON ITS OWN. The conservation identity holds
//! mod the group order; without the range proofs being *verified on-chain* a
//! sender can pick `amount > balance` so `remaining` wraps to a near-l value and
//! steal. The range proofs are produced here but Phase 1's on-chain program does
//! NOT verify them (bulletproof verification needs the ZK ElGamal Proof Program
//! — Phase 2). Until Phase 2 lands, `private_transfer` stays feature-gated OFF.

use serde::{Deserialize, Serialize};
use solana_zk_token_sdk::{
    encryption::{
        elgamal::ElGamalKeypair,
        pedersen::{Pedersen, PedersenOpening, H as PEDERSEN_H},
    },
    instruction::range_proof::RangeProofU64Data,
    zk_token_elgamal::pod,
};

use solana_zk_sdk::{
    encryption::pedersen::{
        Pedersen as ZkPedersen, PedersenOpening as ZkPedersenOpening,
    },
    zk_elgamal_proof_program::proof_data::{
        batched_range_proof::{
            batched_range_proof_u128::BatchedRangeProofU128Data,
            batched_range_proof_u64::BatchedRangeProofU64Data,
        },
        ZkProofData,
    },
};

use bytemuck::bytes_of;
use curve25519_dalek::{
    constants::RISTRETTO_BASEPOINT_POINT,
    ristretto::{CompressedRistretto, RistrettoPoint},
    scalar::Scalar,
};
use sha2::{Digest, Sha512};
use wasm_bindgen::prelude::*;

// ============================================================================
// Balance proof (Okamoto PoK of a Pedersen opening) — shared prover/verifier
// helpers. The on-chain verifier mirrors `okamoto_challenge` byte-for-byte.
// ============================================================================

/// Fiat–Shamir challenge for the balance proof: domain-separated SHA-512 over
/// the amount commitment and the prover's nonce point, reduced mod l.
/// MUST stay identical to the on-chain verifier.
fn okamoto_challenge(c_amt: &[u8; 32], nonce_point: &[u8; 32]) -> Scalar {
    let mut h = Sha512::new();
    h.update(b"GridTokenX_BalanceProof_v1");
    h.update(c_amt);
    h.update(nonce_point);
    let digest = h.finalize();
    let mut wide = [0u8; 64];
    wide.copy_from_slice(&digest);
    Scalar::from_bytes_mod_order_wide(&wide)
}

/// Uniformly random scalar from 64 bytes of CSPRNG output (getrandom → browser
/// crypto.getRandomValues under the `js` feature).
fn rand_scalar() -> Result<Scalar, JsValue> {
    let mut wide = [0u8; 64];
    getrandom::getrandom(&mut wide).map_err(|_| JsValue::from_str("CSPRNG unavailable"))?;
    Ok(Scalar::from_bytes_mod_order_wide(&wide))
}

/// Verify an Okamoto proof of knowledge of the opening of `c_amt`.
/// `challenge` = c (32 bytes), `response` = z_v (32) || z_r (32).
/// Recomputes A' = z_v·G + z_r·H − c·C_amt and checks H(C_amt, A') == c.
/// Exposed so tests (and, mirrored in Rust, the on-chain program) share one path.
fn verify_balance_proof(c_amt_bytes: &[u8; 32], challenge: &[u8; 32], response: &[u8; 64]) -> bool {
    let c = match Option::<Scalar>::from(Scalar::from_canonical_bytes(*challenge)) {
        Some(s) => s,
        None => return false,
    };
    let mut zv_bytes = [0u8; 32];
    let mut zr_bytes = [0u8; 32];
    zv_bytes.copy_from_slice(&response[..32]);
    zr_bytes.copy_from_slice(&response[32..]);
    let z_v = match Option::<Scalar>::from(Scalar::from_canonical_bytes(zv_bytes)) {
        Some(s) => s,
        None => return false,
    };
    let z_r = match Option::<Scalar>::from(Scalar::from_canonical_bytes(zr_bytes)) {
        Some(s) => s,
        None => return false,
    };
    let c_amt = match CompressedRistretto(*c_amt_bytes).decompress() {
        Some(p) => p,
        None => return false,
    };

    let a_prime = RISTRETTO_BASEPOINT_POINT * z_v + (*PEDERSEN_H) * z_r - c_amt * c;
    let c_prime = okamoto_challenge(c_amt_bytes, &a_prime.compress().to_bytes());
    c_prime == c
}

// ============================================================================
// Serde-facing shapes (must match lib/wasm-bridge.ts ZkTransferProof et al.)
// ============================================================================

#[derive(Serialize, Deserialize, Clone)]
pub struct WasmCommitment {
    pub point: [u8; 32],
}

#[derive(Serialize, Deserialize, Clone)]
pub struct WasmRangeProof {
    pub proof_data: Vec<u8>,
    pub commitment: WasmCommitment,
}

/// Okamoto PoK of the amount commitment's opening. `challenge` = c,
/// `response` = z_v || z_r. Zero-filled placeholders are no longer emitted —
/// an all-zero challenge fails `verify_balance_proof`.
#[derive(Serialize, Deserialize, Clone)]
pub struct WasmEqualityProof {
    pub challenge: Vec<u8>,
    pub response: Vec<u8>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct WasmTransferProof {
    /// C_amt = amount·G + r_amt·H
    pub amount_commitment: WasmCommitment,
    /// C_new = remaining·G + r_new·H (sender's post-transfer commitment)
    pub remaining_commitment: WasmCommitment,
    /// Okamoto PoK of the C_amt opening (Phase 1 balance proof).
    pub balance_proof: WasmEqualityProof,
    /// `BatchedRangeProofU128Data` bytes for the ZK ElGamal Proof Program
    /// (context = [C_amt(64-bit), C_new(64-bit)]). The frontend hands this to
    /// the proof program to create a context-state account that the on-chain
    /// `private_transfer` validates (Phase 2).
    pub range_proof_data: Vec<u8>,
}

// ============================================================================
// ElGamal keypair
// ============================================================================

#[wasm_bindgen]
pub struct WasmElGamalKeypair {
    inner: ElGamalKeypair,
}

#[wasm_bindgen]
impl WasmElGamalKeypair {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: ElGamalKeypair::new_rand(),
        }
    }

    #[wasm_bindgen(js_name = "fromSecret")]
    pub fn from_secret(secret_bytes: &[u8]) -> Result<WasmElGamalKeypair, JsValue> {
        if secret_bytes.len() != 32 {
            return Err(JsValue::from_str("Secret key must be 32 bytes"));
        }
        let keypair = ElGamalKeypair::try_from(secret_bytes)
            .map_err(|_| JsValue::from_str("Invalid secret key bytes"))?;
        Ok(Self { inner: keypair })
    }

    /// 32-byte compressed ElGamal public key. Uses the sdk's stable byte API
    /// (previously an `unsafe transmute_copy` that assumed field layout — UB if
    /// the sdk repr changed).
    pub fn pubkey(&self) -> Vec<u8> {
        self.inner.pubkey().to_bytes().to_vec()
    }

    /// 32-byte ElGamal secret scalar. SECURITY: this leaves the wasm sandbox for
    /// JS — callers must never persist or log it in the clear (see
    /// contexts/PrivacyProvider.tsx; the only persisted secret should be an
    /// encrypted blob).
    pub fn secret(&self) -> Vec<u8> {
        self.inner.secret().to_bytes().to_vec()
    }

    pub fn decrypt(&self, ciphertext: &[u8]) -> Result<u64, JsValue> {
        if ciphertext.len() != 64 {
            return Err(JsValue::from_str("Ciphertext must be 64 bytes"));
        }
        let pod_ct: pod::ElGamalCiphertext = bytemuck::pod_read_unaligned(ciphertext);
        let ct = solana_zk_token_sdk::encryption::elgamal::ElGamalCiphertext::try_from(pod_ct)
            .map_err(|_| JsValue::from_str("Invalid ciphertext format"))?;

        // NOTE: decode_u32 only recovers values < 2^32. Amounts above that fail.
        self.inner
            .secret()
            .decrypt(&ct)
            .decode_u32()
            .map(|v| v as u64)
            .ok_or_else(|| JsValue::from_str("Decryption failed"))
    }
}

// ============================================================================
// Pedersen commitments & range proofs
// ============================================================================

/// Pedersen commitment `value·G + blinding·H`. Direct construction via the sdk's
/// `Pedersen::with` (replaces the old ElGamal-encrypt-and-slice hack).
#[wasm_bindgen]
pub fn create_commitment(value: u64, blinding: &[u8]) -> Result<JsValue, JsValue> {
    if blinding.len() != 32 {
        return Err(JsValue::from_str("Blinding factor must be 32 bytes"));
    }
    let opening = PedersenOpening::from_bytes(blinding)
        .ok_or_else(|| JsValue::from_str("Invalid blinding factor"))?;
    let commitment = Pedersen::with(value, &opening);
    let result = WasmCommitment {
        point: commitment.to_bytes(),
    };
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

/// Bulletproof range proof for a u64 `amount` under `blinding`, plus its
/// commitment.
#[wasm_bindgen]
pub fn create_range_proof(amount: u64, blinding: &[u8]) -> Result<JsValue, JsValue> {
    if blinding.len() != 32 {
        return Err(JsValue::from_str("Blinding factor must be 32 bytes"));
    }
    let opening = PedersenOpening::from_bytes(blinding)
        .ok_or_else(|| JsValue::from_str("Invalid blinding factor"))?;
    let commitment = Pedersen::with(amount, &opening);

    let data = RangeProofU64Data::new(&commitment, amount, &opening)
        .map_err(|e| JsValue::from_str(&format!("Proof generation failed: {:?}", e)))?;

    let result = WasmRangeProof {
        proof_data: bytes_of(&data.proof).to_vec(),
        commitment: WasmCommitment {
            point: commitment.to_bytes(),
        },
    };
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

/// Full shielded-transfer proof. See the module-level soundness note.
///
/// Requires `amount <= sender_balance` (otherwise `remaining` would wrap). The
/// caller must pass `sender_blinding` = the blinding of the sender's CURRENTLY
/// STORED commitment, so that on-chain `C_old == C_amt + C_new` holds.
#[wasm_bindgen]
pub fn create_transfer_proof(
    amount: u64,
    sender_balance: u64,
    sender_blinding: &[u8],
    amount_blinding: &[u8],
) -> Result<JsValue, JsValue> {
    if sender_blinding.len() != 32 || amount_blinding.len() != 32 {
        return Err(JsValue::from_str("Blinding factors must be 32 bytes"));
    }
    if amount > sender_balance {
        return Err(JsValue::from_str("amount exceeds sender balance"));
    }

    let r_old = PedersenOpening::from_bytes(sender_blinding)
        .ok_or_else(|| JsValue::from_str("Invalid sender blinding factor"))?;
    let r_amt = PedersenOpening::from_bytes(amount_blinding)
        .ok_or_else(|| JsValue::from_str("Invalid amount blinding factor"))?;

    // Consistent blindings: r_new = r_old - r_amt  ⇒  C_old = C_amt + C_new.
    let r_new = PedersenOpening::new(r_old.get_scalar() - r_amt.get_scalar());
    let remaining = sender_balance - amount;

    let c_amt = Pedersen::with(amount, &r_amt);
    let c_new = Pedersen::with(remaining, &r_new);
    let c_amt_bytes = c_amt.to_bytes();
    let c_new_bytes = c_new.to_bytes();

    // Phase 2 range proof: a single batched proof over [C_amt, C_new] with
    // bit-lengths [64, 64] (sum 128 → the U128 instruction), in the ZK ElGamal
    // Proof Program's format. Rebuild the commitments/openings with solana-zk-sdk
    // (its Pedersen H is identical to solana-zk-token-sdk's, so these commitments
    // are byte-equal to c_amt/c_new above — asserted in tests).
    let zk_r_amt = ZkPedersenOpening::from_bytes(amount_blinding)
        .ok_or_else(|| JsValue::from_str("Invalid amount blinding factor"))?;
    let zk_r_new = ZkPedersenOpening::from_bytes(&r_new.to_bytes())
        .ok_or_else(|| JsValue::from_str("Invalid remaining blinding factor"))?;
    let zk_c_amt = ZkPedersen::with(amount, &zk_r_amt);
    let zk_c_new = ZkPedersen::with(remaining, &zk_r_new);
    let range_data = BatchedRangeProofU128Data::new(
        vec![&zk_c_amt, &zk_c_new],
        vec![amount, remaining],
        vec![64, 64],
        vec![&zk_r_amt, &zk_r_new],
    )
    .map_err(|e| JsValue::from_str(&format!("Batched range proof failed: {:?}", e)))?;
    let range_proof_data = bytes_of(&range_data).to_vec();

    // Balance proof: Okamoto PoK of (amount, r_amt) opening C_amt.
    //   A = s_v·G + s_r·H ; c = H(C_amt, A) ; z_v = s_v + c·amount ; z_r = s_r + c·r_amt
    let s_v = rand_scalar()?;
    let s_r = rand_scalar()?;
    let a_point: RistrettoPoint = RISTRETTO_BASEPOINT_POINT * s_v + (*PEDERSEN_H) * s_r;
    let c = okamoto_challenge(&c_amt_bytes, &a_point.compress().to_bytes());
    let z_v = s_v + c * Scalar::from(amount);
    let z_r = s_r + c * r_amt.get_scalar();

    let mut response = Vec::with_capacity(64);
    response.extend_from_slice(z_v.as_bytes());
    response.extend_from_slice(z_r.as_bytes());

    let result = WasmTransferProof {
        amount_commitment: WasmCommitment { point: c_amt_bytes },
        remaining_commitment: WasmCommitment { point: c_new_bytes },
        balance_proof: WasmEqualityProof {
            challenge: c.to_bytes().to_vec(),
            response,
        },
        range_proof_data,
    };
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[derive(Serialize, Deserialize, Clone)]
pub struct WasmUnshieldProof {
    /// C_new = remaining·G + blinding·H (the sender's post-unshield commitment).
    pub commitment: WasmCommitment,
    /// `BatchedRangeProofU64Data` bytes proving `remaining ∈ [0, 2^64)`, for the
    /// ZK ElGamal Proof Program. On-chain `unshield` recomputes C_new =
    /// C_old − amount·G and requires the proof's commitment to equal it.
    pub range_proof_data: Vec<u8>,
}

/// Prove the post-unshield remaining balance is a valid 64-bit value.
///
/// `remaining` = balance − amount (amount is public in an unshield), `blinding`
/// = the sender's CURRENT balance blinding b_old (unchanged by unshield, since
/// C_new = C_old − amount·G keeps the same H-term). If `amount > balance` the
/// caller cannot produce a valid proof (a wrapped `remaining` is not in range).
#[wasm_bindgen]
pub fn create_unshield_proof(remaining: u64, blinding: &[u8]) -> Result<JsValue, JsValue> {
    if blinding.len() != 32 {
        return Err(JsValue::from_str("Blinding factor must be 32 bytes"));
    }
    let opening = ZkPedersenOpening::from_bytes(blinding)
        .ok_or_else(|| JsValue::from_str("Invalid blinding factor"))?;
    let commitment = ZkPedersen::with(remaining, &opening);

    let data = BatchedRangeProofU64Data::new(
        vec![&commitment],
        vec![remaining],
        vec![64],
        vec![&opening],
    )
    .map_err(|e| JsValue::from_str(&format!("Unshield range proof failed: {:?}", e)))?;

    let result = WasmUnshieldProof {
        commitment: WasmCommitment {
            point: commitment.to_bytes(),
        },
        range_proof_data: bytes_of(&data).to_vec(),
    };
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

/// Stealth Key Derivation: HMAC-SHA256 derivation for private links.
#[wasm_bindgen]
pub fn derive_stealth_key(root_seed: Vec<u8>, index: u32) -> Vec<u8> {
    use hmac::{Hmac, Mac};
    use sha2::Sha256;

    type HmacSha256 = Hmac<Sha256>;

    let mut mac = HmacSha256::new_from_slice(&root_seed).expect("HMAC can take key of any size");
    mac.update(b"GridTokenX_Stealth_v1");
    mac.update(&index.to_le_bytes());

    mac.finalize().into_bytes().to_vec()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn blinding(seed: u8) -> [u8; 32] {
        // A canonical, non-zero 32-byte scalar-ish seed for deterministic tests.
        let mut b = [0u8; 32];
        b[0] = seed;
        b[1] = 7;
        b
    }

    #[test]
    fn transfer_proof_conserves_value() {
        let sender_balance = 1_000u64;
        let amount = 300u64;
        let r_old_bytes = blinding(1);
        let r_amt_bytes = blinding(2);

        let r_old = PedersenOpening::from_bytes(&r_old_bytes).unwrap();
        let r_amt = PedersenOpening::from_bytes(&r_amt_bytes).unwrap();
        let r_new = PedersenOpening::new(r_old.get_scalar() - r_amt.get_scalar());

        let c_old = Pedersen::with(sender_balance, &r_old);
        let c_amt = Pedersen::with(amount, &r_amt);
        let c_new = Pedersen::with(sender_balance - amount, &r_new);

        // Conservation identity the on-chain verifier checks.
        assert_eq!(
            c_old.get_point(),
            &(c_amt.get_point() + c_new.get_point()),
            "C_old must equal C_amt + C_new"
        );
    }

    #[test]
    fn balance_proof_roundtrips() {
        // Reconstruct the proof exactly as create_transfer_proof does, without wasm.
        let amount = 42u64;
        let r_amt = PedersenOpening::from_bytes(&blinding(9)).unwrap();
        let c_amt = Pedersen::with(amount, &r_amt);
        let c_amt_bytes = c_amt.to_bytes();

        let s_v = Scalar::from(123456u64);
        let s_r = Scalar::from(987654u64);
        let a_point = RISTRETTO_BASEPOINT_POINT * s_v + (*PEDERSEN_H) * s_r;
        let c = okamoto_challenge(&c_amt_bytes, &a_point.compress().to_bytes());
        let z_v = s_v + c * Scalar::from(amount);
        let z_r = s_r + c * r_amt.get_scalar();

        let mut response = [0u8; 64];
        response[..32].copy_from_slice(z_v.as_bytes());
        response[32..].copy_from_slice(z_r.as_bytes());

        assert!(verify_balance_proof(&c_amt_bytes, &c.to_bytes(), &response));
    }

    #[test]
    fn batched_range_proof_verifies_and_matches_commitments() {
        let amount = 300u64;
        let remaining = 700u64;
        let r_amt_bytes = blinding(2);
        let r_new_bytes = blinding(5);

        let zk_r_amt = ZkPedersenOpening::from_bytes(&r_amt_bytes).unwrap();
        let zk_r_new = ZkPedersenOpening::from_bytes(&r_new_bytes).unwrap();
        let zk_c_amt = ZkPedersen::with(amount, &zk_r_amt);
        let zk_c_new = ZkPedersen::with(remaining, &zk_r_new);

        // Cross-sdk H consistency: solana-zk-sdk commitment == solana-zk-token-sdk
        // commitment for the same (value, blinding). If this breaks, the Phase-1
        // balance proof and the on-chain commitments would diverge.
        let tok_c_amt = Pedersen::with(amount, &PedersenOpening::from_bytes(&r_amt_bytes).unwrap());
        assert_eq!(
            zk_c_amt.to_bytes(),
            tok_c_amt.to_bytes(),
            "Pedersen H must be identical across the two sdks"
        );

        let data = BatchedRangeProofU128Data::new(
            vec![&zk_c_amt, &zk_c_new],
            vec![amount, remaining],
            vec![64, 64],
            vec![&zk_r_amt, &zk_r_new],
        )
        .unwrap();
        assert!(
            data.verify_proof().is_ok(),
            "batched range proof must verify under the proof program's verifier"
        );
    }

    #[test]
    fn unshield_range_proof_verifies() {
        let remaining = 500u64;
        let opening = ZkPedersenOpening::from_bytes(&blinding(4)).unwrap();
        let c = ZkPedersen::with(remaining, &opening);
        let data =
            BatchedRangeProofU64Data::new(vec![&c], vec![remaining], vec![64], vec![&opening])
                .unwrap();
        assert!(data.verify_proof().is_ok());
    }

    #[test]
    fn balance_proof_rejects_zero_placeholder() {
        // The old fake proof: all-zero challenge + response must NOT verify.
        let c_amt = Pedersen::with(1u64, &PedersenOpening::from_bytes(&blinding(3)).unwrap());
        assert!(!verify_balance_proof(&c_amt.to_bytes(), &[0u8; 32], &[0u8; 64]));
    }

    #[test]
    fn balance_proof_rejects_wrong_commitment() {
        let amount = 42u64;
        let r_amt = PedersenOpening::from_bytes(&blinding(9)).unwrap();
        let c_amt = Pedersen::with(amount, &r_amt);
        let c_amt_bytes = c_amt.to_bytes();

        let s_v = Scalar::from(5u64);
        let s_r = Scalar::from(6u64);
        let a_point = RISTRETTO_BASEPOINT_POINT * s_v + (*PEDERSEN_H) * s_r;
        let c = okamoto_challenge(&c_amt_bytes, &a_point.compress().to_bytes());
        let z_v = s_v + c * Scalar::from(amount);
        let z_r = s_r + c * r_amt.get_scalar();
        let mut response = [0u8; 64];
        response[..32].copy_from_slice(z_v.as_bytes());
        response[32..].copy_from_slice(z_r.as_bytes());

        // Verify against a DIFFERENT commitment → must fail.
        let other = Pedersen::with(43u64, &r_amt).to_bytes();
        assert!(!verify_balance_proof(&other, &c.to_bytes(), &response));
    }
}
