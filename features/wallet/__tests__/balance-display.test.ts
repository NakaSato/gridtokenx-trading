import {
  BALANCE_UNAVAILABLE,
  formatBalance,
  toBalanceNumber,
} from '@/features/wallet/lib/balance-display'

describe('toBalanceNumber', () => {
  it('parses the backend decimal-string form', () => {
    expect(toBalanceNumber('35.000000000')).toBe(35)
    expect(toBalanceNumber('0.000000001')).toBe(0.000000001)
  })

  it('passes numbers through, including a real zero', () => {
    expect(toBalanceNumber(0)).toBe(0)
    expect(toBalanceNumber(12.5)).toBe(12.5)
  })

  it('returns null — not 0 — for absent or unparseable values', () => {
    expect(toBalanceNumber(undefined)).toBeNull()
    expect(toBalanceNumber(null)).toBeNull()
    // Number('') is 0; that coercion is the bug this guards against.
    expect(toBalanceNumber('')).toBeNull()
    expect(toBalanceNumber('not-a-number')).toBeNull()
    expect(toBalanceNumber(NaN)).toBeNull()
  })
})

describe('formatBalance', () => {
  it('formats a known balance', () => {
    expect(formatBalance('1234.5')).toBe('1,234.50')
    expect(formatBalance(35, { maximumFractionDigits: 6 })).toBe('35.00')
  })

  it('renders a genuine zero as a number', () => {
    expect(formatBalance('0.000000000')).toBe('0.00')
    expect(formatBalance(0)).toBe('0.00')
  })

  it('renders an unknown balance as the em-dash, never as zero', () => {
    expect(formatBalance(null)).toBe(BALANCE_UNAVAILABLE)
    expect(formatBalance(undefined)).toBe(BALANCE_UNAVAILABLE)
    expect(formatBalance('')).toBe(BALANCE_UNAVAILABLE)
  })

  it('honours fraction-digit overrides', () => {
    expect(
      formatBalance(100, { minimumFractionDigits: 0, maximumFractionDigits: 6 })
    ).toBe('100')
    expect(
      formatBalance('0.1234567', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
      })
    ).toBe('0.123457')
  })
})
