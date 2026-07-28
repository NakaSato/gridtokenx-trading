import { render, screen } from '@testing-library/react'
import { PortfolioHero } from '@/features/portfolio/components/portfolio-hero'

jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null }),
}))

jest.mock('@/features/portfolio/components/portfolio-stats-row', () => ({
  PortfolioStatsRow: () => null,
}))

jest.mock('@/features/portfolio/hooks/usePortfolio', () => ({
  useProfile: jest.fn(),
  useWallets: jest.fn(),
  useMarketPrice: jest.fn(),
  useWalletBalance: jest.fn(),
}))

const { useProfile, useWallets, useMarketPrice, useWalletBalance } =
  jest.requireMock('@/features/portfolio/hooks/usePortfolio')

/**
 * Mirrors `GET /api/v1/wallets/{addr}/balance` as the handler builds it
 * (trading-api/src/rest.rs:1367) — both legs, decimal strings, decimals per leg.
 */
const balance = (overrides: Record<string, unknown> = {}) => ({
  wallet_address: 'WALLET',
  token_balance: '35.000000000',
  token_balance_raw: 35_000_000_000,
  decimals: 9,
  token_mint: 'MINT',
  token_account: 'ATA',
  balance_sol: 1,
  currency_balance: '1250.000000',
  currency_balance_raw: 1_250_000_000,
  currency_decimals: 6,
  currency_mint: 'THBC',
  ...overrides,
})

function setup({
  balanceData = balance(),
  isError = false,
  vwap = '10',
  tradeCount = 5,
}: {
  balanceData?: Record<string, unknown>
  isError?: boolean
  vwap?: string
  tradeCount?: number
} = {}) {
  useProfile.mockReturnValue({
    data: {
      username: 'wit',
      email: 'wit@example.com',
      role: 'prosumer',
      wallet_address: 'WALLET',
    },
    isLoading: false,
    refetch: jest.fn(),
  })
  useWallets.mockReturnValue({ data: [] })
  useMarketPrice.mockReturnValue({ data: { vwap, trade_count: tradeCount } })
  useWalletBalance.mockReturnValue({
    data: isError ? undefined : balanceData,
    isLoading: false,
    isError,
    refetch: jest.fn(),
  })
  return render(<PortfolioHero />)
}

describe('PortfolioHero', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows the THBC leg alongside GRX', () => {
    setup()
    expect(screen.getByText(/35\.00 GRX/)).toBeInTheDocument()
    expect(screen.getByText(/1,250\.00 THBC/)).toBeInTheDocument()
  })

  it('makes THBC the headline total wealth, at face value', () => {
    setup()
    expect(screen.getByText('฿1,250.00')).toBeInTheDocument()
    // The energy leg is priced separately and must NOT be blended in
    // (35 GRX x ฿10 VWAP = ฿350 would make the headline ฿1,600).
    expect(screen.queryByText('฿1,600.00')).not.toBeInTheDocument()
    expect(screen.getByText(/≈\s*฿350\.00/)).toBeInTheDocument()
  })

  it('treats an unreported THBC leg as unknown, not zero', () => {
    setup({ balanceData: balance({ currency_balance: undefined }) })
    expect(screen.getByText(/— THBC/)).toBeInTheDocument()
    // The headline is the unknown one; "฿0.00" would claim the user is broke.
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('฿0.00')).not.toBeInTheDocument()
  })

  it('shows "—" rather than a zero balance when the chain read fails', () => {
    setup({ isError: true })
    expect(screen.getByText(/— GRX/)).toBeInTheDocument()
    expect(screen.getByText(/— THBC/)).toBeInTheDocument()
    expect(screen.getByText(/Balance unavailable/)).toBeInTheDocument()
    expect(screen.queryByText(/0\.00 GRX/)).not.toBeInTheDocument()
  })
})
