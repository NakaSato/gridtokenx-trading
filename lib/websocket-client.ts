/**
 * WebSocket Client for GridTokenX Platform
 * Real-time updates for order book, trades, and epochs
 */

import { API_CONFIG, getWsUrl } from './config'

export type WebSocketMessageType =
  | 'orderbook_update'
  | 'trade_update'
  | 'epoch_transition'
  | 'order_filled'
  | 'order_cancelled'
  | 'market_clearing'
  | 'order_matched'
  | 'transaction_status_update'
  | 'p2p_order_update'
  | 'settlement_complete'


export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType
  data: T
  timestamp: string
}

export interface WebSocketClientOptions {
  reconnect?: boolean
  reconnectDelay?: number
  maxReconnectAttempts?: number
  token?: string
  /** If true, this is a public endpoint that doesn't require authentication */
  isPublic?: boolean
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void

/**
 * WebSocket Client for real-time updates
 */
export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  public options: Required<WebSocketClientOptions>
  private reconnectAttempts = 0
  private handlers: Map<WebSocketMessageType, Set<WebSocketEventHandler>> =
    new Map()
  private reconnectTimeout?: NodeJS.Timeout

  constructor(path: string, options: WebSocketClientOptions = {}) {
    this.url = getWsUrl(path)
    this.options = {
      reconnect: options.reconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      token: options.token ?? '',
      isPublic: options.isPublic ?? false,
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected')
      return
    }

    try {
      // Add token to URL if provided
      const url = this.options.token
        ? `${this.url}?token=${this.options.token}`
        : this.url

      // Guard: Don't connect to authenticated /ws/* paths without a token
      // The path /api/market/ws is public and doesn't require auth
      const isAuthenticatedWsPath = this.url.match(/\/ws\/\w+/) && !this.url.includes('/api/market/ws')
      if (isAuthenticatedWsPath && !this.options.token && !this.options.isPublic) {
        console.warn(`WebSocket connection deferred for ${this.url}: Token required.`)
        return
      }

      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        // Use debug level for connection errors on auth-required paths when not authenticated
        // This is expected behavior when user hasn't logged in yet
        if (!this.options.token && !this.options.isPublic) {
          console.debug(`WebSocket connection failed (auth required) [${this.url}]`)
        } else {
          console.error(`WebSocket error [${this.url}]:`, error)
        }
      }

      this.ws.onclose = () => {
        this.attemptReconnect()
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.attemptReconnect()
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Subscribe to a specific message type
   */
  on(type: WebSocketMessageType, handler: WebSocketEventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
  }

  /**
   * Unsubscribe from a specific message type
   */
  off(type: WebSocketMessageType, handler: WebSocketEventHandler): void {
    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  /**
   * Send a message to the server
   */
  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.options.token = token
    // Reconnect with new token
    this.disconnect()
    this.connect()
  }

  /**
   * Get connection state
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message)
        } catch (error) {
          console.error(
            `Error in WebSocket handler for ${message.type}:`,
            error
          )
        }
      })
    }
  }

  private attemptReconnect(): void {
    if (!this.options.reconnect) {
      return
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`
    )

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, this.options.reconnectDelay)
  }
}

/**
 * Create WebSocket clients for different channels
 */

export function createOrderBookWS(token?: string): WebSocketClient {
  return new WebSocketClient('/ws/orderbook', { token })
}

export function createTradesWS(token?: string): WebSocketClient {
  return new WebSocketClient('/ws/trades', { token })
}

export function createEpochsWS(token?: string): WebSocketClient {
  return new WebSocketClient('/ws/epochs', { token })
}

/**
 * Create a public market WebSocket (no auth required)
 * Falls back to this when user is not authenticated
 */
export function createPublicMarketWS(): WebSocketClient {
  return new WebSocketClient('/api/market/ws', { isPublic: true })
}

/**
 * Hook-friendly WebSocket manager for React components
 */
export class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map()
  private refCounts: Map<string, number> = new Map()
  private publicClient: WebSocketClient | null = null
  private publicRefCount: number = 0

  /**
   * Get or create a WebSocket client for the given channel.
   * If no token is provided, returns a public market WebSocket instead.
   */
  getOrCreate(channel: string, token?: string): WebSocketClient {
    // If no token, use public market WebSocket as fallback
    if (!token) {
      return this.getOrCreatePublic()
    }

    let client = this.clients.get(channel)
    const path = `/ws/${channel}`

    if (!client) {
      client = new WebSocketClient(path, { token })
      this.clients.set(channel, client)
      this.refCounts.set(channel, 1)
    } else {
      // Increment ref count
      const count = this.refCounts.get(channel) || 0
      this.refCounts.set(channel, count + 1)

      if (token && client.options.token !== token) {
        // Token changed, update it
        client.setToken(token)
      }
    }

    return client
  }

  /**
   * Get or create a public market WebSocket (no auth required)
   */
  getOrCreatePublic(): WebSocketClient {
    if (!this.publicClient) {
      this.publicClient = new WebSocketClient('/api/market/ws', { isPublic: true })
    }
    this.publicRefCount++
    return this.publicClient
  }

  disconnect(channel: string): void {
    const count = this.refCounts.get(channel) || 0
    if (count <= 1) {
      const client = this.clients.get(channel)
      if (client) {
        client.disconnect()
        this.clients.delete(channel)
      }
      this.refCounts.delete(channel)
    } else {
      this.refCounts.set(channel, count - 1)
    }
  }

  disconnectPublic(): void {
    this.publicRefCount--
    if (this.publicRefCount <= 0 && this.publicClient) {
      this.publicClient.disconnect()
      this.publicClient = null
      this.publicRefCount = 0
    }
  }

  disconnectAll(): void {
    this.clients.forEach((client) => client.disconnect())
    this.clients.clear()
    this.refCounts.clear()
    if (this.publicClient) {
      this.publicClient.disconnect()
      this.publicClient = null
      this.publicRefCount = 0
    }
  }

  setToken(token: string): void {
    this.clients.forEach((client) => client.setToken(token))
  }
}

export const defaultWSManager = new WebSocketManager()

