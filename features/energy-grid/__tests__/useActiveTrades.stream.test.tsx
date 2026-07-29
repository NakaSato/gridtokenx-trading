import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useActiveTrades } from '@/features/energy-grid/hooks/useActiveTrades'
import { useWebSocket } from '@/lib/ws/useWebSocket'

const mockGetTrades = jest.fn()

jest.mock('@/features/auth/provider', () => ({
    useAuth: () => ({ token: 'test-token' }),
}))
jest.mock('@/lib/api/useApiClient', () => ({
    useApiClient: () => ({ getTrades: () => mockGetTrades() }),
}))
jest.mock('@/lib/ws/useWebSocket', () => ({ useWebSocket: jest.fn() }))

let handlers: Record<string, (message: unknown) => void>
let queryClient: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

/** One settled trade, shaped like the REST payload useActiveTrades filters on. */
const TRADE = {
    id: 'trade-1',
    buyer_zone_id: 1,
    seller_zone_id: 2,
    energy_amount: 5,
    price_per_kwh: 3,
}

function matchFrame(seq: number) {
    return {
        type: 'order_matched',
        seq,
        zone_id: 1,
        data: { match_id: 'match-1' },
        timestamp: '',
    }
}

describe('useActiveTrades realtime', () => {
    beforeEach(() => {
        handlers = {}
        mockGetTrades.mockReset()
        mockGetTrades.mockResolvedValue({ data: { trades: [TRADE] }, error: null })
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
            ; (useWebSocket as jest.Mock).mockImplementation(() => ({
                connected: true,
                client: {
                    on: (t: string, h: (m: unknown) => void) => {
                        handlers[t] = h
                    },
                    off: (t: string) => {
                        delete handlers[t]
                    },
                },
                send: jest.fn(),
            }))
    })

    afterEach(() => jest.restoreAllMocks())

    it('refreshes on a match frame instead of waiting for the poll', async () => {
        const { result } = renderHook(() => useActiveTrades(), { wrapper })
        await waitFor(() => expect(result.current.trades).toHaveLength(1))

        const before = mockGetTrades.mock.calls.length
        act(() => handlers['order_matched']?.(matchFrame(1)))

        await waitFor(() =>
            expect(mockGetTrades.mock.calls.length).toBeGreaterThan(before)
        )
    })

    /// The property the whole id-keyed design rests on. Postgres is ahead of
    /// Kafka (the outbox relay), so a snapshot can already contain the very
    /// order a later frame describes — the same frame effectively arrives
    /// twice. Applying it again must not double-count.
    it('replaying the same frame changes nothing', async () => {
        const { result } = renderHook(() => useActiveTrades(), { wrapper })
        await waitFor(() => expect(result.current.trades).toHaveLength(1))

        const first = result.current.trades

        act(() => handlers['order_matched']?.(matchFrame(1)))
        await waitFor(() => expect(mockGetTrades).toHaveBeenCalledTimes(2))

        // Byte-for-byte the same frame again.
        act(() => handlers['order_matched']?.(matchFrame(1)))
        await waitFor(() => expect(mockGetTrades.mock.calls.length).toBeGreaterThan(2))

        // One trade still, not two. Refetching a snapshot is idempotent, which
        // is why a duplicate frame costs a request and nothing more.
        expect(result.current.trades).toHaveLength(1)
        expect(result.current.trades).toEqual(first)
    })
})
