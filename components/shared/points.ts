/**
 * Season figures are still the placeholders the standalone points dropdown
 * shipped with — there is no points API yet. Consumed by the account menu,
 * which is the only place points surface now that the header chip is gone.
 */
export const POINTS = {
  season: 1953676,
  boost: '6.9x Boost',
  rank: '#16189',
  perDay: 0,
}

/** "1,953,676" — the account menu has room for the exact figure. */
export const formatPointsFull = (value: number) => value.toLocaleString('en-US')
