'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  WebSocketEventHandler,
  WebSocketMessage,
  WebSocketMessageType,
} from '@/lib/websocket-client'
import { useWebSocket } from '@/lib/ws/useWebSocket'

export interface UseWsChannelOptions<T> {
  /** Keep at most this many messages in the buffer (newest first). Default 50. */
  bufferSize?: number
  /** Connect without auth token (public market-data channels). */
  publicOnly?: boolean
  /** Imperative side-effect per message (toasts, cache invalidation). */
  onMessage?: (data: T) => void
  /** Set false to keep the hook mounted but idle. Default true. */
  enabled?: boolean
  /** Handshake query params, e.g. `{ zone_id: 1 }` for the trading channel. */
  params?: Record<string, string | number>
}

/**
 * The one way to consume a realtime channel: subscribes to one message type
 * on one channel, keeps the latest value and a bounded newest-first buffer.
 * Replaces the per-domain copies of the useState-buffer + subscribe/
 * unsubscribe pattern that used to live in useTransactionUpdates.
 */
export function useWsChannel<T = unknown>(
  channel: string,
  messageType: WebSocketMessageType,
  options: UseWsChannelOptions<T> = {}
) {
  const {
    bufferSize = 50,
    publicOnly = false,
    onMessage,
    enabled = true,
    params,
  } = options

  const { connected, client, send } = useWebSocket(
    channel,
    undefined,
    enabled,
    publicOnly,
    params
  )
  const [latest, setLatest] = useState<T | null>(null)
  const [buffer, setBuffer] = useState<T[]>([])

  // Keep the caller's handler out of the effect deps so an inline closure
  // doesn't tear down the socket subscription every render.
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!client || !enabled) return

    const handler = (message: WebSocketMessage<T>) => {
      setLatest(message.data)
      setBuffer((prev) => [message.data, ...prev].slice(0, bufferSize))
      onMessageRef.current?.(message.data)
    }

    client.on(messageType, handler as WebSocketEventHandler)
    return () => {
      client.off(messageType, handler as WebSocketEventHandler)
    }
  }, [client, messageType, bufferSize, enabled])

  const clear = useCallback(() => {
    setLatest(null)
    setBuffer([])
  }, [])

  return { connected, latest, buffer, clear, send }
}
