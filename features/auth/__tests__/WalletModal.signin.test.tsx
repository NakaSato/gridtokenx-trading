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
import WalletModal from '@/features/auth/components/WalletModal'
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

jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    isAuthenticated: false,
  }),
}))

jest.mock('@/features/auth/lib/useWalletAuth', () => ({
  useWalletAuth: () => ({
    connectAndLogin: jest.fn(),
    isConnecting: false,
    walletLoginSupported: false,
  }),
}))

jest.mock('@/features/auth/lib/useResendVerification', () => ({
  useResendVerification: () => ({
    canResend: false,
    isResending: false,
    resendVerification: jest.fn(),
  }),
}))

// WalletList pulls in the Solana wallet adapter context — irrelevant here.
jest.mock('@/features/auth/components/WalletList', () => ({
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

// userEvent drives a Radix dialog here (per-keystroke re-render + focus
// management), which overruns the 5s default when the suite runs in parallel.
const SLOW_UI_TIMEOUT = 20_000

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
    // App-owned copy from loginErrorMessage, not IAM's raw prose.
    expect(alert).toHaveTextContent('Incorrect username or password.')
    expect(onClose).not.toHaveBeenCalled()
    // Modal content still mounted
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument()
  }, SLOW_UI_TIMEOUT)

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
  }, SLOW_UI_TIMEOUT)

  it('does not console.error an outcome it already explains to the user', async () => {
    // Next's dev overlay hooks console.error, so logging an expected rejection
    // throws a full-screen "Console ApiClientError" over the form the user was
    // about to correct.
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    mockLogin.mockRejectedValue(
      new ApiClientError('Email not verified', 'AUTH_1005', 403)
    )
    render(<WalletModal isOpen={true} onClose={jest.fn()} />)

    await submitSignIn()
    await screen.findByText(/isn't verified yet/i)

    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  }, SLOW_UI_TIMEOUT)

  it('still logs a failure the UI cannot explain', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    mockLogin.mockRejectedValue(new TypeError('r.map is not a function'))
    render(<WalletModal isOpen={true} onClose={jest.fn()} />)

    await submitSignIn()
    await screen.findByRole('alert')

    expect(consoleError).toHaveBeenCalledWith(
      'Unexpected sign-in failure:',
      expect.any(TypeError)
    )
    consoleError.mockRestore()
  }, SLOW_UI_TIMEOUT)

  it('reports a too-short username inline instead of a vanishing toast', async () => {
    const user = userEvent.setup()
    render(<WalletModal isOpen={true} onClose={jest.fn()} />)

    await user.type(screen.getByLabelText(/username or email/i), 'ab')
    await user.type(screen.getByLabelText(/^password$/i), 'password1!')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /between 3 and 50 characters/i
    )
    expect(mockLogin).not.toHaveBeenCalled()
  }, SLOW_UI_TIMEOUT)
})
