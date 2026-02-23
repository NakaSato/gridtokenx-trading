'use client'

/**
 * React Hooks for API Client
 */

import { useState, useCallback, useEffect } from 'react'
import { ApiClient, ApiResponse, createApiClient } from '../lib/api-client'
import type { Role } from '@/types/auth'

/**
 * Hook to access the API client with optional authentication
 */
export function useApiClient(token?: string) {
  const [client] = useState(() => createApiClient(token))

  useEffect(() => {
    if (token) {
      client.setToken(token)
    } else {
      client.clearToken()
    }
  }, [client, token])

  return client
}

/**
 * Generic hook for API requests with loading and error states
 */
export function useApiRequest<T = any>(
  requestFn: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await requestFn()

      if (response.error) {
        setError(response.error)
        setData(null)
      } else {
        setData(response.data ?? null)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [requestFn])

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
  }
}

/**
 * Hook for fetching order book data
 */
export function useOrderBook(token?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getOrderBook(),
    [token]
  )

  return {
    orderBook: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching market data
 */
export function useMarketData(token?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getMarketData(),
    [token]
  )

  return {
    marketData: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for creating orders
 */
export function useCreateOrder(token?: string) {
  const client = useApiClient(token)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOrder = useCallback(
    async (orderData: {
      energy_amount: string
      price_per_kwh: string
      order_type?: string
    }) => {
      setLoading(true)
      setError(null)

      try {
        const response = await client.createOrder(orderData)

        if (response.error) {
          setError(response.error)
          return null
        }

        return response.data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [client]
  )

  return {
    createOrder,
    loading,
    error,
  }
}

/**
 * Hook for fetching user profile
 */
export function useUserProfile(token?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getProfile(),
    [token]
  )

  return {
    profile: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching user balance
 */
export function useUserBalance(token?: string, walletAddress?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getBalance(walletAddress),
    [token, walletAddress]
  )

  return {
    balance: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching user positions
 */
export function useUserPositions(token?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getPositions(),
    [token]
  )

  return {
    positions: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching trades
 */
export function useTrades(
  token?: string,
  filters?: { limit?: number; offset?: number }
) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getTrades(filters),
    [token, filters]
  )

  return {
    trades: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for authentication
 */
export function useAuth() {
  const [token, setToken] = useState<string | null>(null)
  const client = useApiClient(token ?? undefined)

  useEffect(() => {
    // Load token from localStorage on mount
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await client.login(email, password)

      if (response.error) {
        throw new Error(response.error)
      }

      const newToken = response.data?.access_token
      if (newToken) {
        setToken(newToken)
        localStorage.setItem('auth_token', newToken)
      }

      return response.data
    },
    [client]
  )

  const logout = useCallback(async () => {
    await client.logout()
    setToken(null)
    localStorage.removeItem('auth_token')
  }, [client])

  const register = useCallback(
    async (userData: {
      username: string
      email: string
      password: string
      first_name: string
      last_name: string
      role?: Role
      wallet_address?: string
    }) => {
      const response = await client.register(userData)

      if (response.error) {
        throw new Error(response.error)
      }

      return response.data
    },
    [client]
  )

  return {
    token,
    login,
    logout,
    register,
    isAuthenticated: !!token,
  }
}

/**
 * Hook for fetching revenue summary (Admin)
 */
export function useRevenueSummary(token?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getRevenueSummary(),
    [token]
  )

  return {
    summary: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching revenue records (Admin)
 */
export function useRevenueRecords(
  token?: string,
  filters?: { limit?: number; offset?: number }
) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getRevenueRecords(filters?.limit, filters?.offset),
    [token, filters]
  )

  return {
    records: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching VPP clusters (Admin)
 */
export function useVppClusters(token?: string) {
  const client = useApiClient(token)

  const { data, loading, error, refetch } = useApiRequest(
    () => client.getVppClusters(),
    [token]
  )

  return {
    clusters: data,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for dispatching VPP cluster (Admin)
 */
export function useDispatchVppCluster(token?: string) {
  const client = useApiClient(token)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dispatch = useCallback(
    async (clusterId: string, targetKw: number) => {
      setLoading(true)
      setError(null)
      try {
        const response = await client.dispatchVppCluster(clusterId, targetKw)
        if (response.error) {
          setError(response.error)
          return null
        }
        return response.data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        return null
      } finally {
        setLoading(false)
      }
    },
    [client]
  )

  return {
    dispatch,
    loading,
    error,
  }
}

/**
 * Hook for fetching platform statistics (Admin)
 */
export function useAdminStats(token?: string) {
  const client = useApiClient(token)
  const { data, loading, error, refetch } = useApiRequest(
    () => client.getAdminStats(),
    [token]
  )
  return { stats: data, loading, error, refetch }
}

/**
 * Hook for fetching system health (Admin)
 */
export function useSystemHealth(token?: string) {
  const client = useApiClient(token)
  const { data, loading, error, refetch } = useApiRequest(
    () => client.getSystemHealth(),
    [token]
  )
  return { health: data, loading, error, refetch }
}

/**
 * Hook for fetching platform activity logs (Admin)
 */
export function useAdminActivity(token?: string) {
  const client = useApiClient(token)
  const { data, loading, error, refetch } = useApiRequest(
    () => client.getAdminActivity(),
    [token]
  )
  return { activities: data, loading, error, refetch }
}

/**
 * Hook for fetching zone economic insights (Admin)
 */
export function useZoneEconomicInsights(timeframe: string, token?: string) {
  const client = useMemo(() => createApiClient(token), [token])
  const { data, loading, error, refetch } = useApiRequest(
    () => client.getZoneEconomicInsights(timeframe),
    [timeframe, token]
  )
  return { insights: data, loading, error, refetch }
}

/**
 * Hook for tracking aggregate market statistics
 */
export function useMarketStats(token?: string) {
  const [stats, setStats] = useState<import('../types/trading').MarketStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const client = useMemo(() => createApiClient(token), [token])

  const fetchStats = useCallback(async () => {
    try {
      const response = await client.getMarketStats()
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setStats(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market stats')
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [fetchStats])

  return { stats, loading, error, refresh: fetchStats }
}

/**
 * Hook for fetching all users (Admin)
 */
export function useAdminUsers(token?: string, filters?: any) {
  const client = useApiClient(token)
  const { data, loading, error, refetch } = useApiRequest(
}

/**
 * Hook for performing administrative user actions
 */
export function useAdminActions(token?: string) {
  const client = useApiClient(token)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateRole = async (userId: string, role: string) => {
    setLoading(true)
    setError(null)
    const res = await client.updateUserRole(userId, role)
    setLoading(false)
    if (res.error) setError(res.error)
    return res.data
  }

  const deactivateUser = async (userId: string) => {
    setLoading(true)
    setError(null)
    const res = await client.deactivateUser(userId)
    setLoading(false)
    if (res.error) setError(res.error)
    return res.data
  }

  const reactivateUser = async (userId: string) => {
    setLoading(true)
    setError(null)
    const res = await client.reactivateUser(userId)
    setLoading(false)
    if (res.error) setError(res.error)
    return res.data
  }

  return { updateRole, deactivateUser, reactivateUser, loading, error }
}

/**
 * Hook for P2P Config management (Admin)
 */
export function useP2PConfig() {
  const client = useApiClient()
  const [configs, setConfigs] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchConfigs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [configResponse, auditResponse] = await Promise.all([
        client.getP2PConfigs(),
        client.getP2PConfigAudit()
      ])

      if (configResponse.error) {
        setError(configResponse.error)
      } else {
        setConfigs(configResponse.data?.configs || [])
      }

      if (auditResponse.data?.history) {
        setAuditLogs(auditResponse.data.history)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch configs')
    } finally {
      setLoading(false)
    }
  }, [client])

  const updateConfig = useCallback(async (key: string, value: number, reason?: string) => {
    setUpdating(key)
    try {
      const response = await client.updateP2PConfig(key, value, reason)
      if (response.error) {
        setError(response.error)
        return false
      }
      await fetchConfigs()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config')
      return false
    } finally {
      setUpdating(null)
    }
  }, [client, fetchConfigs])

  const refresh = useCallback(() => {
    fetchConfigs()
  }, [fetchConfigs])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  return {
    configs,
    auditLogs,
    loading,
    error,
    updateConfig,
    updating,
    refresh
  }
}
