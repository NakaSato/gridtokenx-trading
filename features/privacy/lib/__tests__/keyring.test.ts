import { webcrypto } from 'node:crypto'
import { deriveKeys, unlockMessage } from '../keyring'

// jsdom ships no SubtleCrypto; the real Node implementation keeps the digest
// assertions meaningful rather than mocking the thing under test.
beforeAll(() => {
  Object.defineProperty(window, 'crypto', {
    value: webcrypto,
    configurable: true,
  })
})

jest.mock('@/lib/privacy-utils', () => ({
  // Deterministic stand-in: seed mirrors the first 32 signature bytes.
  derivePrivacyRootSeed: (sig: Uint8Array) => new Uint8Array(sig.slice(0, 32)),
}))

describe('unlockMessage', () => {
  it('binds the signed message to the wallet address', () => {
    const decoded = new TextDecoder().decode(unlockMessage('WALLET_ABC'))
    expect(decoded).toContain('WALLET_ABC')
    expect(decoded).toContain('GridTokenX Privacy Access')
  })

  it('produces a different message per wallet, so a signature cannot be replayed across accounts', () => {
    expect(unlockMessage('A')).not.toEqual(unlockMessage('B'))
  })
})

describe('deriveKeys', () => {
  const signature = new Uint8Array(64).fill(7)

  it('derives the root seed from the signature', async () => {
    const { rootSeed } = await deriveKeys(signature)
    expect(Array.from(rootSeed)).toEqual(Array.from(signature.slice(0, 32)))
  })

  it('derives an encryption key distinct from the root seed', async () => {
    // The view key is handed out for read-only access, so it must not be the
    // spend seed.
    const { rootSeed, encryptionKey } = await deriveKeys(signature)
    expect(encryptionKey).toHaveLength(32)
    expect(Array.from(encryptionKey)).not.toEqual(Array.from(rootSeed))
  })

  it('is deterministic for a given signature', async () => {
    const a = await deriveKeys(signature)
    const b = await deriveKeys(signature)
    expect(Array.from(a.encryptionKey)).toEqual(Array.from(b.encryptionKey))
  })

  it('yields different keys for different signatures', async () => {
    const other = await deriveKeys(new Uint8Array(64).fill(9))
    const base = await deriveKeys(signature)
    expect(Array.from(other.encryptionKey)).not.toEqual(
      Array.from(base.encryptionKey)
    )
  })
})
