/**
 * WebSocket Client for GridTokenX Platform
 * Real-time updates for order book, trades, and epochs
 */

import { API_CONFIG, getWsUrl } from './config'

/** WebSocket message types supported by the platform */
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
  | 'order_book_snapshot'
  | 'conditional_order_triggered'
  // Emitted on the trades channel when a trade settles. Was previously only
  // observed via a raw socket in SocketContext, so it never reached this union.
  | 'trade_executed'
  // /ws/trading emits these around every match, and they CONSUME SEQUENCE
  // NUMBERS. Verified live on 2026-07-31, one trade produced:
  //   order_created 22 · order_created 23 · order_matched 24 · order_update 25,26
  // Leaving them out of the union did not stop the server sending them — it only
  // stopped `useSequencedChannel` from seeing them, so a subscriber filtering to
  // `order_matched` observed 24 then ~30, read the jump as a dropped frame, and
  // resynced on every single trade.
  | 'order_created'
  | 'order_update'
  // Sequenced market data from /ws/trading. These names are the gateway's wire
  // contract, declared in `routable()` in crates/trading-api/src/websocket.rs —
  // they are deliberately decoupled from the Rust `Event` variant names, so
  // renaming one is a two-sided change. ('order_matched' is already above.)
  | 'order_created'
  | 'order_update'
  | 'peak_price_update'
  | 'settlement_requested'
  // Control frame from /ws/trading: the gateway dropped our backlog rather than
  // buffering it, so the local view is stale and must be re-seeded from REST.
  | 'resync'
  // Public /api/market/ws stream (energy-grid map)
  | 'grid_status_updated'
  | 'grid_status'
  | 'meter.telemetry'
  | 'meter_telemetry'

/** Standard WebSocket message format */
export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType
  data: T
  timestamp: string
}

/** WebSocket connection options */
export interface WebSocketClientOptions {
  /** Whether to automatically reconnect on disconnect */
  reconnect?: boolean
  /** Delay in ms before attempting reconnect */
  reconnectDelay?: number
  /** Maximum number of reconnect attempts */
  maxReconnectAttempts?: number
  /** Authentication token for private channels */
  token?: string
  /** If true, this is a public endpoint that doesn't require authentication */
  isPublic?: boolean
  /**
   * Extra query parameters for the handshake, e.g. `{ zone_id: 1 }` for
   * `/ws/trading`. Merged with `token` through URLSearchParams — appending a
   * second `?` by hand produces a URL the gateway rejects.
   */
  params?: Record<string, string | number>
}

/** Event handler type for WebSocket messages */
export type WebSocketEventHandler<T = unknown> = (message: WebSocketMessage<T>) => void

/**
 * Outbound backpressure ceiling. Past this many bytes still sitting in the
 * socket's send buffer, `send()` drops rather than queues. This app sends
 * almost nothing (subscriptions are fixed at handshake time via the query
 * string), so hitting it means the connection is degraded, not busy.
 */
