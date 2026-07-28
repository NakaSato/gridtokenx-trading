import { render, screen } from '@testing-library/react'
import { LogoWordmark } from '@/components/shared/Logo'

describe('LogoWordmark', () => {
  it('renders the brand with the X split off by a space', () => {
    render(<LogoWordmark />)
    // The accent "X" is its own span, so assert on the composed text content
    // rather than an exact-text match against a single node. toHaveTextContent
    // normalises whitespace, so the space is asserted separately below.
    expect(screen.getByText(/GRIDTOKEN/)).toHaveTextContent('GRIDTOKEN X')
  })

  it('accents, italicises and enlarges only the trailing X', () => {
    const { container } = render(<LogoWordmark />)
    const accent = container.querySelector('.text-primary')
    expect(accent).toHaveTextContent('X')
    expect(accent).toHaveClass('italic')
    // em, so overriding the wrapper's text-2xl scales the X with it.
    expect(accent).toHaveClass('text-[1.25em]')
    // Exact, un-normalised: the separating space has to survive rendering.
    expect(container.textContent).toBe('GRIDTOKEN X')
  })

  it('forwards extra classes so callers can control breakpoints', () => {
    const { container } = render(<LogoWordmark className="hidden sm:inline" />)
    expect(container.firstChild).toHaveClass('hidden', 'sm:inline')
    // Untouched defaults survive alongside the caller's classes.
    expect(container.firstChild).toHaveClass('text-2xl', 'font-bold')
  })

  it('lets a caller override the default size instead of stacking sizes', () => {
    const { container } = render(<LogoWordmark className="text-xl" />)
    expect(container.firstChild).toHaveClass('text-xl')
    expect(container.firstChild).not.toHaveClass('text-2xl')
  })
})
