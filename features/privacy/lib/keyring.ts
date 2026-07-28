import * as privacyUtils from '@/lib/privacy-utils'

/**
 * Derivation of the privacy root seed and the history encryption key from a
 * wallet signature. Pure crypto — no React, no chain access — so it can be
 * tested directly.
 */

export interface PrivacyKeys {
  rootSeed: Uint8Array
  encryptionKey: Uint8Array
}

export function unlockMessage(walletAddress: string): Uint8Array {
  return new TextEncoder().encode(
    `GridTokenX Privacy Access\n\nAuthorize access to your confidential GridToken assets.\nYour balance will be recovered using your signature.\n\nWallet: ${walletAddress}`
  )
}

/**
 * Root seed comes straight from the signature; the history key is a further
 * SHA-256 so that handing out a view key never reveals the spend seed.
 */
export async function deriveKeys(signature: Uint8Array): Promise<PrivacyKeys> {
  const rootSeed = privacyUtils.derivePrivacyRootSeed(signature)
  const digest = await window.crypto.subtle.digest(
    'SHA-256',
    new Uint8Array(rootSeed).buffer
  )
  return { rootSeed, encryptionKey: new Uint8Array(digest) }
}
