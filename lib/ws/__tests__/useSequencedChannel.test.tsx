import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSequencedChannel, SequencedFrame } from '@/lib/ws/useSequencedChannel'
import { useWebSocket } from '@/lib/ws/useWebSocket'

jest.mock('@/lib/ws/useWebSocket', () => ({ useWebSocket: jest.fn() }))

/** Handlers the hook registered, keyed by message type, so tests can fire frames. */
let handlers: Record<string, (message: unknown) => void>
let connected: boolean
let queryClient: QueryClient
let invalidateSpy: jest.SpyInstance

const SNAPSHOT_KEY = ['trading', 'book'] as const

function fakeClient() {
    return {
        on: (type: string, h: (m: unknown) => void) => {
            handlers[type] = h
        },
        off: (type: string) => {
            delete handlers[type]
        },
    }
}

function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

/** A gateway frame. Defaults mirror `MarketFrame` in websocket.rs. */
function frame(zone_id: number, seq: number, type = 'order_created') {
    return { type, seq, zone_id, data: { id: `${zone_id}-${seq}` }, timestamp: '' }
}

function fire(f: ReturnType<typeof frame>) {
    act(() => {
        handlers[f.type]?.(f)
    })
}

function render(zoneId?: number, onFrame?: (f: SequencedFrame) => void) {
    return renderHook(
        () =>
            useSequencedChannel({
                zoneId,
                messageTypes: ['order_created'],
                snapshotKey: SNAPSHOT_KEY,
                onFrame,
            }),
        { wrapper }
    )
}

describe('useSequencedChannel', () => {
    beforeEach(() => {
        handlers = {}
        connected = true
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
        invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
            ; (useWebSocket as jest.Mock).mockImplementation(() => ({
                connected,
                client: fakeClient(),
                send: jest.fn(),
            }))
    })

    afterEach(() => jest.restoreAllMocks())

    it('adopts the first frame of a zone as the baseline without resyncing', () => {
        const onFrame = jest.fn()
        const { result } = render(undefined, onFrame)

        // Seq 776, not 1: the snapshot's sequence is unknowable (the outbox
        // race), so the first frame is a baseline, not something to check.
        fire(frame(1, 776))

        expect(onFrame).toHaveBeenCalledTimes(1)
        expect(result.current.gapCount).toBe(0)
        expect(invalidateSpy).not.toHaveBeenCalled()
        expect(result.current.seqByZone).toEqual({ 1: 776 })
    })

    it('applies contiguous frames and tracks zones independently', () => {
        const onFrame = jest.fn()
        const { result } = render(undefined, onFrame)

        fire(frame(0, 10))
        fire(frame(1, 500))
        fire(frame(0, 11))
        fire(frame(1, 501))

        expect(onFrame).toHaveBeenCalledTimes(4)
        expect(result.current.gapCount).toBe(0)
        // Zone 1's traffic must not advance zone 0's expectation, or every
        // interleaved frame would read as a gap.
        expect(result.current.seqByZone).toEqual({ 0: 11, 1: 501 })
    })

    it('resyncs on a forward gap', async () => {
        const onFrame = jest.fn()
        const { result } = render(undefined, onFrame)

        fire(frame(0, 10))
        fire(frame(0, 14)) // 11-13 missed

        await waitFor(() => expect(result.current.gapCount).toBe(1))
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [...SNAPSHOT_KEY] })
        // The gap frame is not applied — it is not known to be contiguous.
        expect(onFrame).toHaveBeenCalledTimes(1)
    })

    it('resyncs when the sequence goes backwards (gateway restart)', async () => {
        const { result } = render()

        fire(frame(0, 776))
        // Gateway restarted: fresh consumer group, replays Kafka from earliest,
        // sequences restart. Lower is not an error, it is a resync trigger.
        fire(frame(0, 1))

        await waitFor(() => expect(result.current.gapCount).toBe(1))
        expect(invalidateSpy).toHaveBeenCalled()
    })

    it('does not cascade: one gap produces one resync, not a loop', async () => {
        const onFrame = jest.fn()
        const { result } = render(undefined, onFrame)

        fire(frame(0, 10))
        fire(frame(1, 500))
        fire(frame(0, 99)) // gap → resync, baselines cleared

        await waitFor(() => expect(result.current.gapCount).toBe(1))

        // The trap: if a resync had *zeroed* the baselines instead of clearing
        // them, each of these high sequences would read as another gap and
        // resync again, forever. Cleared zones must re-baseline silently.
        fire(frame(0, 100))
        fire(frame(1, 501))
        fire(frame(0, 101))

        expect(result.current.gapCount).toBe(1)
        expect(result.current.seqByZone).toEqual({ 0: 101, 1: 501 })
        // Two baselines adopted plus one contiguous frame, on top of the two
        // applied before the gap.
        expect(onFrame).toHaveBeenCalledTimes(5)
    })

    it('resyncs on a gateway resync control frame', async () => {
        const { result } = render()

        fire(frame(0, 10))
        act(() => {
            handlers['resync']?.({ type: 'resync', zone_id: null, seq: null, reason: 'lagged' })
        })

        await waitFor(() => expect(result.current.gapCount).toBe(1))
        expect(result.current.seqByZone).toEqual({})
    })

    it('ignores frames from other zones when scoped to one', () => {
        const onFrame = jest.fn()
        const { result } = render(1, onFrame)

        fire(frame(2, 5)) // different zone — must not touch our sequence
        fire(frame(1, 5))

        expect(onFrame).toHaveBeenCalledTimes(1)
        expect(result.current.seqByZone).toEqual({ 1: 5 })
        expect(result.current.gapCount).toBe(0)
    })
})
