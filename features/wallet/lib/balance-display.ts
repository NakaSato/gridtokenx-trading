/**
 * Rendering a balance the client could not read as "0.00" is the bug this module
 * exists to prevent.
 *
 * A failed chain read and a wallet that genuinely holds nothing are different
 * facts, and only one of them is a number. `GET /api/v1/wallets/{addr}/balance`
 * 500s when Chain Bridge cannot reach Solana (trading-service
 * `crates/trading-api/src/rest.rs:1326`), which surfaces here as a TanStack
 * Query error — but every display site used to fall back to `0` for missing
 * data, so an outage read as "your wallet is empty". On a financial screen that
 * is not a cosmetic difference: a user has no way to tell the figure is fiction.
 *
 * The contract: callers pass `null` for "not known" (query error, or a field the
 * backend did not report) and a value for anything the backend actually stated —
 * including a real zero, which still renders as `0.00`.
 *
 * Note the two legs that are *not* covered by this. `balance_sol` and
 * `currency_balance` are read best-effort server-side and collapse to `0` on a
 * chain error (`rest.rs:1338`, `rest.rs:1358`) rather than failing the call, so
 * a zero there is genuinely ambiguous over the wire and no client-side check can
 * recover the distinction. Fixing that needs a backend signal.
 */

/** Shown wherever a figure is unknown. Never render `0` in its place. */
export const BALANCE_UNAVAILABLE = '—'

/** Tooltip for an unavailable figure, so the em-dash isn't just a mystery. */
export const BALANCE_UNAVAILABLE_HINT =
  'Balance unavailable — the chain could not be read. This is not a zero balance.'

/**
 * Parses a balance into a number, or `null` when it is absent or unparseable.
 * The backend sends decimal strings, so `parseFloat` is the real path;
 * `Number('')` returning 0 is exactly the coercion to avoid here.
 */
export function toBalanceNumber(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(parsed) ? parsed : null
}

export interface FormatBalanceOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Formats a balance for display, or returns {@link BALANCE_UNAVAILABLE} when the
 * figure is unknown. Locale is pinned to en-US so the grouping/decimal marks
 * match the rest of the numeric UI and stay deterministic under test.
 */
export function formatBalance(
  value: string | number | null | undefined,
  {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  }: FormatBalanceOptions = {}
): string {
  const parsed = toBalanceNumber(value)
  if (parsed === null) return BALANCE_UNAVAILABLE
  return parsed.toLocaleString('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  })
}
