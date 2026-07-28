import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavBarMobile from '@/components/shared/NavBarMobile'

let mockPathname = '/'
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn() }),
}))

const WALLET = 'GRiD1111111111111111111111111111111111111X'

let mockIsAuthenticated = false
let mockUser: {
  username: string
  email: string
  wallet_address?: string
} | null = null
const mockLogout = jest.fn()
jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockUser,
    logout: mockLogout,
  }),
}))

let mockConnected = false
let mockPublicKey: { toBase58: () => string } | null = null
const mockDisconnect = jest.fn()
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    connected: mockConnected,
    publicKey: mockPublicKey,
    disconnect: mockDisconnect,
  }),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    const DynamicStub = () => null
    return DynamicStub
  },
}))
jest.mock('@/components/shared/Logo', () => ({
  Logo: () => <span data-testid="logo" />,
  LogoWordmark: () => <span data-testid="wordmark">GRIDTOKENX</span>,
}))
jest.mock('@/features/auth/components/AuthButton', () => ({
  __esModule: true,
  default: ({ signInText }: { signInText: string }) => (
    <button>{signInText}</button>
  ),
}))

const openMenu = async () => {
  const user = userEvent.setup()
  render(<NavBarMobile />)
  await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
  await screen.findByRole('dialog')
  return user
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPathname = '/'
  mockIsAuthenticated = false
  mockUser = null
  mockConnected = false
  mockPublicKey = null
})

describe('NavBarMobile', () => {
  it('hides auth-gated links until the user is authenticated', async () => {
    await openMenu()
    expect(screen.getByRole('link', { name: /Trade/ })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Futures/ })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Connect Wallet' })
    ).toBeInTheDocument()
  })

  it('shows the full menu and no connect button when authenticated', async () => {
    mockIsAuthenticated = true
    await openMenu()
    expect(screen.getByRole('link', { name: /Futures/ })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Smart Meter/ })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Connect Wallet' })
    ).not.toBeInTheDocument()
  })

  it('drops hideOnMobile entries even when authenticated', async () => {
    mockIsAuthenticated = true
    await openMenu()

    for (const name of ['Portfolio', 'Carbon', 'Wallet']) {
      expect(
        screen.queryByRole('link', { name: new RegExp(`^${name}$`) })
      ).not.toBeInTheDocument()
    }
  })

  it('still lights nothing else up on a hidden route', async () => {
    mockIsAuthenticated = true
    mockPathname = '/portfolio'
    await openMenu()

    // Portfolio is gone from the list, but it must not hand its highlight to
    // Trade — activeRoute is computed over the unfiltered list for that reason.
    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current')
    }
  })

  it('marks the current route, including nested paths', async () => {
    mockIsAuthenticated = true
    mockPathname = '/futures/positions'
    await openMenu()
    expect(screen.getByRole('link', { name: /Futures/ })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('link', { name: /Trade/ })).not.toHaveAttribute(
      'aria-current'
    )
  })

  it('renders Docs as an external link and Feedback as internal', async () => {
    await openMenu()
    expect(screen.getByRole('link', { name: /Docs/ })).toHaveAttribute(
      'target',
      '_blank'
    )
    expect(screen.getByRole('link', { name: /Feedback/ })).not.toHaveAttribute(
      'target'
    )
  })

  it('closes the menu when a nav link is clicked', async () => {
    const user = await openMenu()
    await user.click(screen.getByRole('link', { name: /Trade/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('NavBarMobile — account row', () => {
  it('shows no account row and offers Connect Wallet when signed out', async () => {
    await openMenu()
    expect(screen.queryByText('Account')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Connect Wallet' })
    ).toBeInTheDocument()
  })

  it('shows the truncated wallet address instead of the connect button', async () => {
    mockConnected = true
    mockPublicKey = { toBase58: () => WALLET }
    await openMenu()

    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('GRiD...111X')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Connect Wallet' })
    ).not.toBeInTheDocument()
  })

  it('copies the full address, not the truncated form', async () => {
    mockConnected = true
    mockPublicKey = { toBase58: () => WALLET }
    const user = await openMenu()

    // Stub after openMenu: userEvent.setup() installs its own clipboard stub,
    // and jsdom exposes navigator.clipboard as a getter-only property.
    const writeText = jest.fn()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    await user.click(
      screen.getByRole('button', { name: 'Copy wallet address' })
    )
    expect(writeText).toHaveBeenCalledWith(WALLET)
  })

  it('prefers the live adapter key over the address stored on the user', async () => {
    mockIsAuthenticated = true
    mockUser = {
      username: 'wit',
      email: 'wit@example.com',
      wallet_address: 'STALE1111111111111111111111111111111STALE',
    }
    mockConnected = true
    mockPublicKey = { toBase58: () => WALLET }
    await openMenu()

    expect(screen.getByText('GRiD...111X')).toBeInTheDocument()
    expect(screen.queryByText(/STALE/)).not.toBeInTheDocument()
  })

  it('falls back to the account identity when the session has no wallet', async () => {
    mockIsAuthenticated = true
    mockUser = { username: 'wit', email: 'wit@example.com' }
    await openMenu()

    expect(screen.getByText('wit')).toBeInTheDocument()
    expect(screen.getByText('wit@example.com')).toBeInTheDocument()
    // Nothing to copy without an address.
    expect(
      screen.queryByRole('button', { name: 'Copy wallet address' })
    ).not.toBeInTheDocument()
  })

  it('logs out an authenticated session and closes the menu', async () => {
    mockIsAuthenticated = true
    mockUser = { username: 'wit', email: 'wit@example.com' }
    const user = await openMenu()

    await user.click(screen.getByRole('button', { name: 'Log out' }))
    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockDisconnect).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('disconnects a wallet-only session rather than logging out', async () => {
    mockConnected = true
    mockPublicKey = { toBase58: () => WALLET }
    const user = await openMenu()

    await user.click(screen.getByRole('button', { name: 'Disconnect wallet' }))
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
    expect(mockLogout).not.toHaveBeenCalled()
  })
})
