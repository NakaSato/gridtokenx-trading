/**
 * Application Configuration
 * Centralized configuration using environment variables with type safety
 */

import { isExternalUrl } from './links'

// =============================================================================
// Type Definitions
// =============================================================================

export interface SolanaConfig {
  readonly network: string
  readonly rpcUrl: string
  readonly wsUrl: string
}

export interface ApiConfig {
  readonly baseUrl: string
  readonly wsBaseUrl: string
}

export interface MapboxConfig {
  readonly token: string
}

export interface FeatureFlags {
  readonly enableAnalytics: boolean
  readonly enableDebug: boolean
  readonly showDevTools: boolean
}

// =============================================================================
// Configuration Objects
// =============================================================================
export const SOLANA_CONFIG = {
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'localnet',
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://apisix.gridtokenx-coresystem.orb.local/api/v1/rpc',
  wsUrl: process.env.NEXT_PUBLIC_SOLANA_WS_URL || 'wss://apisix.gridtokenx-coresystem.orb.local/api/v1/rpc-ws',
} as const

// -----------------------------------------------------------------------------
// API Gateway Configuration
// -----------------------------------------------------------------------------
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://apisix.gridtokenx-coresystem.orb.local',
  wsBaseUrl: process.env.NEXT_PUBLIC_WS_BASE_URL || 'wss://apisix.gridtokenx-coresystem.orb.local',
} as const

// -----------------------------------------------------------------------------
// Mapbox Configuration
// -----------------------------------------------------------------------------
export const MAPBOX_CONFIG = {
  token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
} as const

// -----------------------------------------------------------------------------
// Feature Flags
// -----------------------------------------------------------------------------
export const FEATURE_FLAGS = {
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  showDevTools: process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === 'true',
} as const

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: `${API_CONFIG.baseUrl}/api/v1/auth/login`,
    register: `${API_CONFIG.baseUrl}/api/v1/auth/register`,
    logout: `${API_CONFIG.baseUrl}/api/v1/auth/logout`,
    refresh: `${API_CONFIG.baseUrl}/api/v1/auth/refresh`,
  },
  // Trading
  trading: {
    orders: `${API_CONFIG.baseUrl}/api/v1/orders`,
    orderBook: `${API_CONFIG.baseUrl}/api/v1/futures/book`,
    marketData: `${API_CONFIG.baseUrl}/api/v1/stats`,
    quotes: `${API_CONFIG.baseUrl}/api/v1/quotes`,
    futures: `${API_CONFIG.baseUrl}/api/v1/futures`,
  },
  // User
  user: {
    profile: `${API_CONFIG.baseUrl}/api/v1/me`,
    wallets: `${API_CONFIG.baseUrl}/api/v1/me/wallets`,
    registration: `${API_CONFIG.baseUrl}/api/v1/me/registration`,
    balance: `${API_CONFIG.baseUrl}/api/v1/me/wallets`,
    transactions: `${API_CONFIG.baseUrl}/api/v1/transactions`,
    notifications: `${API_CONFIG.baseUrl}/api/v1/noti`,
    carbon: `${API_CONFIG.baseUrl}/api/v1/carbon`,
  },
  // No `meters` block: it held `data`/`submit` (both the legacy `/api/v1/meters`)
  // and `myMeters`, none of which was ever read — every meter call goes through
  // MetersApi (`lib/api/meters.ts`), which now targets the caller-scoped
  // `/api/v1/me/meters*` routes. A second, unread copy of these URLs is how the
  // legacy paths silently outlived their replacement; keep meter endpoints in
  // the api module only.
  // Grid
  grid: {
    // No `status`: GET /api/v1/public/grid-status was removed — aggregate grid
    // state comes over the public WS only.
    topology: `${API_CONFIG.baseUrl}/api/v1/public/grid-topology`,
  },
  // WebSocket: no /ws/<channel> endpoints exist — the gateway routes only
  // /ws (noti), /api/market/ws (simulator) and /api/v1/rpc-ws (solana).
  // Socket URLs are built by getWsUrl() at the call site instead.
} as const

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Check if running in development mode
 */
export const isDevelopment = () => process.env.NODE_ENV === 'development'

/**
 * Check if running in production mode
 */
export const isProduction = () => process.env.NODE_ENV === 'production'

/**
 * Get full API URL for a given path
 * Validates the path to prevent double slashes
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_CONFIG.baseUrl}${cleanPath}`
}

/**
 * Get full WebSocket URL for a given path
 * Validates the path to prevent double slashes
 */
export const getWsUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_CONFIG.wsBaseUrl}${cleanPath}`
}

/**
 * Validate configuration on app startup
 */
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!SOLANA_CONFIG.rpcUrl) {
    errors.push('NEXT_PUBLIC_SOLANA_RPC_URL is required')
  }

  if (!API_CONFIG.baseUrl) {
    errors.push('NEXT_PUBLIC_API_BASE_URL is required')
  }

  if (FEATURE_FLAGS.enableAnalytics && !MAPBOX_CONFIG.token) {
    errors.push(
      'NEXT_PUBLIC_MAPBOX_TOKEN is required when analytics is enabled'
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Validate config in development mode
if (isDevelopment() && typeof window !== 'undefined') {
  const validation = validateConfig()
  if (!validation.valid) {
    console.warn('⚠️ Configuration validation warnings:', validation.errors)
  }
}
