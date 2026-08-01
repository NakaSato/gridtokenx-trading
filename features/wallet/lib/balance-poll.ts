/**
 * How often the wallet balance is re-fetched.
 *
 * Three hooks read the same balance — `useUserBalance`, `useWalletBalance`, and
 * the namesake in `features/portfolio/hooks/usePortfolio.ts` — and they all sit
 * on `queryKeys.wallet.balance`, so they share one cache entry and one timer.
 * When observers of a key disagree on the interval TanStack Query takes the
 * shortest one, which makes a stray value here silently win everywhere. Change
 * it in one place instead.
 */
export const BALANCE_POLL_MS = 10_000
