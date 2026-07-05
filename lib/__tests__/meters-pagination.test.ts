import { ApiClient } from '../api-client'

// Mock fetch globally
global.fetch = jest.fn()

/** Build a mock Response whose headers behave like the real `Headers` (forEach). */
function mockResponse(
    body: unknown,
    headers: Record<string, string>,
    init: { ok?: boolean; status?: number } = {}
): Response {
    return {
        ok: init.ok ?? true,
        status: init.status ?? 200,
        text: async () => JSON.stringify(body),
        json: async () => body,
        headers: new Headers(headers),
    } as Response
}

describe('MetersApi.getMyReadingsPage', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>

    beforeEach(() => {
        mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
        mockFetch.mockClear()
    })

    it('parses X-Total-Count / X-Has-More into pagination metadata', async () => {
        mockFetch.mockResolvedValueOnce(
            mockResponse([{ id: 'r1' }], {
                'X-Total-Count': '42',
                'X-Has-More': 'true',
            })
        )

        const client = new ApiClient('tok')
        const res = await client.getMyReadingsPage(1, 0)

        expect(res.error).toBeUndefined()
        expect(res.data?.total).toBe(42)
        expect(res.data?.hasMore).toBe(true)
        expect(res.data?.readings).toEqual([{ id: 'r1' }])
    })

    it('falls back to page length and hasMore=false when headers are absent', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse([{ id: 'a' }, { id: 'b' }], {}))

        const client = new ApiClient('tok')
        const res = await client.getMyReadingsPage(10, 0)

        // No X-Total-Count → total defaults to the returned page length.
        expect(res.data?.total).toBe(2)
        expect(res.data?.hasMore).toBe(false)
    })

    it('propagates an error response without pagination data', async () => {
        mockFetch.mockResolvedValueOnce(
            mockResponse({ error: 'unauthorized' }, {}, { ok: false, status: 401 })
        )

        const client = new ApiClient('tok')
        const res = await client.getMyReadingsPage()

        expect(res.status).toBe(401)
        expect(res.error).toBe('unauthorized')
        expect(res.data).toBeUndefined()
    })
})
