/**
 * ZK ElGamal Proof Program (native) instruction builders.
 *
 * The trading program's `private_transfer` / `unshield` don't verify bulletproof
 * range proofs themselves (compute budget). Instead the client asks this native
 * program to verify a batched range proof and persist the verified commitments
 * into a "context-state" account, which the trading instruction then reads.
 *
 * No TS SDK ships for this program, so the instructions are built by hand from
 * `solana-zk-sdk::zk_elgamal_proof_program` (instruction discriminants + the
 * `ProofContextState<BatchedRangeProofContext>` layout).
 */
import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  Keypair,
  Connection,
} from '@solana/web3.js'

export const ZK_ELGAMAL_PROOF_PROGRAM_ID = new PublicKey(
  'ZkE1Gama1Proof11111111111111111111111111111'
)

// ProofInstruction discriminants (repr(u8), 0-indexed).
const CLOSE_CONTEXT_STATE = 0
const VERIFY_BATCHED_RANGE_PROOF_U64 = 6
const VERIFY_BATCHED_RANGE_PROOF_U128 = 7

// ProofContextState<BatchedRangeProofContext> byte size:
//   context_state_authority(32) + proof_type(1) + commitments(8*32) + bit_lengths(8)
export const RANGE_PROOF_CONTEXT_STATE_LEN = 32 + 1 + 8 * 32 + 8 // 297

/**
 * Build the instructions that produce a verified range-proof context-state
 * account. `proofData` is the `BatchedRangeProof{U64|U128}Data` bytes from
 * wasm-zk; `payer` becomes the context authority (can later close it).
 *
 * IMPORTANT: `createIx` and `verifyIx` MUST be sent in SEPARATE transactions,
 * and both BEFORE the trading instruction (which reads the persisted context).
 * The U128 range proof is ~1000 bytes, so `createAccount` + `verify` together
 * exceed the 1232-byte transaction limit (verified against a live validator).
 * `contextAccount` must sign the `createIx` transaction.
 */
export async function buildRangeProofContext(
  connection: Connection,
  payer: PublicKey,
  proofData: Uint8Array | number[],
  variant: 'u64' | 'u128'
): Promise<{
  contextAccount: Keypair
  createIx: TransactionInstruction
  verifyIx: TransactionInstruction
  closeIx: TransactionInstruction
}> {
  const contextAccount = Keypair.generate()
  const lamports = await connection.getMinimumBalanceForRentExemption(
    RANGE_PROOF_CONTEXT_STATE_LEN
  )

  const createIx = SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: contextAccount.publicKey,
    lamports,
    space: RANGE_PROOF_CONTEXT_STATE_LEN,
    programId: ZK_ELGAMAL_PROOF_PROGRAM_ID,
  })

  // Proof supplied inline (instruction data), so the optional proof-source
  // account is omitted: accounts = [context (writable), context owner].
  const disc =
    variant === 'u64'
      ? VERIFY_BATCHED_RANGE_PROOF_U64
      : VERIFY_BATCHED_RANGE_PROOF_U128
  const data = Buffer.concat([Buffer.from([disc]), Buffer.from(proofData)])

  const verifyIx = new TransactionInstruction({
    programId: ZK_ELGAMAL_PROOF_PROGRAM_ID,
    keys: [
      { pubkey: contextAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: payer, isSigner: false, isWritable: false },
    ],
    data,
  })

  const closeIx = closeRangeProofContext(
    contextAccount.publicKey,
    payer,
    payer
  )

  return { contextAccount, createIx, verifyIx, closeIx }
}

/** Close a range-proof context-state account, refunding rent to `destination`. */
export function closeRangeProofContext(
  context: PublicKey,
  destination: PublicKey,
  owner: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    programId: ZK_ELGAMAL_PROOF_PROGRAM_ID,
    keys: [
      { pubkey: context, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([CLOSE_CONTEXT_STATE]),
  })
}
