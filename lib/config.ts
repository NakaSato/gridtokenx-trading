/**
 * Application Configuration
 * Centralized configuration using environment variables
 */

// -----------------------------------------------------------------------------
// Solana Network Configuration
// -----------------------------------------------------------------------------
export const SOLANA_CONFIG = {
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'localnet',
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'http://localhost:8899',
  wsUrl: process.env.NEXT_PUBLIC_SOLANA_WS_URL || 'ws://localhost:8900',
} as const;

// -----------------------------------------------------------------------------
// API Gateway Configuration
// -----------------------------------------------------------------------------
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  wsBaseUrl: process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8080',
} as const;

// -----------------------------------------------------------------------------
// Mapbox Configuration
// -----------------------------------------------------------------------------
export const MAPBOX_CONFIG = {
  token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
} as const;

// -----------------------------------------------------------------------------
// Feature Flags
// -----------------------------------------------------------------------------
export const FEATURE_FLAGS = {
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  showDevTools: process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === 'true',
} as const;

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: `${API_CONFIG.baseUrl}/api/auth/login`,
    register: `${API_CONFIG.baseUrl}/api/auth/register`,
    logout: `${API_CONFIG.baseUrl}/api/auth/logout`,
    refresh: `${API_CONFIG.baseUrl}/api/auth/refresh`,
  },
  // Trading
  trading: {
    orders: `${API_CONFIG.baseUrl}/api/orders`,
    orderBook: `${API_CONFIG.baseUrl}/api/orders/book`,
    marketData: `${API_CONFIG.baseUrl}/api/market`,
    trades: `${API_CONFIG.baseUrl}/api/trades`,
  },
  // User
  user: {
    profile: `${API_CONFIG.baseUrl}/api/user/profile`,
    balance: `${API_CONFIG.baseUrl}/api/user/balance`,
    positions: `${API_CONFIG.baseUrl}/api/user/positions`,
  },
  // Meters
  meters: {
    data: `${API_CONFIG.baseUrl}/api/meters`,
    submit: `${API_CONFIG.baseUrl}/api/meters/submit`,
  },
  // WebSocket
  ws: {
    orderBook: `${API_CONFIG.wsBaseUrl}/ws/orderbook`,
    trades: `${API_CONFIG.wsBaseUrl}/ws/trades`,
    epochs: `${API_CONFIG.wsBaseUrl}/ws/epochs`,
  },
} as const;

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Check if running in development mode
 */
export const isDevelopment = () => process.env.NODE_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Get full API URL for a given path
 */
export const getApiUrl = (path: string): string => {
  return `${API_CONFIG.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Get full WebSocket URL for a given path
 */
export const getWsUrl = (path: string): string => {
  return `${API_CONFIG.wsBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Validate configuration on app startup
 */
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!SOLANA_CONFIG.rpcUrl) {
    errors.push('NEXT_PUBLIC_SOLANA_RPC_URL is required');
  }

  if (!API_CONFIG.baseUrl) {
    errors.push('NEXT_PUBLIC_API_BASE_URL is required');
  }

  if (FEATURE_FLAGS.enableAnalytics && !MAPBOX_CONFIG.token) {
    errors.push('NEXT_PUBLIC_MAPBOX_TOKEN is required when analytics is enabled');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Validate config in development mode
if (isDevelopment() && typeof window !== 'undefined') {
  const validation = validateConfig();
  if (!validation.valid) {
    console.warn('⚠️ Configuration validation warnings:', validation.errors);
  }
}
