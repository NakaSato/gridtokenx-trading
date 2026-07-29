import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavBar from '@/components/shared/NavBar'

let mockPathname = '/'
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn() }),
}))

let mockIsAuthenticated = false
jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated, user: null }),
}))

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ connected: false }),
}))

const mockToggleLeft = jest.fn()
const mockToggleRight = jest.fn()
const mockTogglePositions = jest.fn()
jest.mock('@/components/shared/SidebarContext', () => ({
  useSidebar: () => ({
    showLeftSidebar: true,
    showRightSidebar: false,
    showPositionsPanel: true,
    toggleLeftSidebar: mockToggleLeft,
    toggleRightSidebar: mockToggleRight,
    togglePositionsPanel: mockTogglePositions,
  }),
}))

// The heavy chrome around the nav is out of scope — stub it out.
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    const DynamicStub = () => null
    return DynamicStub
  },
}))
jest.mock('@/components/shared/NavBarMobile', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/shared/NetworkStatus', () => ({
  NetworkStatus: () => null,
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

beforeEach(() => {
  jest.clearAllMocks()
  mockPathname = '/'
  mockIsAuthenticated = false
})

describe('NavBar', () => {
  it('hides auth-gated links until the user is authenticated', () => {
    render(<NavBar />)
    expect(screen.getByRole('link', { name: /Trade/ })).toBeInTheDocument()
    // Futures is public — the page renders market data signed out and only
    // gates the order form.
    expect(screen.getByRole('link', { name: /Futures/ })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Smart Meter/ })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument()

    mockIsAuthenticated = true
    render(<NavBar />)
    expect(
      screen.getByRole('link', { name: /Smart Meter/ })
    ).toBeInTheDocument()
  })

  it('groups the brand and nav on the left, controls on the right', () => {
    const { container } = render(<NavBar />)
    const header = container.querySelector('header')!

    const [left, right] = Array.from(header.children)
    const brand = screen.getByRole('link', { name: 'GridTokenX home' })
    expect(brand).toHaveAttribute('href', '/')
    // Brand leads the left group, ahead of the nav.
    expect(left).toContainElement(brand)
    expect(left).toContainElement(screen.getByRole('navigation'))
    expect(left.firstElementChild).toBe(brand)
    expect(right).toContainElement(
      screen.getByRole('group', { name: 'Layout panels' })
    )
  })

  it('places the tablet menu in the right controls, after the avatar', () => {
    const { container } = render(<NavBar />)
    const header = container.querySelector('header')!
    const [, right] = Array.from(header.children)

    const trigger = screen.getByRole('button', { name: 'Main menu' })
    expect(right).toContainElement(trigger)

    // AccountMenu is dynamic-stubbed here, so anchor on the control that
    // precedes it instead: the menu trails everything but the wallet slot.
    const panels = screen.getByRole('group', { name: 'Layout panels' })
    expect(
      panels.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('labels every inline nav item', () => {
    mockIsAuthenticated = true
    render(<NavBar />)

    // The inline row only renders from 2xl, where the labels measurably fit.
    // Names are matched loosely: jsdom applies no CSS, so the badge text that
    // is display:none below the `desktop` screen still joins the accessible name.
    for (const name of ['Trade', 'Smart Meter', 'Futures', 'Portfolio']) {
      const link = screen.getByRole('link', { name: new RegExp(name) })
      expect(link).toHaveAttribute('title', name)
      expect(link).toHaveTextContent(name)
    }
  })

  it('offers the same destinations in the tablet dropdown', async () => {
    const user = userEvent.setup()
    mockIsAuthenticated = true
    render(<NavBar />)

    // Below 2xl the inline row is hidden by CSS and this labelled dropdown is
    // the nav, so it has to carry every entry — including the resource links
    // that only get their own "More" trigger at 2xl.
    await user.click(screen.getByRole('button', { name: 'Main menu' }))
    const menu = await screen.findByRole('menu')

    for (const name of [
      'Trade',
      'Smart Meter',
      'Futures',
      'Portfolio',
      'Carbon',
      'Wallet',
    ]) {
      expect(
        within(menu).getByRole('menuitem', { name: new RegExp(name) })
      ).toBeInTheDocument()
    }
    expect(
      within(menu).getByRole('menuitem', { name: /Docs/ })
    ).toBeInTheDocument()
    expect(
      within(menu).getByRole('menuitem', { name: /Feedback/ })
    ).toBeInTheDocument()
  })

  it('names the tablet dropdown trigger after the current route', async () => {
    const user = userEvent.setup()
    mockIsAuthenticated = true
    mockPathname = '/futures'
    render(<NavBar />)

    const trigger = screen.getByRole('button', { name: 'Main menu' })
    expect(trigger).toHaveTextContent('Futures')

    await user.click(trigger)
    const menu = await screen.findByRole('menu')
    expect(
      within(menu).getByRole('menuitem', { name: /Futures/ })
    ).toHaveAttribute('aria-current', 'page')
  })

  it('marks the exact-match route as current', () => {
    mockIsAuthenticated = true
    mockPathname = '/futures'
    render(<NavBar />)
    expect(screen.getByRole('link', { name: /Futures/ })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('link', { name: /Trade/ })).not.toHaveAttribute(
      'aria-current'
    )
  })

  it('keeps the tab lit on nested routes', () => {
    mockIsAuthenticated = true
    mockPathname = '/futures/positions'
    render(<NavBar />)
    expect(screen.getByRole('link', { name: /Futures/ })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('highlights nothing on routes outside the nav', () => {
    mockIsAuthenticated = true
    mockPathname = '/login'
    render(<NavBar />)
    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current')
    }
  })

  it('reflects panel visibility via aria-pressed and toggles on click', async () => {
    const user = userEvent.setup()
    render(<NavBar />)

    const left = screen.getByRole('button', { name: 'Left sidebar' })
    const right = screen.getByRole('button', { name: 'Right sidebar' })
    expect(left).toHaveAttribute('aria-pressed', 'true')
    expect(right).toHaveAttribute('aria-pressed', 'false')

    await user.click(right)
    expect(mockToggleRight).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Positions panel' }))
    expect(mockTogglePositions).toHaveBeenCalledTimes(1)
  })
})
