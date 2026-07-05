import { ApiClient } from '../../api-client'

// Mock fetch globally
global.fetch = jest.fn()

function mockResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
    return {
        ok: init.ok ?? true,
        status: init.status ?? 200,
        text: async () => JSON.stringify(body),
        json: async () => body,
        headers: new Headers({}),
    } as Response
}

describe('MetersApi.getPublicMeters', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>

    beforeEach(() => {
        mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
        mockFetch.mockClear()
    })

    it('keeps the backend meter_id so map node ids can match grid flows', async () => {
        mockFetch.mockResolvedValueOnce(
            mockResponse({
                meters: [
                    { meter_id: 'MTR-001', location_name: 'Bus 1', status: 'active' },
                    { node_id: 'bus_2', location_name: 'Bus 2', status: 'active' },
                    { location_name: 'Bus 3', status: 'active' },
                ],
            })
        )

        const client = new ApiClient()
        const res = await client.getPublicMeters()

        expect(res.data?.[0].meter_id).toBe('MTR-001')
        // node_id is the fallback id
        expect(res.data?.[1].meter_id).toBe('bus_2')
        // absent ids stay absent (map falls back to synthetic ids)
        expect(res.data?.[2].meter_id).toBeUndefined()
    })

    it('falls back to zone_code when the backend omits zone_id (GLM simulator shape)', async () => {
        mockFetch.mockResolvedValueOnce(
            mockResponse({
                meters: [
                    { meter_id: 'a', status: 'active', zone_code: 2 },
                    { meter_id: 'b', status: 'active', zone_id: 7, zone_code: 3 },
                ],
            })
        )

        const client = new ApiClient()
        const res = await client.getPublicMeters()

        expect(res.data?.[0].zone_id).toBe(2)
        // explicit zone_id wins over zone_code
        expect(res.data?.[1].zone_id).toBe(7)
    })
})

describe('MetersApi.getGridFlows', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>

    beforeEach(() => {
        mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
        mockFetch.mockClear()
    })

    it('passes through the node-ids flow shape', async () => {
        mockFetch.mockResolvedValueOnce(
            mockResponse({
                flows: [{ from: 'MTR-001', to: 'transformer-1', power_kw: 43.1, description: 'x' }],
            })
        )

        const client = new ApiClient()
        const res = await client.getGridFlows()

        expect(res.data?.flows).toEqual([
            { from: 'MTR-001', to: 'transformer-1', power_kw: 43.1, description: 'x' },
        ])
    })

    it('normalizes the raw-refs shape (from_meter_id / to_zone_id)', async () => {
        mockFetch.mockResolvedValueOnce(
            mockResponse({
                flows: [{ from_meter_id: 'MTR-002', to_zone_id: 3, power_kw: 10 }],
            })
        )

        const client = new ApiClient()
        const res = await client.getGridFlows()

        expect(res.data?.flows).toEqual([
            { from: 'MTR-002', to: 'transformer-3', power_kw: 10, description: undefined },
        ])
    })

    it('drops flows with unresolvable endpoints instead of emitting broken entries', async () => {
        mockFetch.mockResolvedValueOnce(
            mockResponse({
                flows: [
                    { power_kw: 5 },
                    { from_meter_id: 'MTR-003', power_kw: 5 },
                    { from_meter_id: 'MTR-004', to_zone_id: 0, power_kw: 5 },
                ],
            })
        )

        const client = new ApiClient()
        const res = await client.getGridFlows()

        // Only the flow with both endpoints survives; zone 0 is a valid zone.
        expect(res.data?.flows).toEqual([
            { from: 'MTR-004', to: 'transformer-0', power_kw: 5, description: undefined },
        ])
    })

    it('returns empty flows on endpoint error (backend not shipped yet)', async () => {
        mockFetch.mockResolvedValueOnce(
            mockResponse({ detail: 'Not Found' }, { ok: false, status: 404 })
        )

        const client = new ApiClient()
        const res = await client.getGridFlows()

        expect(res.data?.flows).toEqual([])
        expect(res.status).toBe(404)
    })
})
