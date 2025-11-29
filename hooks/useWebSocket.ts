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
} from '../lib/websocket-client'

/**
 * Hook for WebSocket connection with automatic cleanup
 */
export function useWebSocket(
  channel: string,
  token?: string,
  autoConnect: boolean = true
) {
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<WebSocketClient | null>(null)

  useEffect(() => {
    if (!autoConnect) return

    const client = defaultWSManager.getOrCreate(channel, token)
    clientRef.current = client

    client.connect()

    const checkConnection = setInterval(() => {
      setConnected(client.isConnected())
    }, 1000)

    return () => {
      clearInterval(checkConnection)
      defaultWSManager.disconnect(channel)
    }
  }, [channel, token, autoConnect])

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
  token?: string
) {
  const { connected, client } = useWebSocket(channel, token)
  const [latestMessage, setLatestMessage] = useState<T | null>(null)

  useEffect(() => {
    if (!client) return

    const messageHandler: WebSocketEventHandler = (
      message: WebSocketMessage<T>
    ) => {
      setLatestMessage(message.data)
      handler(message.data)
    }

    client.on(messageType, messageHandler)

    return () => {
      client.off(messageType, messageHandler)
    }
  }, [client, messageType, handler])

  return {
    connected,
    latestMessage,
  }
}

/**
 * Hook for real-time order book updates
 */
export function useOrderBookWebSocket(token?: string) {
  const [orderBook, setOrderBook] = useState<any>(null)

  const { connected } = useWebSocketMessage(
    'orderbook',
    'orderbook_update',
    useCallback((data: any) => {
      setOrderBook(data)
    }, []),
    token
  )

  return {
    orderBook,
    connected,
  }
}

/**
 * Hook for real-time trade updates
 */
export function useTradesWebSocket(token?: string) {
  const [trades, setTrades] = useState<any[]>([])

  const { connected } = useWebSocketMessage(
    'trades',
    'trade_update',
    useCallback((data: any) => {
      setTrades((prev) => [data, ...prev].slice(0, 100)) // Keep last 100 trades
    }, []),
    token
  )

  return {
    trades,
    connected,
  }
}

/**
 * Hook for epoch transition notifications
 */
export function useEpochWebSocket(token?: string) {
  const [currentEpoch, setCurrentEpoch] = useState<any>(null)
  const [lastTransition, setLastTransition] = useState<any>(null)

  const { connected } = useWebSocketMessage(
    'epochs',
    'epoch_transition',
    useCallback((data: any) => {
      setCurrentEpoch(data.current_epoch)
      setLastTransition(data)
    }, []),
    token
  )

  return {
    currentEpoch,
    lastTransition,
    connected,
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
