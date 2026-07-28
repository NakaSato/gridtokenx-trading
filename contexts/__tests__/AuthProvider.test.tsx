/**
 * AuthProvider.login/register/loginWithWallet must not toggle the global
 * isLoading flag — it means "initial auth check in progress" and gates
 * skeletons that unmount the sign-in modal (AuthButton). Regression test for
 * the failed-login-closes-modal bug.
 */
import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthProvider, useAuth } from '../AuthProvider'

const mockApiClient = {
  login: jest.fn(),
  register: jest.fn(),
  verifyWalletSignature: jest.fn(),
  getProfile: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  setToken: jest.fn(),
  clearToken: jest.fn(),
}

jest.mock('@/lib/api/useApiClient', () => ({
  useApiClient: () => mockApiClient,
}))

function Probe({ onAuth }: { onAuth: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth()
  onAuth(auth)
  return <div data-testid="loading">{String(auth.isLoading)}</div>
}

describe('AuthProvider action loading', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('does not flip isLoading while a login is in flight or after it fails', async () => {
    let resolveLogin!: (v: unknown) => void
    mockApiClient.login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve
      })
    )

    let auth!: ReturnType<typeof useAuth>
    render(
      <AuthProvider>
        <Probe onAuth={(a) => (auth = a)} />
      </AuthProvider>
    )

    // Initial checkAuth (no stored token) settles quickly.
    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    )

    let loginPromise!: Promise<unknown>
    act(() => {
      loginPromise = auth.login('user', 'password123!').catch(() => undefined)
    })

    // Mid-flight: still not "loading" — the modal must stay mounted.
    expect(screen.getByTestId('loading')).toHaveTextContent('false')

    await act(async () => {
      resolveLogin({ error: 'Invalid credentials', status: 401 })
      await loginPromise
    })

    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(auth.isAuthenticated).toBe(false)
  })

  it('rejects with the backend error on failed login', async () => {
    mockApiClient.login.mockResolvedValue({
      error: 'Invalid username or password',
      code: 'AUTH_1001',
      status: 401,
    })

    let auth!: ReturnType<typeof useAuth>
    render(
      <AuthProvider>
        <Probe onAuth={(a) => (auth = a)} />
      </AuthProvider>
    )
    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    )

    await expect(auth.login('user', 'password123!')).rejects.toThrow(
      'Invalid username or password'
    )
  })
})
