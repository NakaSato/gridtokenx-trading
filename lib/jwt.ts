// Pure JWT / token-refresh timing helpers, extracted so the auth + socket
// layers share one implementation and the logic is unit-testable in isolation.

/**
 * Returns true when a JWT's `exp` claim is in the past (within `skewMs`) or the
 * token is unparseable. Used to avoid opening / reconnecting a WebSocket with a
 * token the gateway will reject — an expired token otherwise drives an endless
 * connect → 401 → onclose → reconnect loop (hundreds of /ws 401s at apisix).
 *
 * A token with no numeric `exp` claim is treated as *not* expired (we can't
 * prove it is); a malformed token is treated as expired (fail closed).
 */
export const isJwtExpired = (jwt: string, skewMs = 10_000): boolean => {
  try {
    const [, payload] = jwt.split('.')
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof claims.exp !== 'number') return false
    return claims.exp * 1000 <= Date.now() + skewMs
  } catch {
    return true
  }
}

/**
 * Computes the delay (ms) before a proactive token refresh should fire, given
 * the time remaining until expiry. Refresh at ~80% of remaining lifetime,
 * floored at 10s so we never hammer the endpoint — but never schedule *past*
 * expiry: a near-expired token (e.g. restored from storage) returns 0 so the
 * caller refreshes immediately instead of waiting for a timer that would fire
 * after the token is already dead (guaranteed 401).
 *
 * Returns `null` when the token is already expired (nothing to schedule).
 */
export const computeRefreshDelay = (remainingMs: number): number | null => {
  if (remainingMs <= 0) return null
  let delay = Math.max(remainingMs * 0.8, 10_000)
  if (delay >= remainingMs) delay = 0
  return delay
}
