import { render, screen } from '@testing-library/react'
import { RatioBar } from '../RatioBar'

describe('RatioBar', () => {
  it('should render the ratio bar component', () => {
    render(<RatioBar symbol="TEST" leftPercentage={60} rightPercentage={40} />)

    const container = document.querySelector('.relative')
    expect(container).toBeInTheDocument()
  })

  it('should display correct left percentage', () => {
    render(<RatioBar symbol="TEST" leftPercentage={60} rightPercentage={40} />)

    expect(screen.getByText('60.00%')).toBeInTheDocument()
  })

  it('should display correct right percentage', () => {
    render(<RatioBar symbol="TEST" leftPercentage={60} rightPercentage={40} />)

    expect(screen.getByText('40.00%')).toBeInTheDocument()
  })

  it('should normalize percentages correctly', () => {
    render(<RatioBar symbol="TEST" leftPercentage={30} rightPercentage={70} />)

    // Total is 100, so no normalization needed
    expect(screen.getByText('30.00%')).toBeInTheDocument()
    expect(screen.getByText('70.00%')).toBeInTheDocument()
  })

  it('should normalize when total is not 100', () => {
    render(<RatioBar symbol="TEST" leftPercentage={3} rightPercentage={7} />)

    // Total is 10, normalized to 30% and 70%
    expect(screen.getByText('3.00%')).toBeInTheDocument()
    expect(screen.getByText('7.00%')).toBeInTheDocument()
  })

  it('should apply default colors', () => {
    render(<RatioBar symbol="TEST" leftPercentage={50} rightPercentage={50} />)

    const leftBar = document.querySelector('.bg-green-500')
    const rightBar = document.querySelector('.bg-red-500')

    expect(leftBar).toBeInTheDocument()
    expect(rightBar).toBeInTheDocument()
  })

  it('should apply custom left color', () => {
    render(
      <RatioBar
        symbol="TEST"
        leftPercentage={50}
        rightPercentage={50}
        leftColor="bg-blue-500"
      />
    )

    const leftBar = document.querySelector('.bg-blue-500')
    expect(leftBar).toBeInTheDocument()
  })

  it('should apply custom right color', () => {
    render(
      <RatioBar
        symbol="TEST"
        leftPercentage={50}
        rightPercentage={50}
        rightColor="bg-yellow-500"
      />
    )

    const rightBar = document.querySelector('.bg-yellow-500')
    expect(rightBar).toBeInTheDocument()
  })

  it('should handle zero left percentage', () => {
    render(<RatioBar symbol="TEST" leftPercentage={0} rightPercentage={100} />)

    expect(screen.getByText('0.00%')).toBeInTheDocument()
    expect(screen.getByText('100.00%')).toBeInTheDocument()
  })

  it('should handle zero right percentage', () => {
    render(<RatioBar symbol="TEST" leftPercentage={100} rightPercentage={0} />)

    expect(screen.getByText('100.00%')).toBeInTheDocument()
    expect(screen.getByText('0.00%')).toBeInTheDocument()
  })

  it('should handle equal percentages', () => {
    render(<RatioBar symbol="TEST" leftPercentage={50} rightPercentage={50} />)

    const leftBar = document.querySelector('.bg-green-500')
    const rightBar = document.querySelector('.bg-red-500')

    // Both bars should have 50% width
    expect(leftBar).toHaveStyle({ width: '50%' })
    expect(rightBar).toHaveStyle({ width: '50%' })
  })

  it('should handle decimal percentages', () => {
    render(
      <RatioBar
        symbol="TEST"
        leftPercentage={33.333}
        rightPercentage={66.666}
      />
    )

    expect(screen.getByText('33.33%')).toBeInTheDocument()
    expect(screen.getByText('66.67%')).toBeInTheDocument()
  })

  it('should handle very small percentages', () => {
    render(
      <RatioBar symbol="TEST" leftPercentage={0.01} rightPercentage={99.99} />
    )

    expect(screen.getByText('0.01%')).toBeInTheDocument()
    expect(screen.getByText('99.99%')).toBeInTheDocument()
  })

  it('should handle very large percentages', () => {
    render(
      <RatioBar symbol="TEST" leftPercentage={10000} rightPercentage={10000} />
    )

    // Both should be 50% when normalized
    expect(screen.getByText('10000.00%')).toBeInTheDocument()
  })
})
