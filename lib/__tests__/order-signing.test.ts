import { PublicKey } from '@solana/web3.js'
import {
  buildOrderMessage,
  uuidToBytes,
  signOrderPayload,
  OFFCHAIN_MESSAGE_LEN,
  SIDE_BUY,
  SIDE_SELL,
  type OrderPayload,
} from '../order-signing'

const hex = (b: Uint8Array) =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')

// Same fixture pinned by the Rust unit test in
// gridtokenx-trading-service/crates/trading-core/src/offchain_payload.rs.
// If one side changes, change both — a divergence only surfaces on-chain.
const FIXTURE: OrderPayload = {
  orderId: '01020304-0506-0708-090a-0b0c0d0e0f10',
  user: new PublicKey(new Uint8Array(32).fill(0xab)),
  energyAmount: BigInt(5_000_000_000), // 5 kWh @ 9 decimals
  pricePerKwh: BigInt(2_500_000), // 2.50 @ 6 decimals
  side: SIDE_SELL,
  zoneId: 1,
  expiresAt: BigInt(1_800_000_000),
}

const EXPECTED_HEX =
  '0102030405060708090a0b0c0d0e0f10' + // order_id
  'abababababababababababababababababababababababababababababababab' + // user
  '00f2052a01000000' + // energy 5e9 LE
  'a025260000000000' + // price 2_500_000 LE
  '01' + // side = sell
  '01000000' + // zone_id = 1
  '00d2496b00000000' // expires_at LE

describe('buildOrderMessage', () => {
  it('matches the byte-for-byte fixture pinned by the Rust encoder', () => {
    expect(hex(buildOrderMessage(FIXTURE))).toBe(EXPECTED_HEX)
  })

  it('is exactly 77 bytes', () => {
    expect(buildOrderMessage(FIXTURE)).toHaveLength(OFFCHAIN_MESSAGE_LEN)
    expect(OFFCHAIN_MESSAGE_LEN).toBe(77)
  })

  it('encodes a buy differently from a sell', () => {
    const buy = buildOrderMessage({ ...FIXTURE, side: SIDE_BUY })
    const sell = buildOrderMessage({ ...FIXTURE, side: SIDE_SELL })
    expect(hex(buy)).not.toBe(hex(sell))
  })

  it('encodes a negative expiry as two-s complement, like Rust i64::to_le_bytes', () => {
    const m = buildOrderMessage({ ...FIXTURE, expiresAt: BigInt(-1) })
    expect(hex(m.slice(69))).toBe('ffffffffffffffff')
  })

  it('places each field at the offset the on-chain parser expects', () => {
    const m = buildOrderMessage({
      ...FIXTURE,
      energyAmount: BigInt(7),
      pricePerKwh: BigInt(9),
      zoneId: 3,
    })
    expect(hex(m.slice(48, 56))).toBe('0700000000000000')
    expect(hex(m.slice(56, 64))).toBe('0900000000000000')
    expect(m[64]).toBe(SIDE_SELL)
    expect(hex(m.slice(65, 69))).toBe('03000000')
  })
})

describe('uuidToBytes', () => {
  it('rejects a malformed UUID rather than emitting an unverifiable payload', () => {
    expect(() => uuidToBytes('not-a-uuid')).toThrow(/Invalid order UUID/)
    expect(() => uuidToBytes('0102030405060708090a0b0c0d0e0f')).toThrow(
      /Invalid order UUID/
    )
  })

  it('accepts the hyphenated form', () => {
    expect(hex(uuidToBytes('01020304-0506-0708-090a-0b0c0d0e0f10'))).toBe(
      '0102030405060708090a0b0c0d0e0f10'
    )
  })
})

describe('signOrderPayload', () => {
  it('signs the canonical message and returns a Base58 signature', async () => {
    const signMessage = jest.fn(async (m: Uint8Array) =>
      new Uint8Array(64).fill(0x01)
    )
    const { signature, message } = await signOrderPayload(signMessage, FIXTURE)

    expect(hex(signMessage.mock.calls[0][0])).toBe(EXPECTED_HEX)
    expect(hex(message)).toBe(EXPECTED_HEX)
    expect(typeof signature).toBe('string')
    expect(signature.length).toBeGreaterThan(0)
  })

  it('fails clearly when the wallet cannot sign messages', async () => {
    await expect(signOrderPayload(undefined, FIXTURE)).rejects.toThrow(
      /cannot sign messages/
    )
  })
})
