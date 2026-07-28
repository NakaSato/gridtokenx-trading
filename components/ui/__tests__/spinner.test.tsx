import { render, screen } from '@testing-library/react'
import { Spinner } from '@/components/ui/spinner'

describe('Spinner', () => {
  it('announces itself as a loading status', () => {
    render(<Spinner />)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('always spins', () => {
    const { container } = render(<Spinner />)
    expect(container.firstChild).toHaveClass('animate-spin')
  })

  // Deliberately unsized: tailwind-merge does not treat `size-*` as conflicting
  // with `h-*`/`w-*`, so a default would stack with a caller's sizing instead of
  // being replaced by it.
  it('ships no default size for callers to fight', () => {
    const { container } = render(<Spinner className="h-8 w-8" />)
    const el = container.firstChild as HTMLElement
    expect(el).toHaveClass('h-8', 'w-8')
    // getAttribute, not .className: on an SVG that property is an
    // SVGAnimatedString, not a string.
    expect(el.getAttribute('class')).not.toMatch(/\bsize-\d/)
  })

  it('lets a caller override the label for a specific wait', () => {
    render(<Spinner aria-label="Submitting order" />)
    expect(
      screen.getByRole('status', { name: 'Submitting order' })
    ).toBeInTheDocument()
  })

  // Several call sites pass lucide's numeric size prop; a default size class
  // would have beaten the width/height attributes it sets.
  it('honours lucide numeric sizing', () => {
    const { container } = render(<Spinner size={11} />)
    expect(container.firstChild).toHaveAttribute('width', '11')
  })
})
