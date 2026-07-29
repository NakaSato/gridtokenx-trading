import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WalletActions } from '@/features/wallet/components/WalletActions'

jest.mock('@/features/wallet/hooks/useWalletBalance', () => ({
  useWalletBalance: jest.fn(),
}))

jest.mock('@/features/portfolio/hooks/usePortfolio', () => ({
  useMarketPrice: jest.fn(),
}))

jest.mock('@/features/p2p/hooks/useP2PMarket', () => ({
  useP2PBestPrices: jest.fn(),
}))

jest.mock('@/features/wallet/hooks/useAutoSwap', () => {
  const actual = jest.requireActual('@/features/wallet/hooks/useAutoSwap')
  return {
    MIN_SWAP_KWH: actual.MIN_SWAP_KWH,
    useAutoSwap: jest.fn(),
  }
})

jest.mock('@/features/wallet/hooks/useSwapTracker', () => ({
  useSwapTracker: jest.fn(),
}))

// Covered by its own suite (EscrowManager.test.tsx) — stub it here so this
// suite doesn't need the wallet-adapter/escrow mocks it pulls in.
jest.mock('@/features/wallet/components/EscrowManager', () => ({
  EscrowManager: () => <div data-testid="escrow-manager-stub" />,
}))

jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({ token: 'jwt' }),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}))

const { useWalletBalance } = jest.requireMock(
  '@/features/wallet/hooks/useWalletBalance'
)
const { useMarketPrice } = jest.requireMock(
  '@/features/portfolio/hooks/usePortfolio'
)
const { useP2PBestPrices } = jest.requireMock(
  '@/features/p2p/hooks/useP2PMarket'
)
const { useAutoSwap } = jest.requireMock('@/features/wallet/hooks/useAutoSwap')
const { useSwapTracker } = jest.requireMock(
  '@/features/wallet/hooks/useSwapTracker'
)

function setup({
  grxBalance = '100',
  thbcBalance = '250',
  vwap = '4.00' as string | null,
  bestBid = null as number | null,
  bestAsk = null as number | null,
  swapPending = false,
  trackingStage = 'idle',
  trackingTxHash = null as string | null,
}: {
  grxBalance?: string
  thbcBalance?: string
  /** null = the market has never traded (no price). */
  vwap?: string | null
  bestBid?: number | null
  bestAsk?: number | null
  swapPending?: boolean
  trackingStage?: string
  trackingTxHash?: string | null
} = {}) {
  useWalletBalance.mockReturnValue({
    data: {
      token_balance: grxBalance,
      currency_balance: thbcBalance,
      decimals: 6,
      token_mint: 'So11111111111111111111111111111111111111112',
    },
    isLoading: false,
  })
  useMarketPrice.mockReturnValue({
    data:
      vwap === null
        ? { vwap: '0', trade_count: 0 }
        : { vwap, trade_count: 12 },
  })
  useP2PBestPrices.mockReturnValue({ bestBid, bestAsk })

  const mutateAsync = jest
    .fn()
    .mockResolvedValue({ id: 'order-1', status: 'pending' })
  useAutoSwap.mockReturnValue({ mutateAsync, isPending: swapPending })
  useSwapTracker.mockReturnValue({
    stage: trackingStage,
    txHash: trackingTxHash,
    trade: null,
  })

  const utils = render(<WalletActions />)
  return { ...utils, mutateAsync }
}

