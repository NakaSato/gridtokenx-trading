import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMyMeterTotals } from '@/features/energy-grid/hooks/useMyMeterTotals'
import type { EnergyNode } from '@/types/grid'

const mockGetMyMeters = jest.fn()
jest.mock('@/lib/api-client', () => ({
    defaultApiClient: {
        getMyMeters: () => mockGetMyMeters(),
    },
}))

let mockIsAuthenticated = true
jest.mock('@/features/auth/provider', () => ({
    useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const nodes: EnergyNode[] = [
    {
        id: 'meter-uuid-1', name: 'My Solar', type: 'generator',
        longitude: 0, latitude: 0, capacity: '', status: 'active',
        currentOutput: '5.00 kW',
    },
    {
        id: 'node-with-serial', serial: 'SN-002', name: 'My House', type: 'consumer',
        longitude: 0, latitude: 0, capacity: '', status: 'active',
        currentLoad: '3.00 kW',
    },
    {
        id: 'someone-else', name: 'Not Mine', type: 'generator',
        longitude: 0, latitude: 0, capacity: '', status: 'active',
        currentOutput: '100.00 kW',
    },
]

describe('useMyMeterTotals', () => {
    beforeEach(() => {
        mockGetMyMeters.mockReset()
        mockIsAuthenticated = true
    })

    it('sums only the viewer-owned meters, matched by id AND serial', async () => {
        mockGetMyMeters.mockResolvedValueOnce({
            data: [
                { id: 'meter-uuid-1', serial_number: 'SN-001' },
                { id: 'other-uuid', serial_number: 'SN-002' },
            ],
            status: 200,
        })

        const { result } = renderHook(() => useMyMeterTotals({ nodes, refreshIntervalMs: 0 }), { wrapper })
        await waitFor(() => expect(result.current.totals).not.toBeNull())

        expect(result.current.totals).toEqual({
            totalGeneration: 5,
            totalConsumption: 3,
            netBalance: 2,
            meterCount: 2,
        })
    })

    it('prefers live WS telemetry over the poll value', async () => {
        mockGetMyMeters.mockResolvedValueOnce({
            data: [{ id: 'meter-uuid-1', serial_number: 'SN-001' }],
            status: 200,
        })

        const telemetry = {
            'meter-uuid-1': { meter_id: 'meter-uuid-1', generation_kw: 7.5 },
        }
        const { result } = renderHook(
            () => useMyMeterTotals({ nodes, telemetry: telemetry as any, refreshIntervalMs: 0 }),
            { wrapper }
        )
        await waitFor(() => expect(result.current.totals).not.toBeNull())
        expect(result.current.totals?.totalGeneration).toBe(7.5)
    })

    it('is null when logged out — and never calls the authed endpoint', async () => {
        mockIsAuthenticated = false

        const { result } = renderHook(() => useMyMeterTotals({ nodes, refreshIntervalMs: 0 }), { wrapper })
        expect(result.current.totals).toBeNull()
        expect(mockGetMyMeters).not.toHaveBeenCalled()
    })

    it('is null when no owned meter matches a map node — caller falls back to grid totals', async () => {
        mockGetMyMeters.mockResolvedValueOnce({
            data: [{ id: 'unplaced-uuid', serial_number: 'SN-999' }],
            status: 200,
        })

        const { result } = renderHook(() => useMyMeterTotals({ nodes, refreshIntervalMs: 0 }), { wrapper })
        await waitFor(() => expect(mockGetMyMeters).toHaveBeenCalled())
        expect(result.current.totals).toBeNull()
    })

    it('is null on an empty meter list', async () => {
        mockGetMyMeters.mockResolvedValueOnce({ data: [], status: 200 })

        const { result } = renderHook(() => useMyMeterTotals({ nodes, refreshIntervalMs: 0 }), { wrapper })
        await waitFor(() => expect(mockGetMyMeters).toHaveBeenCalled())
        expect(result.current.totals).toBeNull()
    })
})
