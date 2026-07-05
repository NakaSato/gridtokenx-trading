import { WebSocketClient } from '../websocket-client'

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

    send() { }
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
