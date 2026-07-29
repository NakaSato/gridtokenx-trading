import React from 'react'
import { render, screen } from '@testing-library/react'
import { WalletHero } from '@/features/wallet/components/WalletHero'

// The real PublicKey works fine for construction; only the wallet adapter and
// balance hooks are mocked.
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}))

jest.mock('@/features/wallet/hooks/useWalletBalance', () => ({
  useWalletBalance: jest.fn(),
}))

jest.mock('@/features/wallet/hooks/useEscrow', () => ({
  useEscrowBalance: jest.fn(),
}))

const { useWallet } = jest.requireMock('@solana/wallet-adapter-react')
const { useWalletBalance } = jest.requireMock(
  '@/features/wallet/hooks/useWalletBalance'
)
const { useEscrowBalance } = jest.requireMock(
  '@/features/wallet/hooks/useEscrow'
)

const VALID_MINT = 'So11111111111111111111111111111111111111112'
const USER_ADDRESS = 'FvbQ7eD1YoXqXcbXCkPqheUVXqvJ3XSoJVVMzGF9LWWn'

function setup({
  connected = true,
  walletBalance = '100',
  currencyBalance = '250',
  // null = escrow query yielded no data (destructuring defaults would swallow
  // an explicit `undefined`).
  escrowUi = 40 as number | null,
  thbcEscrowUi = 15 as number | null,
  balanceUnavailable = false,
}: {
  connected?: boolean
  walletBalance?: string
  currencyBalance?: string
  escrowUi?: number | null
  thbcEscrowUi?: number | null
  /** Simulates a failed chain read: the query errors and yields no data. */
  balanceUnavailable?: boolean
} = {}) {
  useWallet.mockReturnValue({
    connected,
    publicKey: connected ? { toBase58: () => USER_ADDRESS } : null,
  })
  useWalletBalance.mockReturnValue({
    data: balanceUnavailable
      ? undefined
      : {
          wallet_address: USER_ADDRESS,
          token_balance: walletBalance,
          currency_balance: currencyBalance,
          decimals: 6,
          token_mint: VALID_MINT,
        },
    isLoading: false,
    isError: balanceUnavailable,
    refetch: jest.fn(),
  })
  // Called once per mint: the GRX escrow (mint parsed from the balance
  // response) and the THBC escrow (THB_MINT const).
  useEscrowBalance.mockImplementation(
    (mint: { toBase58(): string } | null) => {
      const ui = mint?.toBase58() === VALID_MINT ? escrowUi : thbcEscrowUi
      return {
        data:
          ui === null
            ? undefined
            : { uiAmount: ui, raw: BigInt(ui * 1_000_000) },
        isLoading: false,
        refetch: jest.fn(),
      }
    }
  )

  return render(<WalletHero />)
}

describe('WalletHero', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows the combined wallet + escrow total as the headline', () => {
    setup({ walletBalance: '100', escrowUi: 40 })
    expect(screen.getByText('140 GRX')).toBeInTheDocument()
    expect(screen.getByText('100 GRX in wallet')).toBeInTheDocument()
    expect(screen.getByText('40 GRX in escrow')).toBeInTheDocument()
    expect(screen.getByText('250 THBC in wallet')).toBeInTheDocument()
    // Settlement pays into the escrow PDA — earnings must be visible here.
    expect(screen.getByText('15 THBC in escrow')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('shows an unreadable balance as "—", never as zero', () => {
    setup({ balanceUnavailable: true, escrowUi: null })
    // A fabricated "0 GRX" would tell the user their wallet is empty during a
    // chain outage.
    expect(screen.getByText('— GRX')).toBeInTheDocument()
    expect(screen.queryByText(/^0 GRX$/)).not.toBeInTheDocument()
  })

  it('keeps the total unknown when only one leg is readable', () => {
    setup({ walletBalance: '100', escrowUi: null })
    expect(screen.getByText('— GRX')).toBeInTheDocument()
    expect(screen.getByText('100 GRX in wallet')).toBeInTheDocument()
    expect(screen.getByText('— GRX in escrow')).toBeInTheDocument()
  })

  it('shows the disconnected state without an address', () => {
    setup({ connected: false, balanceUnavailable: true, escrowUi: null })
    expect(screen.getByText('Not connected')).toBeInTheDocument()
    expect(
      screen.getByText('Connect a wallet to see its balances')
    ).toBeInTheDocument()
  })
})
