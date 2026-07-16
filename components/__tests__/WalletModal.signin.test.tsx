/**
 * Failed email sign-in must keep the WalletModal open and surface the error
 * inline (regression: AuthProvider.login toggled the global isLoading, which
 * unmounted the modal via AuthButton's loading skeleton, so a failed login
 * silently closed the dialog with only a toast).
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import WalletModal from '../WalletModal'
import { ApiClientError } from '@/lib/api/core'

const mockLogin = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}))

jest.mock('@/contexts/AuthProvider', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    isAuthenticated: false,
  }),
}))

jest.mock('@/hooks/useWalletAuth', () => ({
  useWalletAuth: () => ({ connectAndLogin: jest.fn(), isConnecting: false }),
}))

jest.mock('@/hooks/useResendVerification', () => ({
  useResendVerification: () => ({
    canResend: false,
    isResending: false,
    resendVerification: jest.fn(),
  }),
}))

// WalletList pulls in the Solana wallet adapter context — irrelevant here.
jest.mock('../WalletList', () => ({
  __esModule: true,
  default: () => <div data-testid="wallet-list" />,
}))

async function submitSignIn() {
  const user = userEvent.setup()
  await user.type(
    screen.getByLabelText(/username or email/i),
    'testuser'
  )
  await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword1!')
  await user.click(screen.getByRole('button', { name: /^sign in$/i }))
  return user
}

describe('WalletModal email sign-in failure', () => {
  beforeEach(() => jest.clearAllMocks())

  it('keeps the modal open and shows the error inline on invalid credentials', async () => {
    mockLogin.mockRejectedValue(
      new ApiClientError('Invalid username or password', 'AUTH_1001', 401)
    )
    const onClose = jest.fn()
    render(<WalletModal isOpen={true} onClose={onClose} />)

    await submitSignIn()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/sign in failed/i)
    expect(alert).toHaveTextContent('Invalid username or password')
    expect(onClose).not.toHaveBeenCalled()
    // Modal content still mounted
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument()
  })

  it('clears the inline error on a retry that verifies as unverified-email', async () => {
    mockLogin.mockRejectedValueOnce(
      new ApiClientError('Invalid username or password', 'AUTH_1001', 401)
    )
    mockLogin.mockRejectedValueOnce(
      new ApiClientError('Email not verified', 'AUTH_1005', 403)
    )
    const onClose = jest.fn()
    render(<WalletModal isOpen={true} onClose={onClose} />)

    const user = await submitSignIn()
    await screen.findByRole('alert')

    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/isn't verified yet/i)
      ).toBeInTheDocument()
    })
    expect(screen.queryByText(/sign in failed/i)).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
