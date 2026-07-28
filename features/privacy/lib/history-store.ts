import * as historyUtils from '@/lib/history-utils'

/**
 * Per-wallet encrypted activity log kept in localStorage. Entries are
 * encrypted with the key from the keyring, so the store never sees plaintext.
 */

export interface HistoryEntry {
  type: string
  amount: number
  timestamp: number
  [key: string]: unknown
}

const storageKey = (walletAddress: string) => `gtx_priv_history_${walletAddress}`

export async function appendEntry(
  walletAddress: string,
  encryptionKey: Uint8Array,
  entry: HistoryEntry
): Promise<void> {
  const encrypted = await historyUtils.encryptHistoryBlob(entry, encryptionKey)
  const key = storageKey(walletAddress)
  const current = JSON.parse(localStorage.getItem(key) || '[]')
  current.push(encrypted)
  localStorage.setItem(key, JSON.stringify(current))
}

/** Decrypts what it can; a corrupt blob is skipped rather than failing the load. */
export async function loadEntries(
  walletAddress: string,
  encryptionKey: Uint8Array
): Promise<HistoryEntry[]> {
  const stored = JSON.parse(
    localStorage.getItem(storageKey(walletAddress)) || '[]'
  )
  const decrypted: HistoryEntry[] = []
  for (const blob of stored) {
    try {
      decrypted.push(await historyUtils.decryptHistoryBlob(blob, encryptionKey))
    } catch (e) {
      console.error('History decryption failed', e)
    }
  }
  return decrypted.sort((a, b) => b.timestamp - a.timestamp)
}
