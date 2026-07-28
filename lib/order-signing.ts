import { PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'

/**
 * Canonical encoding of the off-chain order payload the user signs with their
 * wallet, and that `trading::settle_offchain_match` verifies on-chain.
 *
 * This MUST stay byte-identical to two other implementations:
 *   - on-chain  `OffchainOrderPayload::get_message()`
 *                (gridtokenx-anchor/programs/trading/src/instructions/settle_offchain.rs)
 *   - backend   `trading_core::offchain_payload::message_for()`
 *
 * The program recomputes the message from the payload it receives and rejects the
 * trade unless the Ed25519-verified message matches. A divergence here does not
 * fail at signing time — it fails later, on-chain, at settlement, with an opaque
 * error. `__tests__/order-signing.test.ts` pins the same fixture the Rust unit
 * test pins; keep them in lockstep.
 *
 * Layout — 77 bytes, integers little-endian:
 *
 *   order_id[16] ‖ user[32] ‖ energy_amount u64 ‖ price_per_kwh u64
 *                ‖ side u8 ‖ zone_id u32 ‖ expires_at i64
 */

export const OFFCHAIN_MESSAGE_LEN = 16 + 32 + 8 + 8 + 1 + 4 + 8 // 77

/** Side discriminants as encoded on-chain — not the REST API's 'buy'/'sell'. */
export const SIDE_BUY = 0
export const SIDE_SELL = 1

export interface OrderPayload {
    /** Order UUID, canonical hyphenated form. */
    orderId: string
    /** Signer's wallet. */
    user: PublicKey
    /** Energy in base units (9-dec). NOT kWh — see toBaseUnits in escrow-actions. */
    energyAmount: bigint
    /** Price in currency base units (6-dec). */
    pricePerKwh: bigint
    side: typeof SIDE_BUY | typeof SIDE_SELL
    zoneId: number
    /** Unix seconds. */
    expiresAt: bigint
}

/**
 * UUID string -> its 16 raw bytes, in the order the on-chain `[u8; 16]` expects.
 * Accepts the hyphenated form; rejects anything else rather than silently
 * producing a payload that will fail verification at settlement.
 */
export function uuidToBytes(uuid: string): Uint8Array {
    const hex = uuid.replace(/-/g, '')
    if (!/^[0-9a-fA-F]{32}$/.test(hex)) {
        throw new Error(`Invalid order UUID: ${uuid}`)
    }
    const out = new Uint8Array(16)
    for (let i = 0; i < 16; i++) {
        out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    }
    return out
}

/** Build the exact 77 bytes to be signed. */
export function buildOrderMessage(p: OrderPayload): Uint8Array {
    const msg = new Uint8Array(OFFCHAIN_MESSAGE_LEN)
    const view = new DataView(msg.buffer)

    msg.set(uuidToBytes(p.orderId), 0)
    msg.set(p.user.toBytes(), 16)
    // `true` = little-endian, matching Rust's to_le_bytes on every integer below.
    view.setBigUint64(48, p.energyAmount, true)
    view.setBigUint64(56, p.pricePerKwh, true)
    msg[64] = p.side
    view.setUint32(65, p.zoneId, true)
    // setBigInt64 (not Uint) so a negative expiry encodes as two's complement,
    // matching Rust's i64::to_le_bytes.
    view.setBigInt64(69, p.expiresAt, true)

    return msg
}

/**
 * Sign an order payload with the connected wallet.
 *
 * `signMessage` is optional on the wallet-adapter interface, so callers must
 * handle the unsupported case — mirrors the guard in `hooks/useWalletAuth.ts:111`.
 * Returns the Base58 signature the REST API and, ultimately, the Ed25519 verify
 * instruction expect.
 */
export async function signOrderPayload(
    signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined,
    payload: OrderPayload
): Promise<{ signature: string; message: Uint8Array }> {
    if (!signMessage) {
        throw new Error(
            'This wallet cannot sign messages, so the order cannot be settled on-chain.'
        )
    }
    const message = buildOrderMessage(payload)
    const signature = await signMessage(message)
    return { signature: bs58.encode(signature), message }
}
