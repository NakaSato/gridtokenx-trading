'use client'

/**
 * React Hooks for WebSocket Client
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  WebSocketClient,
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketEventHandler,
  defaultWSManager,
} from '@/lib/websocket-client'
import { useAuth } from '@/features/auth/provider'

/**
 * Hook for WebSocket connection with automatic cleanup
 */
export function useWebSocket(
  channel: string,
  token?: string,
  autoConnect: boolean = true,
  publicOnly: boolean = false,
  /** Handshake query params, e.g. `{ zone_id: 1 }` for the trading channel. */
  params?: Record<string, string | number>
) {
  const { token: authToken } = useAuth()
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<WebSocketClient | null>(null)

  // Use token from auth context if not provided explicitly, unless publicOnly is requested
  const effectiveToken = publicOnly ? undefined : (token || authToken || undefined)

  // Track whether we're using the public client for this instance
  const isUsingPublicRef = useRef(false)

  // Callers pass params as an object literal, whose identity changes every
  // render. Depend on its *contents* instead, or the effect would tear the
  // socket down and redial on every render.
  const paramsKey = params
    ? Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
    : ''
  // Assigned after commit, and declared before the connect effect below so it
  // is already up to date when that effect re-runs on a paramsKey change.
  const paramsRef = useRef(params)
  useEffect(() => {
    paramsRef.current = params
  })

  useEffect(() => {
    if (!autoConnect) return

    // Determine if we'll use public client
    isUsingPublicRef.current = !effectiveToken

    // Captured once so cleanup releases the same key it acquired — reading the
    // ref again at teardown could see params from a later render.
    const activeParams = paramsRef.current

    // null = the channel has no gateway route (see ROUTED_WS_CHANNELS in
    // lib/websocket-client.ts). Stay idle rather than dialing a 404.
    const client = defaultWSManager.getOrCreate(channel, effectiveToken, activeParams)
    clientRef.current = client
    if (!client) {
      setConnected(false)
      return
    }

    // Always connect - manager handles fallback to public endpoint if no token
    client.connect()

    const checkConnection = setInterval(() => {
      setConnected(client.isConnected())
    }, 1000)

    return () => {
      clearInterval(checkConnection)
      if (isUsingPublicRef.current) {
        defaultWSManager.disconnectPublic()
      } else {
        defaultWSManager.disconnect(channel, activeParams)
      }
    }
  }, [channel, effectiveToken, autoConnect, paramsKey])

  const connect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.connect()
    }
  }, [])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect()
    }
  }, [])

  const send = useCallback((message: any) => {
    if (clientRef.current) {
      clientRef.current.send(message)
    }
  }, [])

  return {
    connected,
    connect,
    disconnect,
    send,
    client: clientRef.current,
  }
}

/**
 * Hook for subscribing to specific WebSocket message types
 */
export function useWebSocketMessage<T = any>(
  channel: string,
  messageType: WebSocketMessageType,
  handler: (data: T) => void,
  token?: string,
  publicOnly: boolean = false
) {
  const { connected, client } = useWebSocket(channel, token, true, publicOnly)
  const [latestMessage, setLatestMessage] = useState<T | null>(null)

  useEffect(() => {
    if (!client) return

    const messageHandler = (message: WebSocketMessage<T>) => {
      setLatestMessage(message.data)
      handler(message.data)
    }

    client.on(messageType, messageHandler as WebSocketEventHandler)

    return () => {
      client.off(messageType, messageHandler as WebSocketEventHandler)
    }
  }, [client, messageType, handler])

  return {
    connected,
    latestMessage,
  }
}

/**
 * Hook for order filled notifications
 */
export function useOrderFilledWebSocket(
  onOrderFilled: (order: any) => void,
  token?: string
) {
  const { connected } = useWebSocketMessage(
    'trades',
    'order_filled',
    onOrderFilled,
    token
  )

  return { connected }
}

/**
 * Hook for order matched notifications (P2P)
 */
export function useOrderMatchedWebSocket(
  onOrderMatched: (data: any) => void,
  token?: string
) {
  const { connected } = useWebSocketMessage(
    'trades',
    'order_matched',
    onOrderMatched,
    token
  )

  return { connected }
}

/**
 * Hook for market clearing notifications
 */
export function useMarketClearingWebSocket(
  onMarketClearing: (data: any) => void,
  token?: string
) {
  const { connected } = useWebSocketMessage(
    'epochs',
    'market_clearing',
    onMarketClearing,
    token
  )

  return { connected }
}

/**
 * Hook for managing multiple WebSocket connections
 */
export function useWebSocketManager() {
  const [connections, setConnections] = useState<Map<string, boolean>>(
    new Map()
  )

  const updateConnectionStatus = useCallback(() => {
    // This would need access to the manager's internal state
    // For now, just trigger a re-render
    setConnections(new Map(connections))
  }, [connections])

  useEffect(() => {
    const interval = setInterval(updateConnectionStatus, 2000)
    return () => clearInterval(interval)
  }, [updateConnectionStatus])

  const disconnectAll = useCallback(() => {
    defaultWSManager.disconnectAll()
    updateConnectionStatus()
  }, [updateConnectionStatus])

  const setToken = useCallback((token: string) => {
    defaultWSManager.setToken(token)
  }, [])

  return {
    connections,
    disconnectAll,
    setToken,
  }
}
