'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  WebSocketEventHandler,
  WebSocketMessage,
  WebSocketMessageType,
} from '@/lib/websocket-client'
import { useWebSocket } from '@/lib/ws/useWebSocket'

/**
 * Consumes the sequenced market-data stream from `/ws/trading`
 * (`crates/trading-api/src/websocket.rs`) and keeps a TanStack snapshot query in
 * sync with it.
 *
 * Pass `zoneId` for one zone, or omit it for every zone — market-wide views
 * (best bid/ask, trade history) span zones, and subscribing to one would
 * silently drop the others' updates.
 *
 * ## Why frames are applied by id, not spliced by sequence
 *
 * The REST snapshot is read from Postgres; sequences count Kafka frames. Events
 * reach Postgres *before* Kafka, because publishing goes through an outbox relay
 * (`trading-infra/src/events/outbox_worker.rs`). So a snapshot can already
 * contain an order the stream has not sequenced yet, and a client resuming from
 * `snapshotSeq + 1` would apply that order twice.
 *
 * The fix is not tighter sequencing, it is making application idempotent:
 * callers key each frame by `order_id`/`match_id`, so re-applying one is a
 * no-op. Sequences are used only to *notice* a discontinuity and refetch — never
 * to decide where to resume. That is also why the first frame seen for a zone is
 * simply adopted as the baseline rather than checked.
 *
 * ## Sequences are per zone
 *
 * Kafka orders within a partition and a zone maps to a partition, so each zone
 * is its own gap-free run. There is no cross-zone order, and none is claimed —
 * hence a map of sequences rather than one counter.
 *
 * ## What triggers a resync
 *
 * - `seq > expected` — frames were missed.
 * - `seq <= expected` — the sequence went backwards. Normal, not an error: the
 *   gateway replays Kafka from earliest under a fresh consumer group, so a
 *   restart re-derives sequences from zero.
 * - a `resync` control frame — the gateway dropped our backlog because we fell
 *   too far behind (its `broadcast` channel reported `Lagged`).
 * - reconnect — the stream has moved on while we were away.
 */

/** Envelope the gateway sends. `MarketFrame` in `websocket.rs`. */
export interface SequencedFrame<T = unknown> {
  type: string
  seq: number
  zone_id: number
  data: T
  timestamp: string
}

export interface UseSequencedChannelOptions<T> {
  /** Zone to follow. Omit to receive every zone. */
  zoneId?: number
  /** Message types to apply. Others on the socket are ignored. */
  messageTypes: WebSocketMessageType[]
  /** Query key re-fetched on a discontinuity. Build it from `lib/query/keys.ts`. */
  snapshotKey: readonly unknown[]
  /** Applied per accepted frame. MUST be idempotent — see the note above. */
  onFrame?: (frame: SequencedFrame<T>) => void
  /** Set false to stay mounted but idle (e.g. while logged out). */
  enabled?: boolean
}

export interface UseSequencedChannelResult {
  connected: boolean
  /** Latest sequence per zone. Empty until the first frame of each. */
  seqByZone: Record<number, number>
  /** Discontinuities seen this mount. Non-zero is a health signal worth surfacing. */
  gapCount: number
  /** Resync currently in flight — the snapshot is being refetched. */
  resyncing: boolean
}

/**
 * Every type `/ws/trading` emits that advances the per-zone sequence. The tracker
 * subscribes to all of them so continuity is judged on the real stream; a
 * subscriber's `messageTypes` only decides which frames reach its callback.
 *
 * Keep in step with the server's emitter — a sequenced type missing here reads as
 * a permanent gap and resyncs on every occurrence.
 */
const SEQUENCED_MESSAGE_TYPES: WebSocketMessageType[] = [
  'order_created',
  'order_matched',
  'order_update',
  'order_filled',
  'order_cancelled',
]

