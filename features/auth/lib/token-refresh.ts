import { computeRefreshDelay } from '@/lib/jwt'

/**
 * Proactive access-token refresh. A timer fires before the token expires and
 * swaps it for a fresh one; without it the 24h token silently expires
 * mid-session and every subsequent request 401s.
 *
 * The indirection through a mutable holder is what breaks the
 * schedule ⇄ refresh cycle: the scheduler is created once, while the refresh
 * closure is recreated every render and must always be called in its latest
 * form.
 */
export interface RefreshScheduler {
  /** Arm the timer against an absolute expiry (ms since epoch). */
  schedule: (expiresAtMs: number) => void
  /** Cancel any pending refresh. */
  cancel: () => void
}

export function createRefreshScheduler(
  getRefreshFn: () => () => Promise<boolean>
): RefreshScheduler {
  let timeout: ReturnType<typeof setTimeout> | undefined

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
  }

  const schedule = (expiresAtMs: number) => {
    cancel()
    const delay = computeRefreshDelay(expiresAtMs - Date.now())
    if (delay === null) return
    timeout = setTimeout(() => {
      void getRefreshFn()()
    }, delay)
  }

  return { schedule, cancel }
}
