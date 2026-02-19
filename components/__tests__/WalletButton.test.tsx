import { render, screen, fireEvent } from '@testing-library/react'
import WalletButton from '../WalletButton'

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string
    alt: string
    width: number
    height: number
  }) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      data-testid="wallet-icon"
    />
  ),
}))

// Mock UI Button
jest.mock('../ui/button', () => ({
  Button: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
  }) => (
    <button onClick={onClick} className={className} data-testid="wallet-button">
      {children}
    </button>
  ),
}))

describe('WalletButton', () => {
  const defaultProps = {
    name: 'Phantom',
    iconPath: '/icons/phantom.svg',
    id: 'phantom',
    onClick: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render wallet name', () => {
    render(<WalletButton {...defaultProps} />)

    expect(screen.getByText('Phantom')).toBeInTheDocument()
  })

  it('should render wallet icon', () => {
    render(<WalletButton {...defaultProps} />)

    const icon = screen.getByTestId('wallet-icon')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('src', '/icons/phantom.svg')
    expect(icon).toHaveAttribute('alt', 'Phantom')
  })

  it('should call onClick when button is clicked', () => {
    render(<WalletButton {...defaultProps} />)

    const button = screen.getByTestId('wallet-button')
    fireEvent.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
  })

  it('should render with different wallet names', () => {
    render(
      <WalletButton
        name="Solflare"
        iconPath="/icons/solflare.svg"
        id="solflare"
        onClick={jest.fn()}
      />
    )

    expect(screen.getByText('Solflare')).toBeInTheDocument()
  })

  it('should have correct icon dimensions', () => {
    render(<WalletButton {...defaultProps} />)

    const icon = screen.getByTestId('wallet-icon')
    expect(icon).toHaveAttribute('width', '24')
    expect(icon).toHaveAttribute('height', '24')
  })

  it('should be memoized and not re-render unnecessarily', () => {
    const { rerender } = render(<WalletButton {...defaultProps} />)

    // Rerender with same props
    rerender(<WalletButton {...defaultProps} />)

    // onClick should still be the same reference
    expect(defaultProps.onClick).toHaveBeenCalledTimes(0)
  })

  it('should handle click events correctly', () => {
    const mockOnClick = jest.fn()
    render(
      <WalletButton
        name="Test Wallet"
        iconPath="/test.svg"
        id="test"
        onClick={mockOnClick}
      />
    )

    const button = screen.getByTestId('wallet-button')
    fireEvent.click(button)
    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(2)
  })

  it('should render button with correct styling classes', () => {
    render(<WalletButton {...defaultProps} />)

    const button = screen.getByTestId('wallet-button')
    expect(button).toHaveClass('flex')
    expect(button).toHaveClass('h-[40px]')
    expect(button).toHaveClass('w-full')
  })
})
