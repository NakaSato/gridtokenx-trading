import type { AuthUser } from '@/types/auth'

/**
 * Every read/write of the persisted session lives here. The provider used to
 * inline these across six methods, which is how "remember me" (localStorage)
 * and session-only (sessionStorage) ended up with subtly different key sets.
 *
 * Both stores are read on load, preferring localStorage; writes go to whichever
 * the session was established in.
 */

const KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  expiresAt: 'token_expires_at',
  user: 'user',
} as const

export interface StoredSession {
  token: string | null
  rawUser: string | null
  expiresAt: number | null
}

function read(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

export function readSession(): StoredSession {
  const expiresAtRaw = read(KEYS.expiresAt)
  return {
    token: read(KEYS.accessToken),
    rawUser: read(KEYS.user),
    expiresAt: expiresAtRaw ? parseInt(expiresAtRaw) : null,
  }
}

export function readRefreshToken(): string | null {
  return read(KEYS.refreshToken)
}

/** Parses the stored user blob, treating the literal "undefined" as absent. */
export function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw || raw === 'undefined') return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch (e) {
    console.error('Failed to parse stored user:', e)
    return null
  }
}

export function persistSession(
  session: {
    accessToken: string
    refreshToken?: string
    expiresAt: number
    user: AuthUser
  },
  persistent: boolean
) {
  const store = persistent ? localStorage : sessionStorage
  store.setItem(KEYS.accessToken, session.accessToken)
  if (session.refreshToken) {
    store.setItem(KEYS.refreshToken, session.refreshToken)
  }
  store.setItem(KEYS.expiresAt, String(session.expiresAt))
  store.setItem(KEYS.user, JSON.stringify(session.user))
}

/** Rewrites the user blob in whichever store(s) already hold one. */
export function updateStoredUser(user: AuthUser) {
  if (localStorage.getItem(KEYS.user)) {
    localStorage.setItem(KEYS.user, JSON.stringify(user))
  }
  if (sessionStorage.getItem(KEYS.user)) {
    sessionStorage.setItem(KEYS.user, JSON.stringify(user))
  }
}

/** Writes a refreshed access token back into the store holding the session. */
export function persistRefreshedToken(accessToken: string, expiresAt: number) {
  const store = localStorage.getItem(KEYS.accessToken)
    ? localStorage
    : sessionStorage.getItem(KEYS.accessToken)
      ? sessionStorage
      : null
  if (!store) return
  store.setItem(KEYS.accessToken, accessToken)
  store.setItem(KEYS.expiresAt, String(expiresAt))
}

export function clearSession() {
  for (const store of [localStorage, sessionStorage]) {
    for (const key of Object.values(KEYS)) {
      store.removeItem(key)
    }
  }
}
