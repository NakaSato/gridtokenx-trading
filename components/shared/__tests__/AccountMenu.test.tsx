import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccountMenu from '@/components/shared/AccountMenu'

let mockIsAuthenticated = false
let mockUser: {
  username: string
  email: string
  wallet_address?: string
} | null = null
jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated, user: mockUser }),
}))

let mockPublicKey: { toBase58: () => string } | null = null
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: mockPublicKey }),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}))

// The sheet drags in balance queries and a P2P socket — out of scope here.
jest.mock('@/features/wallet/components/WalletSidebar', () => ({
  __esModule: true,
  default: ({ open }: { open?: boolean }) =>
    open ? <div data-testid="wallet-sheet" /> : null,
}))

// Stub the two dialogs so we can assert which one the menu opened without
// pulling in their API calls and theme provider.
jest.mock('@/features/auth/components/Profile', () => ({
  __esModule: true,
  default: ({ open }: { open?: boolean }) =>
    open ? <div data-testid="profile-dialog" /> : null,
}))
jest.mock('@/components/shared/Settings', () => ({
  __esModule: true,
  default: ({ open }: { open?: boolean }) =>
    open ? <div data-testid="settings-dialog" /> : null,
}))

const openMenu = async () => {
  const user = userEvent.setup()
  render(<AccountMenu />)
  await user.click(screen.getByRole('button', { name: 'Account menu' }))
  await screen.findByRole('menu')
  return user
}

const ADDRESS = '4xKkPq11AbCdEfGhJkLmNoPqRsTuVwXyZ1234567890'

beforeEach(() => {
  jest.clearAllMocks()
  mockIsAuthenticated = false
  mockUser = null
  mockPublicKey = null
})

describe('AccountMenu', () => {
  it('collapses points, profile and settings behind a single trigger', () => {
    mockIsAuthenticated = true
    mockUser = { username: 'wit', email: 'wit@example.com' }
    render(<AccountMenu />)

    // The whole point of the consolidation: one control in the header, not three.
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: 'Account menu' })
    ).toBeInTheDocument()
  })

  it('shows the user initial on the trigger when signed in', () => {
    mockIsAuthenticated = true
    mockUser = { username: 'wit', email: 'wit@example.com' }
    render(<AccountMenu />)
    expect(
      screen.getByRole('button', { name: 'Account menu' })
    ).toHaveTextContent('W')
  })

  it('offers only settings when signed out, so the theme stays reachable', async () => {
    await openMenu()
    expect(
      screen.getByRole('menuitem', { name: /Settings/ })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('menuitem', { name: /Profile/ })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Season 1 Points')).not.toBeInTheDocument()
  })

  it('shows identity, points and every entry when signed in', async () => {
    mockIsAuthenticated = true
    mockUser = { username: 'wit', email: 'wit@example.com' }
    await openMenu()

    expect(screen.getByText('wit@example.com')).toBeInTheDocument()
    expect(screen.getByText('Season 1 Points')).toBeInTheDocument()
    expect(screen.getByText('#16189')).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: /Profile/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: /Settings/ })
    ).toBeInTheDocument()
  })

  it('offers no leaderboards entry', async () => {
    mockIsAuthenticated = true
    mockUser = { username: 'wit', email: 'wit@example.com' }
    await openMenu()

    expect(
      screen.queryByRole('menuitem', { name: /Leaderboards/ })
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  })

  it('opens the profile dialog from its menu item', async () => {
    mockIsAuthenticated = true
    mockUser = { username: 'wit', email: 'wit@example.com' }
    const user = await openMenu()

    expect(screen.queryByTestId('profile-dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: /Profile/ }))

    // Dialog lives outside the dropdown, so it survives the menu closing.
    expect(await screen.findByTestId('profile-dialog')).toBeInTheDocument()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens the settings dialog from its menu item', async () => {
    const user = await openMenu()
    await user.click(screen.getByRole('menuitem', { name: /Settings/ }))

    expect(await screen.findByTestId('settings-dialog')).toBeInTheDocument()
    expect(screen.queryByTestId('profile-dialog')).not.toBeInTheDocument()
  })

  // The header chip only renders from 2xl; below that this menu is the only
  // place the address appears, so it has to carry it.
  it('carries the wallet address once one is available', async () => {
    mockIsAuthenticated = true
    mockUser = { username: 'wit', email: 'wit@example.com' }
    mockPublicKey = { toBase58: () => ADDRESS }
    await openMenu()

    expect(screen.getByText('4xKk...7890')).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: /Copy address/ })
    ).toBeInTheDocument()
  })

  it('shows no address rows when there is no wallet', async () => {
    mockIsAuthenticated = true
    mockUser = { username: 'wit', email: 'wit@example.com' }
    await openMenu()

    expect(
      screen.queryByRole('menuitem', { name: /Copy address/ })
    ).not.toBeInTheDocument()
  })

  // A wallet-only session has an address but no JWT, so the rows can't sit
  // behind the isAuthenticated gate the profile block uses.
  it('carries the address for a wallet-only session', async () => {
    mockPublicKey = { toBase58: () => ADDRESS }
    await openMenu()

    expect(screen.getByText('4xKk...7890')).toBeInTheDocument()
    expect(
      screen.queryByRole('menuitem', { name: /Profile/ })
    ).not.toBeInTheDocument()
  })

  it('falls back to the session address when the adapter is idle', async () => {
    mockIsAuthenticated = true
    mockUser = {
      username: 'wit',
      email: 'wit@example.com',
      wallet_address: ADDRESS,
    }
    await openMenu()

    expect(screen.getByText('4xKk...7890')).toBeInTheDocument()
  })

  it('copies the full address, not the truncation', async () => {
    mockIsAuthenticated = true
    mockUser = { username: 'wit', email: 'wit@example.com' }
    mockPublicKey = { toBase58: () => ADDRESS }
    const user = await openMenu()

    await user.click(screen.getByRole('menuitem', { name: /Copy address/ }))
    // user-event installs its own clipboard stub in setup(), so read it back
    // from there rather than from a hand-rolled spy.
    expect(await navigator.clipboard.readText()).toBe(ADDRESS)
  })

  it('opens the wallet sheet from the address row', async () => {
    mockIsAuthenticated = true
    mockUser = { username: 'wit', email: 'wit@example.com' }
    mockPublicKey = { toBase58: () => ADDRESS }
    const user = await openMenu()

    expect(screen.queryByTestId('wallet-sheet')).not.toBeInTheDocument()
    await user.click(screen.getByText('4xKk...7890'))

    // Mounted outside the dropdown, so it survives the menu closing.
    expect(await screen.findByTestId('wallet-sheet')).toBeInTheDocument()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
