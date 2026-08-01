import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCarbonCredits } from '@/features/portfolio/hooks/useCarbonCredits'

const mockGetBalance = jest.fn()
const mockGetHistory = jest.fn()
/** Captured WS handlers, keyed by message type. */
const mockWsHandlers: Record<string, (data: unknown) => void> = {}

jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({ token: 'test-token', isAuthenticated: true }),
}))
jest.mock('@/features/portfolio/hooks/usePortfolio', () => ({
  useProfile: () => ({ data: { id: 'user-1' } }),
}))
jest.mock('@/lib/api/useApiClient', () => ({
  useApiClient: () => ({
    getCarbonBalance: () => mockGetBalance(),
    getCarbonHistory: () => mockGetHistory(),
  }),
}))
jest.mock('@/lib/ws/useWebSocket', () => ({
  useWebSocketMessage: (
    _channel: string,
    type: string,
    handler: (data: unknown) => void
  ) => {
    mockWsHandlers[type] = handler
    return { connected: true, latestMessage: null }
  },
}))

let queryClient: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const BALANCE = {
  total_credits: '10.00',
  available_credits: '8.00',
  retired_credits: '2.00',
}

describe('useCarbonCredits', () => {
  beforeEach(() => {
    Object.keys(mockWsHandlers).forEach((k) => delete mockWsHandlers[k])
    mockGetBalance.mockReset().mockResolvedValue({ data: BALANCE, error: null })
    mockGetHistory.mockReset().mockResolvedValue({ data: [], error: null })
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  afterEach(() => jest.restoreAllMocks())

  it('loads balance and history', async () => {
    const { result } = renderHook(() => useCarbonCredits(), { wrapper })
    await waitFor(() => expect(result.current.balance).toEqual(BALANCE))
    expect(mockGetHistory).toHaveBeenCalledTimes(1)
  })

  // The whole point of the change: credits accrue on settlement, and the page
  // used to sit on its first fetch until the user reloaded.
  it('refetches both queries when a settlement lands, without waiting for the poll', async () => {
    const { result } = renderHook(() => useCarbonCredits(), { wrapper })
    await waitFor(() => expect(result.current.balance).toEqual(BALANCE))

    mockGetBalance.mockResolvedValue({
      data: { ...BALANCE, total_credits: '12.00' },
      error: null,
    })

    act(() => mockWsHandlers['settlement_complete']?.({ settlement_id: 's-1' }))

    await waitFor(() =>
      expect(result.current.balance?.total_credits).toBe('12.00')
    )
    expect(mockGetHistory).toHaveBeenCalledTimes(2)
  })
})
