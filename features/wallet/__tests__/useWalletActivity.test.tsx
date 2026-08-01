import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWalletActivity } from '@/features/wallet/hooks/useWalletActivity'

const mockGetUserTransactions = jest.fn()
/** Captured WS handlers, keyed by message type. */
const mockWsHandlers: Record<string, (data: unknown) => void> = {}
/** The onUpdate callback useWalletActivity hands to useTransactionUpdates. */
const mockTxUpdate: { fn?: (update: unknown) => void } = {}

jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({ token: 'test-token', isAuthenticated: true }),
}))
jest.mock('@/features/portfolio/hooks/usePortfolio', () => ({
  useProfile: () => ({ data: { id: 'user-1' } }),
}))
jest.mock('@/lib/api/useApiClient', () => ({
  useApiClient: () => ({
    getUserTransactions: () => mockGetUserTransactions(),
  }),
}))
jest.mock('@/features/trading/hooks/useTransactionUpdates', () => ({
  useTransactionUpdates: ({ onUpdate }: { onUpdate: (u: unknown) => void }) => {
    mockTxUpdate.fn = onUpdate
    return { latestUpdate: null, updates: [], connected: true }
  },
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

const TX = {
  id: 'tx-1',
  transaction_type: 'trading',
  amount: '5.00',
  asset: 'GRID',
  status: 'pending',
  timestamp: '2026-08-01T00:00:00Z',
  reference_id: null,
}

describe('useWalletActivity', () => {
  beforeEach(() => {
    Object.keys(mockWsHandlers).forEach((k) => delete mockWsHandlers[k])
    mockTxUpdate.fn = undefined
    mockGetUserTransactions
      .mockReset()
      .mockResolvedValue({ data: [TX], error: null })
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  afterEach(() => jest.restoreAllMocks())

  it('patches a status change into the cached row without refetching', async () => {
    const { result } = renderHook(() => useWalletActivity(), { wrapper })
    await waitFor(() => expect(result.current.transactions).toHaveLength(1))

    const before = mockGetUserTransactions.mock.calls.length

    act(() =>
      mockTxUpdate.fn?.({
        operation_id: 'tx-1',
        new_status: 'confirmed',
        signature: 'sig-1',
      })
    )

    await waitFor(() =>
      expect(result.current.transactions[0].status).toBe('confirmed')
    )
    expect(result.current.transactions[0].signature).toBe('sig-1')
    // A status change is a patch, not a reason to re-download the page.
    expect(mockGetUserTransactions.mock.calls.length).toBe(before)
  })

  // Re-applying a frame must be a no-op — the same idempotence the sequenced
  // channel relies on, since a refetch can land between two copies of a frame.
  it('is unchanged by replaying the same update', async () => {
    const { result } = renderHook(() => useWalletActivity(), { wrapper })
    await waitFor(() => expect(result.current.transactions).toHaveLength(1))

    const update = {
      operation_id: 'tx-1',
      new_status: 'confirmed',
      signature: 'sig-1',
    }
    act(() => mockTxUpdate.fn?.(update))
    await waitFor(() =>
      expect(result.current.transactions[0].status).toBe('confirmed')
    )
    const first = result.current.transactions

    act(() => mockTxUpdate.fn?.(update))
    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0]).toEqual(first[0])
  })

  // The actual bug: a patch cannot invent a row that isn't there yet, so a
  // brand-new transaction stayed invisible until the user reloaded the page.
  it('refetches on settlement so a new transaction appears', async () => {
    const { result } = renderHook(() => useWalletActivity(), { wrapper })
    await waitFor(() => expect(result.current.transactions).toHaveLength(1))

    const NEW_TX = { ...TX, id: 'tx-2', status: 'settled' }
    mockGetUserTransactions.mockResolvedValue({
      data: [NEW_TX, TX],
      error: null,
    })

    act(() => mockWsHandlers['settlement_complete']?.({ settlement_id: 's-1' }))

    await waitFor(() => expect(result.current.transactions).toHaveLength(2))
    expect(result.current.transactions[0].id).toBe('tx-2')
  })
})
