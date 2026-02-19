import { render, screen } from '@testing-library/react'
import { Logo } from '../Logo'

describe('Logo', () => {
  it('should render the SVG logo', () => {
    render(<Logo />)

    const svg =
      screen.getByRole('img', { hidden: true })?.closest('svg') ||
      document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should render with default dimensions', () => {
    render(<Logo />)

    const svg = document.querySelector('svg')
    expect(svg).toHaveAttribute('width', '110')
    expect(svg).toHaveAttribute('height', '50')
  })

  it('should render with custom dimensions', () => {
    render(<Logo width={200} height={100} />)

    const svg = document.querySelector('svg')
    expect(svg).toHaveAttribute('width', '200')
    expect(svg).toHaveAttribute('height', '100')
  })

  it('should apply custom className', () => {
    render(<Logo className="custom-class" />)

    const svg = document.querySelector('svg')
    expect(svg).toHaveClass('custom-class')
  })

  it('should have correct viewBox', () => {
    render(<Logo />)

    const svg = document.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 70 70')
  })

  it('should contain circle element', () => {
    render(<Logo />)

    const circle = document.querySelector('circle')
    expect(circle).toBeInTheDocument()
  })

  it('should contain path elements', () => {
    render(<Logo />)

    const paths = document.querySelectorAll('path')
    expect(paths.length).toBeGreaterThan(0)
  })

  it('should have correct default fill color', () => {
    render(<Logo />)

    const group = document.querySelector('g')
    expect(group).toHaveAttribute('fill', '#35D0BA')
  })

  it('should render with zero dimensions without crashing', () => {
    render(<Logo width={0} height={0} />)

    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should render with very large dimensions', () => {
    render(<Logo width={1000} height={1000} />)

    const svg = document.querySelector('svg')
    expect(svg).toHaveAttribute('width', '1000')
    expect(svg).toHaveAttribute('height', '1000')
  })
})