describe('WalletActions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the four flows with deposit active by default', () => {
    setup()
    expect(screen.getByTestId('fiat-deposit-tab')).toBeInTheDocument()
    expect(screen.getByTestId('swap-tab')).toBeInTheDocument()
    expect(screen.getByTestId('fiat-withdraw-tab')).toBeInTheDocument()
    expect(screen.getByTestId('escrow-tab')).toBeInTheDocument()
    expect(screen.getByTestId('fiat-deposit-submit')).toBeInTheDocument()
  })

  it('renders the escrow manager on the escrow tab', () => {
    setup()
    fireEvent.mouseDown(screen.getByTestId('escrow-tab'))
    expect(screen.getByTestId('escrow-manager-stub')).toBeInTheDocument()
  })

  it('previews a 1:1 THBC credit for a THB deposit', () => {
    setup()
    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '500' },
    })
    expect(screen.getByText('500 THBC')).toBeInTheDocument()
  })

  it('quotes THBC→GRX from the VWAP when the book is empty, and flips', () => {
    setup({ vwap: '4.00' })
    fireEvent.mouseDown(screen.getByTestId('swap-tab'))

    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '100' },
    })
    // 100 THBC / ฿4 per GRX = 25 GRX
    expect(screen.getByText('≈ 25 GRX')).toBeInTheDocument()
    expect(screen.getByText(/1 GRX ≈ ฿4.00 · market VWAP/)).toBeInTheDocument()
    // From-side is capped at the THBC balance
    expect(screen.getByText(/Max: 250 THBC/)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('swap-flip-button'))
    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '10' },
    })
    // 10 GRX x ฿4 = 40 THBC, capped at the GRX balance
    expect(screen.getByText('≈ 40 THBC')).toBeInTheDocument()
    expect(screen.getByText(/Max: 100 GRX/)).toBeInTheDocument()
  })

  it('prefers the live book top over the VWAP for the quote', () => {
    setup({ vwap: '4.00', bestAsk: 5 })
    fireEvent.mouseDown(screen.getByTestId('swap-tab'))
    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '100' },
    })
    // 100 THBC / ฿5 best ask = 20 GRX — the fill price, not the VWAP
    expect(screen.getByText('≈ 20 GRX')).toBeInTheDocument()
    expect(
      screen.getByText(/1 GRX ≈ ฿5.00 · best ask in the live book/)
    ).toBeInTheDocument()
  })

  it('submits a THBC→GRX swap sized in kWh', async () => {
    const { mutateAsync } = setup({ vwap: '4.00', bestAsk: 4, bestBid: 3.9 })
    fireEvent.mouseDown(screen.getByTestId('swap-tab'))
    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '100' },
    })
    const button = screen.getByTestId('swap-submit')
    expect(button).toBeEnabled()
    fireEvent.click(button)

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1))
    expect(mutateAsync).toHaveBeenCalledWith({
      direction: 'thbc-to-grx',
      energyKwh: 25,
      bestBid: 3.9,
    })
    await waitFor(() =>
      expect(screen.getByText(/Swap order placed/)).toBeInTheDocument()
    )
    // The placed order is handed to the settlement tracker.
    await waitFor(() =>
      expect(useSwapTracker).toHaveBeenLastCalledWith('order-1')
    )
  })

  it('shows live settlement progress for the tracked order', () => {
    setup({ trackingStage: 'settling' })
    fireEvent.mouseDown(screen.getByTestId('swap-tab'))
    expect(screen.getByTestId('swap-progress')).toHaveTextContent(
      'settling on-chain'
    )
  })

  it('shows the settlement tx hash once the swap settles', () => {
    setup({
      trackingStage: 'settled',
      trackingTxHash: 'abcdefghMIDDLE12345678',
    })
    fireEvent.mouseDown(screen.getByTestId('swap-tab'))
    const progress = screen.getByTestId('swap-progress')
    expect(progress).toHaveTextContent('Settled on-chain')
    expect(progress).toHaveTextContent('abcdefgh…12345678')
  })

  it('blocks an instant GRX→THBC sell when the book has no buyers', () => {
    setup({ vwap: '4.00', bestBid: null })
    fireEvent.mouseDown(screen.getByTestId('swap-tab'))
    fireEvent.click(screen.getByTestId('swap-flip-button'))
    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '10' },
    })
    expect(screen.getByText(/No buyers in the book/)).toBeInTheDocument()
    expect(screen.getByTestId('swap-submit')).toBeDisabled()
  })

  it('rejects swaps below the 0.1 kWh engine minimum', () => {
    setup({ vwap: '4.00', bestAsk: 4 })
    fireEvent.mouseDown(screen.getByTestId('swap-tab'))
    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '0.2' }, // 0.2 THBC / ฿4 = 0.05 kWh < 0.1
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Minimum swap size')
    expect(screen.getByTestId('swap-submit')).toBeDisabled()
  })

  it('shows "—" and an explanation when the market has never traded', () => {
    setup({ vwap: null })
    fireEvent.mouseDown(screen.getByTestId('swap-tab'))
    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '100' },
    })
    // A quote from a nonexistent price would be a guess — render unknown.
    expect(screen.getByText('— GRX')).toBeInTheDocument()
    expect(
      screen.getByText(/No market price yet/, { selector: 'p' })
    ).toBeInTheDocument()
    expect(screen.getByTestId('swap-submit')).toBeDisabled()
  })

  it('caps withdrawals at the live THBC balance', () => {
    setup({ thbcBalance: '250' })
    fireEvent.mouseDown(screen.getByTestId('fiat-withdraw-tab'))
    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '251' },
    })
    expect(screen.getByRole('alert')).toHaveTextContent('exceeds available')
  })

  it('keeps the fiat flows gated while their backends are not connected', () => {
    setup()
    expect(screen.getByTestId('fiat-deposit-submit')).toBeDisabled()
    fireEvent.mouseDown(screen.getByTestId('fiat-withdraw-tab'))
    expect(screen.getByTestId('fiat-withdraw-submit')).toBeDisabled()
  })
})
