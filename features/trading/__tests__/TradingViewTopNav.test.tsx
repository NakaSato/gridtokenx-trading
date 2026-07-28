import { render, screen } from '@testing-library/react'
import TradingViewTopNav from '@/features/trading/components/TradingViewTopNav'

type Props = React.ComponentProps<typeof TradingViewTopNav>

const baseProps: Props = {
  symbol: 'Crypto.GRX/THB',
  pythSymbol: 'Crypto.GRX/THB',
  logo: '/svgs/gridx.svg',
  priceData: { price: 4.5 },
  marketData: {
    high24h: 5.1,
    low24h: 4.2,
    volume24h: 1_250_000,
    change24h: 2.45,
  },
  priceLoading: false,
  marketLoading: false,
  type: 'options',
}

const renderNav = (overrides: Partial<Props> = {}) =>
  render(<TradingViewTopNav {...baseProps} {...overrides} />)

describe('TradingViewTopNav', () => {
  it('strips the Pyth feed prefix from the displayed pair', () => {
    renderNav()
    expect(screen.getByText('GRX/THB')).toBeInTheDocument()
    expect(screen.queryByText(/Crypto\./)).not.toBeInTheDocument()
  })

  it('links the oracle label to the slugified pyth.network feed page', () => {
    renderNav()
    expect(screen.getByRole('link', { name: /Pyth Oracle/i })).toHaveAttribute(
      'href',
      'https://pyth.network/price-feeds/crypto-grx-thb'
    )
  })

  it('badges spot markets as SPOT and futures as PERP', () => {
    const { rerender } = renderNav()
    expect(screen.getByText('SPOT')).toBeInTheDocument()

    rerender(<TradingViewTopNav {...baseProps} type="futures" />)
    expect(screen.getByText('PERP')).toBeInTheDocument()
    expect(screen.queryByText('SPOT')).not.toBeInTheDocument()
  })

  it('marks the active side of the market switcher', () => {
    renderNav()
    expect(screen.getByRole('button', { name: 'Spot' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Futures' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('renders the 24h change as a signed pill only when the feed provides it', () => {
    const { rerender } = renderNav()
    expect(screen.getByLabelText('24h change')).toHaveTextContent('+2.45%')

    rerender(
      <TradingViewTopNav
        {...baseProps}
        marketData={{ ...baseProps.marketData, change24h: -1.2 }}
      />
    )
    expect(screen.getByLabelText('24h change')).toHaveTextContent('-1.20%')

    rerender(
      <TradingViewTopNav
        {...baseProps}
        marketData={{ high24h: 5.1, low24h: 4.2 }}
      />
    )
    expect(screen.queryByLabelText('24h change')).not.toBeInTheDocument()
  })

  it('omits stats whose fields are absent', () => {
    renderNav({
      marketData: { high24h: 5.1, low24h: 4.2 },
      priceData: { price: null },
    })
    // Stats render in both the desktop row and the mobile strip.
    expect(screen.getAllByText('24h High').length).toBeGreaterThan(0)
    expect(screen.queryByText('24h Volume')).not.toBeInTheDocument()
  })

  it('shows N/A when the price is missing and not loading', () => {
    renderNav({ priceData: { price: null } })
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('exposes the 24h range meter position', () => {
    // price 4.65 in [4.2, 5.1] → 50%
    renderNav({ priceData: { price: 4.65 } })
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '50')
  })

  it('colors the price by the direction of the last tick', () => {
    const { rerender } = renderNav({
      priceData: { price: 4.5 },
      marketData: {},
    })
    rerender(
      <TradingViewTopNav
        {...baseProps}
        marketData={{}}
        priceData={{ price: 4.6 }}
      />
    )
    expect(screen.getByText(/4\.6/)).toHaveClass('text-green-500')

    rerender(
      <TradingViewTopNav
        {...baseProps}
        marketData={{}}
        priceData={{ price: 4.4 }}
      />
    )
    expect(screen.getByText(/4\.4/)).toHaveClass('text-red-500')
  })
})
