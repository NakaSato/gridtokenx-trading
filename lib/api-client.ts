/**
 * API Client for GridTokenX Platform
 * Uses native fetch API with environment-based configuration
 */

import { API_CONFIG, getApiUrl } from './config'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailResponse,
  UserProfile,
  ResendVerificationRequest,
  ResendVerificationResponse,
} from '../types/auth'

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  token?: string
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

/**
 * Make an API request using native fetch
 * @param path - API endpoint path (e.g., '/api/orders')
 * @param options - Request options
 */
export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', headers = {}, body, token } = options

  const url = getApiUrl(path)

  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // Add authorization token if provided
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  try {
    if (path.includes('analytics/my-stats')) {
      console.log('API Request:', method, url, 'Token present:', !!token, 'Headers:', requestHeaders)
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    })

    // Get the response text first
    const text = await response.text()

    // Try to parse JSON, but handle empty responses
    let data: any = {}
    if (text) {
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        // If JSON parsing fails, return the text as error
        return {
          error: `Invalid JSON response: ${text}`,
          status: response.status,
        }
      }
    }

    if (!response.ok) {
      let errorMessage = 'Request failed'
      if (data.message) {
        errorMessage = data.message
      } else if (data.error) {
        if (typeof data.error === 'string') {
          errorMessage = data.error
        } else if (typeof data.error === 'object' && data.error.message) {
          errorMessage = data.error.message
        } else {
          errorMessage = JSON.stringify(data.error)
        }
      }

      return {
        error: errorMessage,
        status: response.status,
      }
    }

    return {
      data,
      status: response.status,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
    }
  }
}

/**
 * API Client class for organized API calls
 */
export class ApiClient {
  private token?: string

  constructor(token?: string) {
    this.token = token
  }

  setToken(token: string): void {
    this.token = token
  }

  clearToken(): void {
    this.token = undefined
  }

