import { apiRequest } from '../core'

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

describe('apiRequest transient-network retry', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>

    beforeEach(() => {
        mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
        mockFetch.mockReset()
    })

    it('retries a GET when fetch throws once, then succeeds', async () => {
        mockFetch
            .mockRejectedValueOnce(new TypeError('Failed to fetch')) // net::ERR_FAILED
            .mockResolvedValueOnce(mockResponse({ ok: true }))

        const res = await apiRequest('/api/v1/public/grid-flows')

        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(res.status).toBe(200)
        expect(res.data).toEqual({ ok: true })
        expect(res.error).toBeUndefined()
    })

    it('gives up after exhausting retries and surfaces the error', async () => {
        mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

        const res = await apiRequest('/api/v1/public/grid-flows')

        // initial attempt + 2 retries
        expect(mockFetch).toHaveBeenCalledTimes(3)
        expect(res.status).toBe(500)
        expect(res.error).toBe('Failed to fetch')
    })

    it('never retries a non-idempotent POST (no duplicate writes)', async () => {
        mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

        const res = await apiRequest('/api/orders', { method: 'POST', body: { qty: 1 } })

        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(res.status).toBe(500)
    })

    it('does not retry an HTTP error response (4xx/5xx are not network failures)', async () => {
        mockFetch.mockResolvedValue(mockResponse({ detail: 'boom' }, { ok: false, status: 500 }))

        const res = await apiRequest('/api/v1/public/grid-flows')

        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(res.status).toBe(500)
    })
})
