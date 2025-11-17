/**
 * API Client for GridTokenX Platform
 * Uses native fetch API with environment-based configuration
 */

import { API_CONFIG, getApiUrl } from './config';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  token?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
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
  const {
    method = 'GET',
    headers = {},
    body,
    token,
  } = options;

  const url = getApiUrl(path);

  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authorization token if provided
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || data.error || 'Request failed',
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
    };
  }
}

/**
 * API Client class for organized API calls
 */
export class ApiClient {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = undefined;
  }

  // Authentication
  async login(email: string, password: string) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async register(email: string, password: string, walletAddress?: string) {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: { email, password, wallet_address: walletAddress },
    });
  }

  async logout() {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
      token: this.token,
    });
  }

  // Trading
  async createOrder(orderData: {
    energy_amount: string;
    price_per_kwh: string;
    order_type?: string;
  }) {
    return apiRequest('/api/orders', {
      method: 'POST',
      body: orderData,
      token: this.token,
    });
  }

  async getOrders(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams(filters as any);
    return apiRequest(`/api/orders?${params.toString()}`, {
      method: 'GET',
      token: this.token,
    });
  }

  async getOrderBook() {
    return apiRequest('/api/orders/book', {
      method: 'GET',
      token: this.token,
    });
  }

  async getMarketData() {
    return apiRequest('/api/market', {
      method: 'GET',
      token: this.token,
    });
  }

  async getTrades(filters?: {
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams(filters as any);
    return apiRequest(`/api/trades?${params.toString()}`, {
      method: 'GET',
      token: this.token,
    });
  }

  // User
  async getProfile() {
    return apiRequest('/api/user/profile', {
      method: 'GET',
      token: this.token,
    });
  }

  async getBalance() {
    return apiRequest('/api/user/balance', {
      method: 'GET',
      token: this.token,
    });
  }

  async getPositions() {
    return apiRequest('/api/user/positions', {
      method: 'GET',
      token: this.token,
    });
  }

  // Meters
  async submitMeterData(meterData: {
    meter_id: string;
    energy_produced?: number;
    energy_consumed?: number;
    timestamp?: string;
  }) {
    return apiRequest('/api/meters/submit', {
      method: 'POST',
      body: meterData,
      token: this.token,
    });
  }

  async getMeterData(meterId: string) {
    return apiRequest(`/api/meters/${meterId}`, {
      method: 'GET',
      token: this.token,
    });
  }
}

/**
 * Create a new API client instance
 */
export function createApiClient(token?: string): ApiClient {
  return new ApiClient(token);
}

/**
 * Default API client instance (can be used for unauthenticated requests)
 */
export const defaultApiClient = createApiClient();
