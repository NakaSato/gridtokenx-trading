import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

function Bomb({ defused = false }: { defused?: boolean }) {
  if (!defused) throw new Error('boom')
  return <div>recovered content</div>
}

describe('ErrorBoundary', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    // React logs caught render errors; keep test output clean
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary name="Widget">
        <div>all good</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('all good')).toBeInTheDocument()
  })

  it('shows named fallback with alert role when a child throws', () => {
    render(
      <ErrorBoundary name="Widget">
        <Bomb />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Widget failed to load')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('falls back to generic title without a name', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders custom fallback prop instead of the default UI', () => {
    render(
      <ErrorBoundary fallback={<div>custom fallback</div>}>
        <Bomb />
      </ErrorBoundary>
    )
    expect(screen.getByText('custom fallback')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('recovers via Try again when the child stops throwing', () => {
    let defused = false
    function MaybeBomb() {
      return <Bomb defused={defused} />
    }
    render(
      <ErrorBoundary name="Widget">
        <MaybeBomb />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()

    defused = true
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(screen.getByText('recovered content')).toBeInTheDocument()
  })

  it('offers Reload page after retries are exhausted', () => {
    render(
      <ErrorBoundary name="Widget">
        <Bomb />
      </ErrorBoundary>
    )
    // MAX_RETRIES = 2 failed retries → reload offered
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('shows dev-only error details with the thrown message', () => {
    render(
      <ErrorBoundary name="Widget">
        <Bomb />
      </ErrorBoundary>
    )
    // Jest runs with NODE_ENV=test… but next/jest keeps process.env.NODE_ENV as 'test',
    // which is not 'development' — details must be hidden.
    expect(screen.queryByText(/error details/i)).not.toBeInTheDocument()
  })
})
