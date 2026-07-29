import { WebSocketClient, WebSocketManager } from '../websocket-client'

/**
 * Minimal WebSocket mock: records instances, lets tests fire lifecycle
 * events. close() synchronously fires onclose like real close-from-cleanup.
 */
class MockWebSocket {
    static instances: MockWebSocket[] = []
    static OPEN = 1
    static CLOSED = 3

    url: string
    readyState = 0
    /** Drives the backpressure guard in send(). */
    bufferedAmount = 0
    sent: string[] = []
    onopen: (() => void) | null = null
    onmessage: ((event: { data: string }) => void) | null = null
    onerror: (() => void) | null = null
    onclose: ((event: { code: number }) => void) | null = null

    constructor(url: string) {
        this.url = url
        MockWebSocket.instances.push(this)
    }

    close() {
        this.readyState = MockWebSocket.CLOSED
        this.onclose?.({ code: 1000 })
    }

    open() {
        this.readyState = MockWebSocket.OPEN
        this.onopen?.()
    }

    send(data: string) {
        this.sent.push(data)
    }
}

describe('WebSocketClient reconnect lifecycle', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        MockWebSocket.instances = []
            ; (global as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('does not reconnect after an intentional disconnect', () => {
        const client = new WebSocketClient('/api/market/ws', { isPublic: true })
        client.connect()
        expect(MockWebSocket.instances).toHaveLength(1)

        MockWebSocket.instances[0].open()
        client.disconnect() // fires onclose synchronously via close()

        // Run out every pending reconnect timer — none may create a socket.
        jest.runAllTimers()
        expect(MockWebSocket.instances).toHaveLength(1)
    })

    it('reconnects after an unexpected close', () => {
        const client = new WebSocketClient('/api/market/ws', { isPublic: true })
        client.connect()
        MockWebSocket.instances[0].open()

        // Server drops the connection (not initiated by disconnect()).
        MockWebSocket.instances[0].readyState = MockWebSocket.CLOSED
        MockWebSocket.instances[0].onclose?.({ code: 1001 })

        jest.advanceTimersByTime(60000)
        expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2)

        client.disconnect()
    })

    it('connect() after disconnect() re-arms reconnection', () => {
        const client = new WebSocketClient('/api/market/ws', { isPublic: true })
        client.connect()
        MockWebSocket.instances[0].open()
        client.disconnect()

        client.connect()
        expect(MockWebSocket.instances).toHaveLength(2)

        // Unexpected drop on the new socket must reconnect again.
        MockWebSocket.instances[1].readyState = MockWebSocket.CLOSED
        MockWebSocket.instances[1].onclose?.({ code: 1001 })
        jest.advanceTimersByTime(60000)
        expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(3)

        client.disconnect()
    })

    it('dispatches typed messages to subscribed handlers', () => {
        const client = new WebSocketClient('/api/market/ws', { isPublic: true })
        const handler = jest.fn()
        client.on('grid_status', handler)
        client.connect()

        MockWebSocket.instances[0].open()
        MockWebSocket.instances[0].onmessage?.({
            data: JSON.stringify({ type: 'grid_status', data: { total_generation: 5 } }),
        })

        expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'grid_status', data: { total_generation: 5 } })
        )

        client.off('grid_status', handler)
        MockWebSocket.instances[0].onmessage?.({
            data: JSON.stringify({ type: 'grid_status', data: {} }),
        })
        expect(handler).toHaveBeenCalledTimes(1)

        client.disconnect()
    })
})

// A valid-shaped JWT: the connect() guard requires 3 dot-separated parts and
// length > 20 before it will dial an authenticated path.
const FAKE_JWT = `${'h'.repeat(12)}.${'p'.repeat(12)}.${'s'.repeat(12)}`

