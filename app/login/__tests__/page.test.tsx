/**
 * The login page must not offer a wallet as a way in while IAM has no
 * wallet-verify endpoint — a wallet grid there leads to a signature prompt that
 * can only 501. It comes back the moment WALLET_LOGIN_SUPPORTED flips.
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoginPage from '@/app/login/page'

let mockWalletLoginSupported = false

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({
    login: jest.fn(),
    isAuthenticated: false,
    isLoading: false,
  }),
}))

jest.mock('@/features/auth/lib/useWalletAuth', () => ({
  useWalletAuth: () => ({
    connectAndLogin: jest.fn(),
    isConnecting: false,
    walletLoginSupported: mockWalletLoginSupported,
  }),
}))

jest.mock('@/features/auth/lib/useResendVerification', () => ({
  useResendVerification: () => ({
    canResend: false,
    isResending: false,
    resendVerification: jest.fn(),
  }),
}))

// WalletList reaches for the Solana adapter context — irrelevant here.
jest.mock('@/features/auth/components/WalletList', () => ({
  __esModule: true,
  default: () => <div data-testid="wallet-list" />,
}))

afterEach(() => {
  mockWalletLoginSupported = false
})

describe('LoginPage — wallet login unsupported', () => {
  it('hides the wallet grid and explains what the wallet is for', () => {
    render(<LoginPage />)

    expect(screen.queryByTestId('wallet-list')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Accounts are email and password/i)
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument()
  })
})

describe('LoginPage — wallet login supported', () => {
  it('offers the wallet grid alongside the email form', () => {
    mockWalletLoginSupported = true
    render(<LoginPage />)

    expect(screen.getByTestId('wallet-list')).toBeInTheDocument()
    expect(screen.getByText(/Or sign in with email/i)).toBeInTheDocument()
  })
})
