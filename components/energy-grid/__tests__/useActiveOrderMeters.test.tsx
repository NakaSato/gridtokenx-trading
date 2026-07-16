import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useActiveOrderMeters } from '../useActiveOrderMeters'

const mockGetActiveOrderMeters = jest.fn()
jest.mock('@/lib/api-client', () => ({
    createApiClient: () => ({
        getActiveOrderMeters: () => mockGetActiveOrderMeters(),
    }),
}))

let mockToken: string | null = 'jwt-token'
jest.mock('@/contexts/AuthProvider', () => ({
    useAuth: () => ({ token: mockToken }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useActiveOrderMeters', () => {
    beforeEach(() => {
        mockGetActiveOrderMeters.mockReset()
        mockToken = 'jwt-token'
    })

    it('indexes by meter_serial, not meter_id — node ids are serials', async () => {
        mockGetActiveOrderMeters.mockResolvedValueOnce({
            data: {
                data: [
                    { meter_id: 'id-1', meter_serial: 'serial-1', zone_id: 2, has_open_buy: true, has_open_sell: false },
                    { meter_id: 'id-2', meter_serial: 'serial-2', zone_id: 3, has_open_buy: false, has_open_sell: true },
                ],
            },
            status: 200,
        })

        const { result } = renderHook(() => useActiveOrderMeters(0), { wrapper })
        await waitFor(() => expect(result.current.isFilterable).toBe(true))

        expect(result.current.bySerial.size).toBe(2)
        expect(result.current.bySerial.get('serial-1')?.has_open_buy).toBe(true)
        expect(result.current.bySerial.get('serial-2')?.has_open_sell).toBe(true)
        // The meters.id space must never be a key — it never matches a map node.
        expect(result.current.bySerial.has('id-1')).toBe(false)
    })

    it('is filterable on an empty list — nothing is trading is a real answer', async () => {
        mockGetActiveOrderMeters.mockResolvedValueOnce({ data: { data: [] }, status: 200 })

        const { result } = renderHook(() => useActiveOrderMeters(0), { wrapper })
        await waitFor(() => expect(result.current.isFilterable).toBe(true))
        expect(result.current.bySerial.size).toBe(0)
    })

    it('is NOT filterable without a token, and does not call the API', async () => {
        // The endpoint is auth-gated: a logged-out visitor must see every meter,
        // not an empty map.
        mockToken = null

        const { result } = renderHook(() => useActiveOrderMeters(0), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        expect(result.current.isFilterable).toBe(false)
        expect(mockGetActiveOrderMeters).not.toHaveBeenCalled()
    })

    it('is NOT filterable when the request fails', async () => {
        mockGetActiveOrderMeters.mockResolvedValueOnce({ error: 'boom', status: 500 })

        const { result } = renderHook(() => useActiveOrderMeters(0), { wrapper })
        await waitFor(() => expect(result.current.error).toBe('boom'))
        expect(result.current.isFilterable).toBe(false)
    })
})
