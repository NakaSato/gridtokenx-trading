import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMyOwnedMeters } from '../useMyOwnedMeters'
import { isAccountActive } from '../utils'

const mockGetMyMeters = jest.fn()
jest.mock('@/lib/api-client', () => ({
    defaultApiClient: {
        getMyMeters: () => mockGetMyMeters(),
    },
}))

let mockIsAuthenticated = true
jest.mock('@/contexts/AuthProvider', () => ({
    useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('isAccountActive', () => {
    it('treats missing/unknown status as active (valid JWT held)', () => {
        expect(isAccountActive(undefined)).toBe(true)
        expect(isAccountActive(null)).toBe(true)
        expect(isAccountActive('active')).toBe(true)
        expect(isAccountActive('VERIFIED')).toBe(true)
    })

    it('excludes known not-yet-active / disabled states', () => {
        expect(isAccountActive('pending_verification')).toBe(false)
        expect(isAccountActive('SUSPENDED')).toBe(false)
        expect(isAccountActive('disabled')).toBe(false)
        expect(isAccountActive('banned')).toBe(false)
    })
})

describe('useMyOwnedMeters', () => {
    beforeEach(() => {
        mockGetMyMeters.mockReset()
        mockIsAuthenticated = true
    })

    it('collects owned ids across BOTH id and serial spaces', async () => {
        mockGetMyMeters.mockResolvedValueOnce({
            data: [
                { id: 'uuid-1', serial_number: 'SN-001' },
                { id: 'uuid-2', serial_number: 'SN-002' },
            ],
            status: 200,
        })

        const { result } = renderHook(() => useMyOwnedMeters(0), { wrapper })
        await waitFor(() => expect(result.current.isFilterable).toBe(true))

        expect(result.current.ownedIds.has('uuid-1')).toBe(true)
        expect(result.current.ownedIds.has('SN-001')).toBe(true)
        expect(result.current.ownedIds.has('SN-002')).toBe(true)
        expect(result.current.ownedIds.has('nope')).toBe(false)
    })

    it('is not filterable when logged out — and never calls the authed endpoint', async () => {
        mockIsAuthenticated = false

        const { result } = renderHook(() => useMyOwnedMeters(0), { wrapper })
        expect(result.current.isFilterable).toBe(false)
        expect(result.current.ownedIds.size).toBe(0)
        expect(mockGetMyMeters).not.toHaveBeenCalled()
    })

    it('is not filterable until the owned list loads (unknown != own nothing)', async () => {
        let resolve: (v: unknown) => void = () => {}
        mockGetMyMeters.mockReturnValueOnce(new Promise((r) => { resolve = r }))

        const { result } = renderHook(() => useMyOwnedMeters(0), { wrapper })
        // Pending → must not filter.
        expect(result.current.isFilterable).toBe(false)

        resolve({ data: [{ id: 'uuid-1', serial_number: 'SN-001' }], status: 200 })
        await waitFor(() => expect(result.current.isFilterable).toBe(true))
    })
})
