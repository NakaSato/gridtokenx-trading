import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EscrowManager } from '@/features/wallet/components/EscrowManager'
import { THB_MINT } from '@/lib/const'

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}))

jest.mock('@/features/wallet/hooks/useWalletBalance', () => ({
  useWalletBalance: jest.fn(),
}))

jest.mock('@/features/wallet/hooks/useEscrow', () => ({
  useEscrowBalance: jest.fn(),
  useDepositEscrow: jest.fn(),
  useWithdrawEscrow: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}))

const { useWallet } = jest.requireMock('@solana/wallet-adapter-react')
const { useWalletBalance } = jest.requireMock(
  '@/features/wallet/hooks/useWalletBalance'
)
const { useEscrowBalance, useDepositEscrow, useWithdrawEscrow } =
  jest.requireMock('@/features/wallet/hooks/useEscrow')

const GRX_MINT = 'So11111111111111111111111111111111111111112'

function setup({
  connected = true,
  walletGrx = '100',
  walletThbc = '250',
  grxEscrow = 40,
  thbcEscrow = 15,
}: {
  connected?: boolean
  walletGrx?: string
  walletThbc?: string
  grxEscrow?: number
  thbcEscrow?: number
} = {}) {
  const depositMutateAsync = jest.fn().mockResolvedValue('sig'.padEnd(20, 'x'))
  const withdrawMutateAsync = jest.fn().mockResolvedValue('sig'.padEnd(20, 'y'))

  useWallet.mockReturnValue({
    connected,
    publicKey: connected ? { toBase58: () => 'user' } : null,
  })
  useWalletBalance.mockReturnValue({
    data: {
      token_balance: walletGrx,
      currency_balance: walletThbc,
      // GRX is 9-dec on-chain; distinguishes it from THBC's 6 in submissions.
      decimals: 9,
      token_mint: GRX_MINT,
    },
    isLoading: false,
  })
  useEscrowBalance.mockImplementation(
    (mint: { toBase58(): string } | null) => {
      const ui = mint?.toBase58() === GRX_MINT ? grxEscrow : thbcEscrow
      return {
        data: { uiAmount: ui, raw: BigInt(Math.round(ui * 1e6)) },
        isLoading: false,
      }
    }
  )
  useDepositEscrow.mockReturnValue({
    mutateAsync: depositMutateAsync,
    isPending: false,
  })
  useWithdrawEscrow.mockReturnValue({
    mutateAsync: withdrawMutateAsync,
    isPending: false,
  })

  const utils = render(<EscrowManager />)
  return { ...utils, depositMutateAsync, withdrawMutateAsync }
}

describe('EscrowManager', () => {
  beforeEach(() => jest.clearAllMocks())

  it('defaults to withdrawing GRX, capped at the GRX escrow balance', () => {
    setup()
    expect(
      screen.getByTestId('escrow-direction-withdraw')
    ).toBeInTheDocument()
    expect(screen.getByText(/Max: 40 GRX/)).toBeInTheDocument()
    expect(screen.getByText('100 GRX')).toBeInTheDocument() // wallet row
    expect(screen.getByText('40 GRX')).toBeInTheDocument() // escrow row
  })

  it('withdraws GRX with the energy mint and its 9 decimals', async () => {
    const { withdrawMutateAsync } = setup()
    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '10' },
    })
    fireEvent.click(screen.getByTestId('escrow-manager-submit'))
    await waitFor(() => expect(withdrawMutateAsync).toHaveBeenCalledTimes(1))
    const params = withdrawMutateAsync.mock.calls[0][0]
    expect(params.mint.toBase58()).toBe(GRX_MINT)
    expect(params.decimals).toBe(9)
    expect(params.amountUi).toBe('10')
  })

  it('withdraws THBC with the currency mint and 6 decimals', async () => {
    const { withdrawMutateAsync } = setup()
    fireEvent.click(screen.getByTestId('escrow-asset-thbc'))
    expect(screen.getByText(/Max: 15 THBC/)).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '15' },
    })
    fireEvent.click(screen.getByTestId('escrow-manager-submit'))
    await waitFor(() => expect(withdrawMutateAsync).toHaveBeenCalledTimes(1))
    const params = withdrawMutateAsync.mock.calls[0][0]
    expect(params.mint.toBase58()).toBe(THB_MINT.toBase58())
    expect(params.decimals).toBe(6)
  })

  it('caps deposits at the wallet balance for the selected asset', async () => {
    const { depositMutateAsync } = setup()
    fireEvent.click(screen.getByTestId('escrow-direction-deposit'))
    expect(screen.getByText(/Max: 100 GRX/)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('escrow-asset-thbc'))
    expect(screen.getByText(/Max: 250 THBC/)).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '200' },
    })
    fireEvent.click(screen.getByTestId('escrow-manager-submit'))
    await waitFor(() => expect(depositMutateAsync).toHaveBeenCalledTimes(1))
    expect(depositMutateAsync.mock.calls[0][0].mint.toBase58()).toBe(
      THB_MINT.toBase58()
    )
  })

  it('blocks amounts above the available balance', () => {
    setup({ grxEscrow: 40 })
    fireEvent.change(screen.getByTestId('escrow-amount-input'), {
      target: { value: '41' },
    })
    expect(screen.getByTestId('escrow-manager-submit')).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('exceeds available')
  })

  it('shows the connect prompt instead of a submit when disconnected', () => {
    setup({ connected: false })
    expect(
      screen.queryByTestId('escrow-manager-submit')
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/Connect your wallet to move GRX/)
    ).toBeInTheDocument()
  })
})
