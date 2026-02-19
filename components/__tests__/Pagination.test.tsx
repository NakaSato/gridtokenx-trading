import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from '../Pagination'

describe('Pagination', () => {
  const mockOnPageChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render pagination component', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByRole('button', { name: /chevron/i })).toBeInTheDocument()
  })

  it('should display correct page numbers for few pages', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={30}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    // Should show pages 1, 2, 3
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should highlight current page', () => {
    render(
      <Pagination
        currentPage={2}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const currentPageButton = screen.getByText('2')
    expect(currentPageButton).toHaveClass('bg-primary')
  })

  it('should call onPageChange when page is clicked', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    fireEvent.click(screen.getByText('2'))

    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('should disable previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const prevButton = screen.getAllByRole('button')[0]
    expect(prevButton).toBeDisabled()
  })

  it('should enable previous button when not on first page', () => {
    render(
      <Pagination
        currentPage={2}
        totalItems={100}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const prevButton = screen.getAllByRole('button')[0]
    expect(prevButton).not.toBeDisabled()
  })

  it('should call onPageChange with previous page when prev clicked', () => {
    render(
      <Pagination
        currentPage={3}
        totalItems={100}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const prevButton = screen.getAllByRole('button')[0]
    fireEvent.click(prevButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('should not go below page 1 when prev clicked', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    const prevButton = screen.getAllByRole('button')[0]
    fireEvent.click(prevButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(1)
  })

  it('should show ellipsis for many pages', () => {
    render(
      <Pagination
        currentPage={5}
        totalItems={1000}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    // Should show ellipsis
    const ellipsis = screen.getAllByText('...')
    expect(ellipsis.length).toBeGreaterThan(0)
  })

  it('should calculate total pages correctly', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={95}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    // 95 items / 10 per page = 9.5 -> 10 pages
    // Should show page 1
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should handle single page', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={5}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should handle zero items', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={0}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    // Should still render without crashing
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('should navigate to next page when next button clicked', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    // Find the next button (second chevron button)
    const buttons = screen.getAllByRole('button')
    const nextButton = buttons[buttons.length - 1]
    fireEvent.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('should show first and last page always', () => {
    render(
      <Pagination
        currentPage={5}
        totalItems={1000}
        itemsPerPage={10}
        onPageChange={mockOnPageChange}
      />
    )

    // First page (1) and last page (100) should be visible
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })
})
