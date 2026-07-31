import { ApiClient } from '../api-client'

// Mock fetch globally — these tests assert the URL each MetersApi method calls,
// not the response handling (that is meters-pagination.test.ts).
global.fetch = jest.fn()

function okResponse(body: unknown = []): Response {
    return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(body),
        json: async () => body,
        headers: new Headers({}),
    } as Response
}

/** The path (no origin, no query) that the Nth fetch call targeted. */
function calledPath(mockFetch: jest.MockedFunction<typeof fetch>, n = 0): string {
    const url = String(mockFetch.mock.calls[n][0])
    return new URL(url, 'http://x').pathname
}

/**
 * meter-service's caller-scoped routes are canonical under `/api/v1/me/meters*`
 * (the platform user-self base). The bare `/api/v1/meters*` forms still work —
 * the backend dual-serves them as legacy aliases — which is exactly why a URL
 * regression here would be invisible: every call would keep succeeding against
 * a deprecated path until the aliases are dropped. So pin the paths explicitly.
 */
describe('MetersApi endpoints', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>

    beforeEach(() => {
        mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
        mockFetch.mockClear()
    })

    it.each([
        ['getMyMeters', '/api/v1/me/meters', (c: ApiClient) => c.getMyMeters()],
        ['getMeterStats', '/api/v1/me/meters/stats', (c: ApiClient) => c.getMeterStats()],
        ['getMyReadings', '/api/v1/me/meters/readings', (c: ApiClient) => c.getMyReadings(5, 0)],
        [
            'registerMeter',
            '/api/v1/me/meters',
            (c: ApiClient) => c.registerMeter({ serial_number: 'SN-1' }),
        ],
    ])('%s calls the caller-scoped %s', async (_name, expected, call) => {
        mockFetch.mockResolvedValueOnce(okResponse())

        await call(new ApiClient('tok'))

        expect(calledPath(mockFetch)).toBe(expected)
    })

    it('registerMeter POSTs (the /me/meters path serves both GET list and POST register)', async () => {
        mockFetch.mockResolvedValueOnce(okResponse({}))

        await new ApiClient('tok').registerMeter({ serial_number: 'SN-2' })

        const init = mockFetch.mock.calls[0][1] as RequestInit
        expect(init.method).toBe('POST')
    })

    it('getMyReadings passes limit/offset as query params', async () => {
        mockFetch.mockResolvedValueOnce(okResponse())

        await new ApiClient('tok').getMyReadings(25, 50)

        const url = new URL(String(mockFetch.mock.calls[0][0]), 'http://x')
        expect(url.searchParams.get('limit')).toBe('25')
        expect(url.searchParams.get('offset')).toBe('50')
    })

    it('getMetersMap stays OFF the /me base — it is grid-wide, not caller-scoped', async () => {
        mockFetch.mockResolvedValueOnce(okResponse())

        await new ApiClient('tok').getMetersMap()

        // Deliberately NOT /api/v1/me/meters/map: the map returns every located
        // meter across all users, and the backend 404s it under /me.
        expect(calledPath(mockFetch)).toBe('/api/v1/meters/map')
    })
})
