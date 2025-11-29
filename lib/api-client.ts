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
  method?: 'GET' | 'POST' | 'PUT'
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
  async login(
    username: string,
    password: string
  ): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
  }

  async register(
    userData: RegisterRequest
  ): Promise<ApiResponse<RegisterResponse>> {
    return apiRequest<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: userData,
    })
  }

  async logout() {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
      token: this.token,
    })
  }

  async updateWallet(
    walletAddress: string,
    verifyOwnership?: boolean
  ): Promise<ApiResponse<UserProfile>> {
    return apiRequest<UserProfile>('/api/user/wallet', {
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
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
      }
    )
  }

  async resendVerification(
    email: string
  ): Promise<ApiResponse<ResendVerificationResponse>> {
    return apiRequest<ResendVerificationResponse>(
      '/api/auth/resend-verification',
      {
        method: 'POST',
        body: { email },
      }
    )
  }

  // Trading
  async createOrder(orderData: {
    energy_amount: string
    price_per_kwh: string
    order_type?: string
  }) {
    return apiRequest('/api/orders', {
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
    return apiRequest(`/api/orders?${params.toString()}`, {
      method: 'GET',
      token: this.token,
    })
  }

  async getOrderBook() {
    return apiRequest('/api/orders/book', {
      method: 'GET',
      token: this.token,
    })
  }

  async getMarketData() {
    return apiRequest('/api/market', {
      method: 'GET',
      token: this.token,
    })
  }

  async getTrades(filters?: { limit?: number; offset?: number }) {
    const params = new URLSearchParams(filters as any)
    return apiRequest<import('../types/trading').TradeHistory>(
      `/api/market-data/trades/my-history?${params.toString()}`,
      {
        method: 'GET',
        token: this.token,
      }
    )
  }

  // User
  async getProfile() {
    return apiRequest('/api/auth/profile', {
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
    return apiRequest('/api/auth/profile/update', {
      method: 'POST',
      body: profileData,
      token: this.token,
    })
  }

  async getBalance(walletAddress?: string) {
    const endpoint = walletAddress
      ? `/api/tokens/balance/${walletAddress}`
      : '/api/tokens/balance'

    return apiRequest(endpoint, {
      method: 'GET',
      token: this.token,
    })
  }

  async getPositions() {
    return apiRequest('/api/user/positions', {
      method: 'GET',
      token: this.token,
    })
  }

  // Meters
  async submitMeterData(meterData: {
    meter_id: string
    energy_produced?: number
    energy_consumed?: number
    timestamp?: string
  }) {
    return apiRequest('/api/meters/submit', {
      method: 'POST',
      body: meterData,
      token: this.token,
    })
  }

  async getMeterData(meterId: string) {
    return apiRequest(`/api/meters/${meterId}`, {
      method: 'GET',
      token: this.token,
    })
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
export const defaultApiClient = createApiClient()
