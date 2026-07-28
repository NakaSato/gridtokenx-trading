import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WalletTransfer } from '@/features/wallet/components/WalletTransfer'

// The real PublicKey works fine for construction; only the wallet adapter,
// hooks, and toast layers are mocked.
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}))

jest.mock('@/hooks/useWalletBalance', () => ({
  useWalletBalance: jest.fn(),
}))

jest.mock('@/hooks/useEscrow', () => ({
  useEscrowBalance: jest.fn(),
  useDepositEscrow: jest.fn(),
  useWithdrawEscrow: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}))

const { useWallet } = jest.requireMock('@solana/wallet-adapter-react')
const { useWalletBalance } = jest.requireMock('@/hooks/useWalletBalance')
const { useEscrowBalance, useDepositEscrow, useWithdrawEscrow } =
  jest.requireMock('@/hooks/useEscrow')

const VALID_MINT = 'So11111111111111111111111111111111111111112'

function setup({
  connected = true,
  walletBalance = '100',
  escrowUi = 40,
  depositPending = false,
}: {
  connected?: boolean
  walletBalance?: string
  escrowUi?: number
  depositPending?: boolean
} = {}) {
  const depositMutateAsync = jest.fn().mockResolvedValue('sig'.padEnd(20, 'x'))
  const withdrawMutateAsync = jest.fn().mockResolvedValue('sig'.padEnd(20, 'y'))

  useWallet.mockReturnValue({
    connected,
    publicKey: connected ? { toBase58: () => 'user' } : null,
    sendTransaction: jest.fn(),
  })
  useWalletBalance.mockReturnValue({
    data: {
      token_balance: walletBalance,
      decimals: 6,
      token_mint: VALID_MINT,
    },
    isLoading: false,
  })
  useEscrowBalance.mockReturnValue({
    data: { uiAmount: escrowUi, raw: BigInt(escrowUi * 1_000_000) },
    isLoading: false,
  })
  useDepositEscrow.mockReturnValue({
    mutateAsync: depositMutateAsync,
    isPending: depositPending,
  })
  useWithdrawEscrow.mockReturnValue({
    mutateAsync: withdrawMutateAsync,
    isPending: false,
  })

  const utils = render(<WalletTransfer />)
  return { ...utils, depositMutateAsync, withdrawMutateAsync }
}

describe('WalletTransfer', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders both deposit and withdraw tabs with balances', () => {
    setup()
    expect(screen.getByTestId('deposit-tab')).toBeInTheDocument()
    expect(screen.getByTestId('withdraw-tab')).toBeInTheDocument()
    expect(screen.getByText('Wallet Balance')).toBeInTheDocument()
    expect(screen.getByText('On-chain Escrow')).toBeInTheDocument()
    expect(screen.getByText('100 GRX')).toBeInTheDocument()
    expect(screen.getByText('40 GRX')).toBeInTheDocument()
  })

  it('shows connect-wallet state instead of submit when disconnected', () => {
    setup({ connected: false })
    expect(screen.queryByTestId('escrow-submit-button')).not.toBeInTheDocument()
    expect(screen.getByText(/Connect your wallet to deposit/)).toBeInTheDocument()
  })

  it('disables submit when deposit amount exceeds wallet balance', () => {
    setup({ walletBalance: '10' })
    fireEvent.change(screen.getByTestId('escrow-amount-input'), { target: { value: '11' } })
    expect(screen.getByTestId('escrow-submit-button')).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('exceeds available')
  })

  it('submits a valid deposit with parsed params', async () => {
    const { depositMutateAsync } = setup()
    fireEvent.change(screen.getByTestId('escrow-amount-input'), { target: { value: '2.5' } })
    const button = screen.getByTestId('escrow-submit-button')
    expect(button).toBeEnabled()
    fireEvent.click(button)

    await waitFor(() => expect(depositMutateAsync).toHaveBeenCalledTimes(1))
    const params = depositMutateAsync.mock.calls[0][0]
    expect(params.amountUi).toBe('2.5')
    expect(params.decimals).toBe(6)
    expect(params.mint.toBase58()).toBe(VALID_MINT)
    await waitFor(() =>
      expect(screen.getByText(/Deposited 2.5 GRX/)).toBeInTheDocument()
    )
  })

  it('blocks withdraw above escrow balance but allows within it', async () => {
    const { withdrawMutateAsync } = setup({ escrowUi: 40 })
    // Radix tab triggers activate on mousedown, not click
    fireEvent.mouseDown(screen.getByTestId('withdraw-tab'))

    fireEvent.change(screen.getByTestId('escrow-amount-input'), { target: { value: '41' } })
    expect(screen.getByTestId('escrow-submit-button')).toBeDisabled()

    fireEvent.change(screen.getByTestId('escrow-amount-input'), { target: { value: '40' } })
    const button = screen.getByTestId('escrow-submit-button')
    expect(button).toBeEnabled()
    fireEvent.click(button)
    await waitFor(() => expect(withdrawMutateAsync).toHaveBeenCalledTimes(1))
    expect(withdrawMutateAsync.mock.calls[0][0].amountUi).toBe('40')
  })

  it('shows an error message when the transaction fails', async () => {
    const { depositMutateAsync } = setup()
    depositMutateAsync.mockRejectedValueOnce(new Error('User rejected the request'))
    fireEvent.change(screen.getByTestId('escrow-amount-input'), { target: { value: '1' } })
    fireEvent.click(screen.getByTestId('escrow-submit-button'))
    await waitFor(() =>
      expect(screen.getByText('User rejected the request')).toBeInTheDocument()
    )
  })

  it('disables submit while the mutation is pending', () => {
    setup({ depositPending: true })
    fireEvent.change(screen.getByTestId('escrow-amount-input'), { target: { value: '1' } })
    expect(screen.getByTestId('escrow-submit-button')).toBeDisabled()
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })
})