const MAX_BUFFERED_BYTES = 1_000_000

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
  // disconnect() closing the socket still fires onclose — without this flag
  // that onclose would schedule a reconnect and resurrect the connection.
  private intentionalClose = false

  constructor(path: string, options: WebSocketClientOptions = {}) {
    this.url = getWsUrl(path)
    this.options = {
      reconnect: options.reconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      token: options.token ?? '',
      isPublic: options.isPublic ?? false,
      params: options.params ?? {},
    }
  }

  /**
   * Handshake URL with `params` and `token` merged into one query string.
   * `/ws/trading` needs both `zone_id` and `token`; string-concatenating a
   * second `?token=` yields `...?zone_id=1?token=...`, which APISIX rejects.
   */
  private buildUrl(): string {
    const qs = new URLSearchParams()
    for (const [key, value] of Object.entries(this.options.params)) {
      qs.set(key, String(value))
    }
    if (this.options.token) qs.set('token', this.options.token)
    const query = qs.toString()
    return query ? `${this.url}?${query}` : this.url
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    this.intentionalClose = false
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.debug('WebSocket already connected')
      return
    }

    try {
      const url = this.buildUrl()

      // Guard: Don't connect to authenticated /ws/* paths without a valid-looking token
      // The path /api/market/ws is public and doesn't require auth
      const isAuthenticatedWsPath = this.url.match(/\/ws\/\w+/) && !this.url.includes('/api/market/ws')

      // Basic token validation (JWTs are typically long and have 3 parts)
      const isValidToken = this.options.token &&
        this.options.token.length > 20 &&
        this.options.token.split('.').length === 3;

      if (isAuthenticatedWsPath && !isValidToken && !this.options.isPublic) {
        if (this.options.token) {
          console.warn(`WebSocket connection deferred for ${this.url}: Invalid token format.`)
        } else {
          console.debug(`WebSocket connection deferred for ${this.url}: Token required.`)
        }
        return
      }

      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        console.debug(`WebSocket connected [${this.url}]`)
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = () => {
        // WebSocket onerror provides no useful detail (browser security restriction).
        // The subsequent onclose event carries the close code/reason, so we only
        // log at debug level here to avoid noisy console errors on expected
        // failures such as token expiry or server restarts.
        console.debug(`WebSocket connection error [${this.url}]`)
      }

      this.ws.onclose = (event) => {
        if (this.intentionalClose) return

        // 1008 = Policy Violation (often auth), 1006 = Abnormal Closure (upgrade rejected / network)
        const isAuthFailure = event.code === 1008 ||
          (event.code === 1006 && this.options.token && !this.options.isPublic)

        if (isAuthFailure) {
          // Don't reconnect for auth failures — token is likely expired/invalid
          // and retrying will just produce the same error.
          console.debug(
            `WebSocket auth failure [${this.url}] (code: ${event.code}). Not reconnecting.`
          )
          return
        }

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
    this.intentionalClose = true
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
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected')
      return
    }

    // Backpressure. bufferedAmount is what the socket has accepted but not yet
    // put on the wire; if it keeps climbing the peer is slower than we are and
    // queueing more just grows memory until the tab dies. Drop instead — the
    // stream is recoverable (the gateway resyncs), an OOM tab is not.
    // `?? 0` because the jsdom mock in the unit tests has no bufferedAmount.
    if ((this.ws.bufferedAmount ?? 0) > MAX_BUFFERED_BYTES) {
      console.warn(
        `WebSocket send dropped [${this.url}]: ${this.ws.bufferedAmount} bytes still buffered`
      )
      return
    }

    this.ws.send(JSON.stringify(message))
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
      console.debug(`WebSocket disconnected [${this.url}]: Max reconnect attempts reached`)
      return
    }

    this.reconnectAttempts++
    
    // Exponential backoff with jitter: delay = baseDelay * 2^(attempt-1) + random jitter
    // Attempt 1: 3s, Attempt 2: 6s, Attempt 3: 12s, Attempt 4: 24s, Attempt 5: 48s
    const baseDelay = this.options.reconnectDelay
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1)
    // Add jitter: ±20% random variation to prevent thundering herd
    const jitter = (Math.random() - 0.5) * 0.4 * exponentialDelay
    const delay = Math.min(exponentialDelay + jitter, 60000) // Cap at 60 seconds

    console.debug(
      `WebSocket reconnecting (${this.reconnectAttempts}/${this.options.maxReconnectAttempts}) [${this.url}] in ${(delay / 1000).toFixed(1)}s...`
    )

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, delay)
  }
}

/**
 * Hook-friendly WebSocket manager for React components
 */
/**
 * Authenticated channels that actually have a `/ws/<channel>` route on the
 * gateway. Anything not listed here is a no-op rather than a dial that 404s and
 * burns the reconnect budget.
 *
 * `trading` → APISIX route 23 (`apisix_conf/apisix.yaml`) → trading-api's
 * `ws_handler` (`crates/trading-api/src/websocket.rs`). It requires a `zone_id`
 * param alongside the token, and streams per-zone sequenced market data.
 *
 * Still absent, deliberately: `orderbook`, `trades`, `epochs`. APISIX has no
 * route for those paths and trading-service serves no handler at them.
 */
const ROUTED_WS_CHANNELS: ReadonlySet<string> = new Set<string>(['trading'])

/**
 * Identity of a subscription: the channel plus its params, sorted so key order
 * never affects the result. Two callers asking for the same channel+params
 * share one socket; different params get their own.
 */
function paramKey(
  channel: string,
  params?: Record<string, string | number>
): string {
  if (!params) return channel
  const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
  if (!entries.length) return channel
  return `${channel}?${entries.map(([k, v]) => `${k}=${v}`).join('&')}`
}

export class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map()
  private refCounts: Map<string, number> = new Map()
  private publicClient: WebSocketClient | null = null
  private publicRefCount: number = 0

  /**
   * Get or create a WebSocket client for the given channel.
   * If no token is provided, returns a public market WebSocket instead.
   * Returns null for channels with no gateway route — callers must no-op.
   */
  getOrCreate(
    channel: string,
    token?: string,
    params?: Record<string, string | number>
  ): WebSocketClient | null {
    // If no token, use public market WebSocket as fallback
    if (!token) {
      return this.getOrCreatePublic()
    }

    if (!ROUTED_WS_CHANNELS.has(channel)) {
      return null
    }

    // Params are part of the identity, not just the URL: /ws/trading?zone_id=1
    // and ?zone_id=2 are different streams. Keying on channel alone would hand
    // a zone-2 subscriber the zone-1 socket and silently show it another zone's
    // book.
    const key = paramKey(channel, params)
    let client = this.clients.get(key)

    if (!client) {
      client = new WebSocketClient(`/ws/${channel}`, { token, params })
      this.clients.set(key, client)
      this.refCounts.set(key, 1)
    } else {
      // Increment ref count
      const count = this.refCounts.get(key) || 0
      this.refCounts.set(key, count + 1)

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

  /** Must be called with the same `params` passed to `getOrCreate`. */
  disconnect(channel: string, params?: Record<string, string | number>): void {
    const key = paramKey(channel, params)
    const count = this.refCounts.get(key) || 0
    if (count <= 1) {
      const client = this.clients.get(key)
      if (client) {
        client.disconnect()
        this.clients.delete(key)
      }
      this.refCounts.delete(key)
    } else {
      this.refCounts.set(key, count - 1)
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

