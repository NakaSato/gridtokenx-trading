import { renderHook, act } from '@testing-library/react'
import toast from 'react-hot-toast'
import { useWalletAuth } from '@/features/auth/lib/useWalletAuth'

// --- mocks -----------------------------------------------------------------

// Toggled per-describe: false is today's reality (IAM has no wallet-verify
// endpoint), true covers the signing path that ships with it.
let mockWalletLoginSupported = false
jest.mock('@/lib/api/auth', () => ({
  get WALLET_LOGIN_SUPPORTED() {
    return mockWalletLoginSupported
  },
  WALLET_LOGIN_UNSUPPORTED_MESSAGE: 'wallet login unsupported',
}))

const mockSelect = jest.fn()
const mockLoginWithWallet = jest.fn()
const mockUpdateWallet = jest.fn()
let mockWallets: any[] = []
let mockAuthState = { user: null as any, isAuthenticated: false }

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ select: mockSelect, wallets: mockWallets }),
}))

jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({
    loginWithWallet: mockLoginWithWallet,
    updateWallet: mockUpdateWallet,
    user: mockAuthState.user,
    isAuthenticated: mockAuthState.isAuthenticated,
  }),
}))

const mockRouterRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh, push: jest.fn() }),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }),
}))

// bs58.encode → deterministic stub so we can assert the payload.
jest.mock('bs58', () => ({
  __esModule: true,
  default: { encode: () => 'ENCODED_SIGNATURE' },
}))

// Builds a fake wallet adapter entry as exposed by useWallet().wallets.
const makeWallet = (
  name: string,
  overrides: Partial<{
    readyState: string
    publicKey: { toString: () => string } | null
    signMessage: jest.Mock
    disconnect: jest.Mock
  }> = {}
) => {
  const connect = jest.fn().mockResolvedValue(undefined)
  return {
    adapter: {
      name,
      readyState: overrides.readyState ?? 'Installed',
      publicKey: overrides.publicKey ?? { toString: () => `${name}-PUBKEY` },
      connect,
      signMessage:
        overrides.signMessage ??
        jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      disconnect: overrides.disconnect ?? jest.fn().mockResolvedValue(undefined),
    },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockWallets = []
  mockWalletLoginSupported = false
  mockAuthState = { user: null, isAuthenticated: false }
  jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
  ;(global as any).window = global.window || {}
  ;(window as any).open = jest.fn()
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('useWalletAuth — signed out, wallet login unsupported', () => {
  it('never connects or prompts for a signature it cannot redeem', async () => {
    const wallet = makeWallet('Phantom')
    mockWallets = [wallet]

    const { result } = renderHook(() => useWalletAuth())
    await act(async () => {
      await result.current.connectAndLogin('Phantom')
    })

    expect(mockSelect).not.toHaveBeenCalled()
    expect(wallet.adapter.connect).not.toHaveBeenCalled()
    expect(wallet.adapter.signMessage).not.toHaveBeenCalled()
    expect(mockLoginWithWallet).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('wallet login unsupported')
  })

  it('reports the capability so callers can hide the wallet grid', () => {
    const { result } = renderHook(() => useWalletAuth())
    expect(result.current.walletLoginSupported).toBe(false)
  })
})

describe('useWalletAuth — signed-out login flow (endpoint available)', () => {
  beforeEach(() => {
    mockWalletLoginSupported = true
  })

  it.each(['Phantom', 'Solflare', 'Trust', 'SafePal'])(
    'signs a challenge and calls loginWithWallet for %s',
    async (walletName) => {
      const wallet = makeWallet(walletName)
      mockWallets = [wallet]

      const { result } = renderHook(() => useWalletAuth())
      await act(async () => {
        await result.current.connectAndLogin(walletName)
      })

      expect(mockSelect).toHaveBeenCalledWith(walletName)
      expect(wallet.adapter.connect).toHaveBeenCalled()
      expect(wallet.adapter.signMessage).toHaveBeenCalledWith(
        new TextEncoder().encode(
          'Sign in to GridTokenX. Timestamp: 1700000000000'
        )
      )
      expect(mockLoginWithWallet).toHaveBeenCalledWith({
        wallet_address: `${walletName}-PUBKEY`,
        signature: 'ENCODED_SIGNATURE',
        message: 'Sign in to GridTokenX. Timestamp: 1700000000000',
        timestamp: 1_700_000_000_000,
      })
    }
  )

  it('disconnects and does not login when the signature is rejected', async () => {
    const signMessage = jest
      .fn()
      .mockRejectedValue(new Error('User rejected the request'))
    const disconnect = jest.fn().mockResolvedValue(undefined)
    const wallet = makeWallet('Phantom', { signMessage, disconnect })
    mockWallets = [wallet]

    const { result } = renderHook(() => useWalletAuth())
    await act(async () => {
      await result.current.connectAndLogin('Phantom')
    })

    expect(mockLoginWithWallet).not.toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalled()
  })
})

describe('useWalletAuth — signed-in linking flow', () => {
  it('links the wallet via updateWallet instead of logging in', async () => {
    mockAuthState = { user: { id: 'u1' }, isAuthenticated: true }
    const wallet = makeWallet('Solflare')
    mockWallets = [wallet]

    const { result } = renderHook(() => useWalletAuth())
    await act(async () => {
      await result.current.connectAndLogin('Solflare')
    })

    expect(mockUpdateWallet).toHaveBeenCalledWith('Solflare-PUBKEY')
    expect(mockLoginWithWallet).not.toHaveBeenCalled()
  })
})

describe('useWalletAuth — not installed', () => {
  it('opens the install page and never connects', async () => {
    // Signed in, so the flow gets past the wallet-login capability gate and
    // reaches the readyState check.
    mockAuthState = { user: { id: 'u1' }, isAuthenticated: true }
    const wallet = makeWallet('Phantom', { readyState: 'Unsupported' })
    mockWallets = [wallet]

    const { result } = renderHook(() => useWalletAuth())
    await act(async () => {
      await result.current.connectAndLogin('Phantom')
    })

    expect(window.open).toHaveBeenCalledWith('https://phantom.app/', '_blank')
    expect(wallet.adapter.connect).not.toHaveBeenCalled()
    expect(mockLoginWithWallet).not.toHaveBeenCalled()
  })
})