describe('WebSocketClient handshake URL', () => {
    beforeEach(() => {
        MockWebSocket.instances = []
            ; (global as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket
    })

    it('merges params and token into a single query string', () => {
        const client = new WebSocketClient('/ws/trading', {
            token: FAKE_JWT,
            params: { zone_id: 1 },
        })
        client.connect()

        const { url } = MockWebSocket.instances[0]
        // The bug this guards: string-concatenating `?token=` onto a URL that
        // already carries `?zone_id=1` yields a second `?`, which the gateway
        // rejects.
        expect(url.match(/\?/g)).toHaveLength(1)

        const query = new URLSearchParams(url.split('?')[1])
        expect(query.get('zone_id')).toBe('1')
        expect(query.get('token')).toBe(FAKE_JWT)

        client.disconnect()
    })

    it('omits the query entirely when there is nothing to send', () => {
        const client = new WebSocketClient('/api/market/ws', { isPublic: true })
        client.connect()
        expect(MockWebSocket.instances[0].url).not.toContain('?')
        client.disconnect()
    })
})

describe('WebSocketClient backpressure', () => {
    beforeEach(() => {
        MockWebSocket.instances = []
            ; (global as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket
    })

    it('drops sends once the socket buffer is over the ceiling', () => {
        const client = new WebSocketClient('/api/market/ws', { isPublic: true })
        client.connect()
        const socket = MockWebSocket.instances[0]
        socket.open()

        client.send({ hello: 'world' })
        expect(socket.sent).toHaveLength(1)

        // Peer has stopped draining. Queueing more would grow unboundedly, so
        // the send must be dropped rather than buffered.
        socket.bufferedAmount = 2_000_000
        client.send({ hello: 'again' })
        expect(socket.sent).toHaveLength(1)

        // Recovers once the buffer drains.
        socket.bufferedAmount = 0
        client.send({ hello: 'recovered' })
        expect(socket.sent).toHaveLength(2)

        client.disconnect()
    })
})

describe('WebSocketManager channel identity', () => {
    beforeEach(() => {
        MockWebSocket.instances = []
            ; (global as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket
    })

    it('gives different zones different sockets, and shares one per zone', () => {
        const manager = new WebSocketManager()

        const zone1 = manager.getOrCreate('trading', FAKE_JWT, { zone_id: 1 })
        const zone2 = manager.getOrCreate('trading', FAKE_JWT, { zone_id: 2 })
        const zone1Again = manager.getOrCreate('trading', FAKE_JWT, { zone_id: 1 })

        // Keying on channel alone would hand the zone-2 caller zone 1's socket
        // and silently render another zone's market.
        expect(zone1).not.toBe(zone2)
        expect(zone1Again).toBe(zone1)

        manager.disconnectAll()
    })

    it('refuses channels with no gateway route', () => {
        const manager = new WebSocketManager()
        // Route 23 exists for `trading`; these paths have no APISIX route and no
        // upstream handler, so dialing them would 404 and burn the retry budget.
        expect(manager.getOrCreate('orderbook', FAKE_JWT)).toBeNull()
        expect(manager.getOrCreate('epochs', FAKE_JWT)).toBeNull()
        expect(manager.getOrCreate('trading', FAKE_JWT, { zone_id: 1 })).not.toBeNull()

        manager.disconnectAll()
    })

    it('releases a zone socket only when its last subscriber leaves', () => {
        const manager = new WebSocketManager()
        const params = { zone_id: 7 }

        const first = manager.getOrCreate('trading', FAKE_JWT, params)
        manager.getOrCreate('trading', FAKE_JWT, params) // second subscriber

        manager.disconnect('trading', params)
        // Still one subscriber left, so the same socket must come back.
        expect(manager.getOrCreate('trading', FAKE_JWT, params)).toBe(first)

        manager.disconnect('trading', params)
        manager.disconnect('trading', params)
        expect(manager.getOrCreate('trading', FAKE_JWT, params)).not.toBe(first)

        manager.disconnectAll()
    })
})