export function useSequencedChannel<T = unknown>(
  options: UseSequencedChannelOptions<T>
): UseSequencedChannelResult {
  const { zoneId, messageTypes, snapshotKey, onFrame, enabled = true } = options

  const queryClient = useQueryClient()
  // Omitting the param entirely is what selects all-zones mode on the gateway.
  const { connected, client } = useWebSocket(
    'trading',
    undefined,
    enabled,
    false,
    zoneId === undefined ? undefined : { zone_id: zoneId }
  )

  const [seqByZone, setSeqByZone] = useState<Record<number, number>>({})
  const [gapCount, setGapCount] = useState(0)
  const [resyncing, setResyncing] = useState(false)

  // Sequences live in a ref as well as state: the handler needs them
  // synchronously, and reading from state would close over whatever they were
  // when the subscription was set up.
  const seqRef = useRef<Map<number, number>>(new Map())
  const onFrameRef = useRef(onFrame)
  useEffect(() => {
    onFrameRef.current = onFrame
  })

  // Serialized so inline array/key literals don't re-subscribe every render.
  const typesKey = messageTypes.join(',')
  const snapshotKeyStr = JSON.stringify(snapshotKey)

  const resync = useCallback(
    (reason: string) => {
      setResyncing(true)
      setGapCount((n) => n + 1)
      // Forget every baseline rather than zeroing them. A zeroed zone would
      // treat its next frame (seq 500, say) as another gap and resync again,
      // and again — an unbounded loop. Cleared zones instead re-baseline
      // silently on their next frame, which is safe precisely because
      // application is idempotent.
      seqRef.current.clear()
      setSeqByZone({})
      console.debug(`[ws/trading] resync: ${reason}`)
      queryClient
        .invalidateQueries({ queryKey: JSON.parse(snapshotKeyStr) })
        .finally(() => setResyncing(false))
    },
    [queryClient, snapshotKeyStr]
  )

  useEffect(() => {
    if (!client || !enabled) return

    // `wanted` are the types this subscriber cares about. The sequence itself is
    // per zone and spans EVERY type the channel emits, so the tracker must see
    // them all: judging continuity from a filtered subset reads the numbers other
    // types consumed as dropped frames. Observed live — a subscriber filtering to
    // `order_matched` saw seq 24 then ~30 and resynced on every trade.
    const wanted = new Set(
      typesKey ? (typesKey.split(',') as WebSocketMessageType[]) : []
    )

    const handler = (message: WebSocketMessage<unknown>) => {
      const frame = message as unknown as SequencedFrame<T>
      if (typeof frame.seq !== 'number' || typeof frame.zone_id !== 'number') return

      // Defensive: in single-zone mode the gateway already scopes the socket.
      if (zoneId !== undefined && frame.zone_id !== zoneId) return

      const isWanted = wanted.has(frame.type as WebSocketMessageType)
      const known = seqRef.current.get(frame.zone_id)

      if (known !== undefined && frame.seq !== known + 1) {
        resync(
          `zone ${frame.zone_id}: expected seq ${known + 1}, got ${frame.seq}`
        )
        return
      }

      // First frame for this zone (or the first after a resync): adopt it as the
      // baseline. We cannot know the exact sequence the snapshot corresponded
      // to — that is the outbox race — so there is nothing to check it against.
      seqRef.current.set(frame.zone_id, frame.seq)
      setSeqByZone(Object.fromEntries(seqRef.current))
      // Sequence advances on every frame; the callback only fires for the types
      // this subscriber asked for.
      if (isWanted) onFrameRef.current?.(frame)
    }

    // Sent when the gateway drops our backlog rather than buffering it.
    const resyncHandler = () => resync('gateway reported lag')

    // Register on every SEQUENCED type, not just the wanted ones — the handler
    // needs to see the frames that consume sequence numbers or it cannot tell a
    // real gap from a filtered-out frame. `wanted` still gates the callback.
    const types = SEQUENCED_MESSAGE_TYPES
    types.forEach((t) => client.on(t, handler as WebSocketEventHandler))
    client.on('resync', resyncHandler as WebSocketEventHandler)

    return () => {
      types.forEach((t) => client.off(t, handler as WebSocketEventHandler))
      client.off('resync', resyncHandler as WebSocketEventHandler)
    }
  }, [client, enabled, typesKey, zoneId, resync])

  // A reconnect rejoins wherever the gateway is now, which will not line up with
  // the sequences we held. The next frame's gap check would catch it, but only
  // once a frame arrives — in a quiet market that is minutes of stale data on
  // screen. Refresh on the transition instead.
  const wasConnected = useRef(false)
  useEffect(() => {
    if (connected && !wasConnected.current && seqRef.current.size > 0) {
      // Safe despite the rule: fires only on a disconnected→connected
      // transition, and `wasConnected` latches immediately below, so it cannot
      // cascade into repeated renders.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resync('reconnected')
    }
    wasConnected.current = connected
  }, [connected, resync])

  return { connected, seqByZone, gapCount, resyncing }
}