  // Authentication
  // V1 RESTful API endpoints
  async login(
    username: string,
    password: string
  ): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>('/api/v1/auth/token', {
      method: 'POST',
      body: { username, password },
    })
  }

  async register(
    userData: RegisterRequest
  ): Promise<ApiResponse<RegisterResponse>> {
    return apiRequest<RegisterResponse>('/api/v1/users', {
      method: 'POST',
      body: userData,
    })
  }

  async verifyWalletSignature(data: {
    wallet_address: string
    signature: string
    message: string
    timestamp: number
  }): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>('/api/v1/auth/wallet/verify', {
      method: 'POST',
      body: data,
    })
  }

  async logout() {
    return apiRequest('/api/v1/auth/logout', {
      method: 'POST',
      token: this.token,
    })
  }

  async updateWallet(
    walletAddress: string,
    verifyOwnership?: boolean
  ): Promise<ApiResponse<UserProfile>> {
    return apiRequest<UserProfile>('/api/v1/user/wallet', {
      method: 'POST',
      body: {
        wallet_address: walletAddress,
        verify_ownership: verifyOwnership,
      },
      token: this.token || undefined,
    })
  }

  async verifyEmail(token: string): Promise<ApiResponse<VerifyEmailResponse>> {
    return apiRequest<VerifyEmailResponse>(
      `/api/v1/auth/verify?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
      }
    )
  }

  async resendVerification(
    email: string
  ): Promise<ApiResponse<ResendVerificationResponse>> {
    return apiRequest<ResendVerificationResponse>(
      '/api/v1/auth/resend-verification',
      {
        method: 'POST',
        body: { email },
      }
    )
  }

  async forgotPassword(
    email: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest<{ success: boolean; message: string }>(
      '/api/v1/auth/forgot-password',
      {
        method: 'POST',
        body: { email },
      }
    )
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest<{ success: boolean; message: string }>(
      '/api/v1/auth/reset-password',
      {
        method: 'POST',
        body: { token, new_password: newPassword },
      }
    )
  }

  // Trading
  async createOrder(orderData: {
    energy_amount: string
    price_per_kwh: string
    order_type?: string
  }) {
    return apiRequest('/api/v1/trading/orders', {
      method: 'POST',
      body: orderData,
      token: this.token,
    })
  }

  async getOrders(filters?: {
    status?: string
    limit?: number
    offset?: number
  }) {
    const params = new URLSearchParams(filters as any)
    return apiRequest(`/api/v1/trading/orders?${params.toString()}`, {
      method: 'GET',
      token: this.token,
    })
  }

  async getOrderBook(filters?: { status?: string }) {
    const params = new URLSearchParams(filters as any)
    return apiRequest(`/api/v1/trading/orderbook?${params.toString()}`, {
      method: 'GET',
      token: this.token,
    })
  }

  async getMarketData() {
    return apiRequest('/api/v1/analytics/market', {
      method: 'GET',
      token: this.token,
    })
  }

  async getTrades(filters?: { limit?: number; offset?: number }) {
    const params = new URLSearchParams(filters as any)
    return apiRequest<import('../types/trading').TradeHistory>(
      `/api/v1/trading/trades?${params.toString()}`,
      {
        method: 'GET',
        token: this.token,
      }
    )
  }

  async cancelOrder(orderId: string) {
    return apiRequest(`/api/v1/trading/orders/${orderId}`, {
      method: 'DELETE',
      token: this.token,
    })
  }

  // P2P Trading
  async createP2POrder(orderData: {
    side: 'Buy' | 'Sell'
    amount: string
    price_per_kwh: string
  }) {
    return apiRequest<{ id: string }>('/api/v1/trading/orders', {
      method: 'POST',
      body: {
        side: orderData.side, // Keep capitalized as backend expects "Buy" or "Sell"
        energy_amount: orderData.amount,
        price_per_kwh: orderData.price_per_kwh,
        order_type: 'Limit' // Use Limit order type (capitalized)
      },
      token: this.token,
    })
  }

  async getP2POrderBook() {
    return apiRequest<{ asks: any[]; bids: any[] }>('/api/v1/trading/orderbook', {
      method: 'GET',
      token: this.token,
    })
  }

  async getMyP2POrders() {
    return apiRequest<any[]>('/api/v1/trading/orders', {
      method: 'GET',
      token: this.token,
    })
  }

  // P2P Transaction Cost Calculation
  async calculateP2PCost(request: {
    buyer_zone_id: number
    seller_zone_id: number
    energy_amount: number
    agreed_price?: number
  }) {
    return apiRequest<{
      energy_cost: number
      wheeling_charge: number
      loss_cost: number
      total_cost: number
      effective_energy: number
      loss_factor: number
      loss_allocation: string
      zone_distance_km: number
      buyer_zone: number
      seller_zone: number
      is_grid_compliant: boolean
      grid_violation_reason?: string
    }>('/api/v1/trading/p2p/calculate-cost', {
      method: 'POST',
      body: request,
      token: this.token,
    })
  }

  async getP2PMarketPrices() {
    return apiRequest<{
      base_price_thb_kwh: number
      grid_import_price_thb_kwh: number
      grid_export_price_thb_kwh: number
      loss_allocation_model: string
      wheeling_charges: Record<string, number>
      loss_factors: Record<string, number>
    }>('/api/v1/trading/p2p/market-prices', {
      method: 'GET',
      token: this.token,
    })
  }

  // User
  async getProfile() {
    return apiRequest('/api/v1/users/me', {
      method: 'GET',
      token: this.token,
    })
  }

  async updateProfile(profileData: {
    email?: string
    first_name?: string
    last_name?: string
    wallet_address?: string
  }) {
    return apiRequest('/api/v1/users/me', {
      method: 'PATCH',
      body: profileData,
      token: this.token,
    })
  }

  async getBalance(walletAddress?: string) {
    const endpoint = walletAddress
      ? `/api/v1/wallets/${walletAddress}/balance`
      : '/api/v1/wallets/unknown/balance'

    return apiRequest(endpoint, {
      method: 'GET',
      token: this.token,
    })
  }

  async getPositions() {
    return apiRequest('/api/v1/futures/positions', {
      method: 'GET',
      token: this.token,
    })
  }

  // Meters
  async submitMeterData(data: import('../types/meter').SubmitReadingRequest) {
    // For v1, use serial in path: POST /api/v1/meters/{serial}/readings
    // Explicitly enable auto_mint for automatic token minting
    const serial = data.meter_serial || 'unknown'
    return apiRequest<import('../types/meter').MeterReading>(`/api/v1/meters/${serial}/readings?auto_mint=true`, {
      method: 'POST',
      body: { kwh: data.kwh_amount, wallet_address: data.wallet_address, timestamp: data.reading_timestamp },
      token: this.token,
    })
  }

  // Futures
  async getFuturesProducts() {
    return apiRequest<import('../types/futures').FuturesProduct[]>('/api/v1/futures/products', {
      method: 'GET',
      token: this.token,
    })
  }

  async createFuturesOrder(data: import('../types/futures').CreateFuturesOrderRequest) {
    return apiRequest<{ order_id: string }>('/api/v1/futures/orders', {
      method: 'POST',
      body: data,
      token: this.token,
    })
  }

  async getFuturesPositions() {
    return apiRequest<import('../types/futures').FuturesPosition[]>('/api/v1/futures/positions', {
      method: 'GET',
      token: this.token,
    })
  }

  async getFuturesCandles(productId: string, interval: string = '1m') {
    const params = new URLSearchParams({ product_id: productId, interval })
    return apiRequest<import('../types/futures').Candle[]>(`/api/v1/futures/candles?${params.toString()}`, {
      method: 'GET',
      token: this.token,
    })
  }

  async getFuturesOrderBook(productId: string) {
    const params = new URLSearchParams({ product_id: productId })
    return apiRequest<import('../types/futures').OrderBook>(`/api/v1/futures/orderbook?${params.toString()}`, {
      method: 'GET',
      token: this.token,
    })
  }

  async getFuturesOrders() {
    return apiRequest<import('../types/futures').FuturesOrder[]>('/api/v1/futures/orders/my', {
      method: 'GET',
      token: this.token,
    })
  }

  async closeFuturesPosition(positionId: string) {
    return apiRequest<{ order_id: string }>(`/api/v1/futures/positions/${positionId}/close`, {
      method: 'POST',
      token: this.token,
    })
  }

  // Analytics
  async getMarketAnalytics(params: { timeframe: string }): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/api/v1/analytics/market?timeframe=${params.timeframe}`, {
      method: 'GET',
      token: this.token,
    })
  }

  async getUserAnalytics(params: { timeframe: string }): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/api/v1/analytics/my-stats?timeframe=${params.timeframe}`, {
      method: 'GET',
      token: this.token,
    })
  }

  async getUserHistory(params: { timeframe: string }): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/api/v1/analytics/my-history?timeframe=${params.timeframe}`, {
      method: 'GET',
      token: this.token,
    })
  }

  async getMeterStats() {
    return apiRequest<import('../types/meter').MeterStats>('/api/v1/meters/stats', {
      method: 'GET',
      token: this.token,
    })
  }

  async getMyReadings(limit = 10, offset = 0) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() })
    return apiRequest<import('../types/meter').MeterReading[]>(
      `/api/v1/meters/readings?${params.toString()}`,
      {
        method: 'GET',
        token: this.token,
      }
    )
  }

  async getMyMeters() {
    return apiRequest<import('../types/meter').MeterResponse[]>('/api/v1/users/me/meters', {
      method: 'GET',
      token: this.token,
    })
  }

  async registerMeter(data: { serial_number: string; meter_type: string; location: string; latitude?: number; longitude?: number }) {
    return apiRequest<import('../types/meter').RegisterMeterResponse>('/api/v1/meters', {
      method: 'POST',
      body: data,
      token: this.token,
    })
  }

  // Minting - Mint tokens from user's unminted readings
  async mintReading(readingId: string): Promise<ApiResponse<{
    message: string
    transaction_signature: string
    kwh_amount: string
    wallet_address: string
  }>> {
    return apiRequest(`/api/v1/meters/readings/${readingId}/mint`, {
      method: 'POST',
      token: this.token,
    })
  }



  // Transactions
  async getUserTransactions(filters?: {
    transaction_type?: string
    status?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
    min_attempts?: number
    has_signature?: boolean
  }) {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const queryString = params.toString()
    const endpoint = queryString
      ? `/api/v1/analytics/transactions?${queryString}`
      : '/api/v1/analytics/transactions'

    return apiRequest<import('../types/transactions').UserTransactionsResponse>(
      endpoint,
      {
        method: 'GET',
        token: this.token,
      }
    )
  }
}

/**
 * Create a new API client instance
 */
export function createApiClient(token?: string): ApiClient {
  return new ApiClient(token)
}

/**
 * Default API client instance (can be used for unauthenticated requests)
 */
export const defaultApiClient = new ApiClient()
