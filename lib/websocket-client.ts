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
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void

/**
 * WebSocket Client for real-time updates
 */
export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private options: Required<WebSocketClientOptions>
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

      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
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
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
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
 * Hook-friendly WebSocket manager for React components
 */
export class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map()

  getOrCreate(channel: string, token?: string): WebSocketClient {
    if (!this.clients.has(channel)) {
      const client = new WebSocketClient(`/ws/${channel}`, { token })
      this.clients.set(channel, client)
    }
    return this.clients.get(channel)!
  }

  disconnect(channel: string): void {
    const client = this.clients.get(channel)
    if (client) {
      client.disconnect()
      this.clients.delete(channel)
    }
  }

  disconnectAll(): void {
    this.clients.forEach((client) => client.disconnect())
    this.clients.clear()
  }

  setToken(token: string): void {
    this.clients.forEach((client) => client.setToken(token))
  }
}

export const defaultWSManager = new WebSocketManager()
