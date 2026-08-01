'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/features/auth/provider'
import { format } from 'date-fns'
import type { ApiFuturesPosition, ApiOrder, TradeRecord } from '@/types/trading'
import type { UserProfile, TokenBalance } from '@/types/auth'
import type { Position, Order } from '@/types/trading'
import { mapApiOrderToOrder } from '@/lib/api/adapters'
import { queryKeys } from '@/lib/query/keys'
import { BALANCE_POLL_MS } from '@/features/wallet/lib/balance-poll'
import type { Transaction } from '@/types/wallet'

/**
 * Hook for fetching user profile
 */
export function useProfile() {
  const { token, isAuthenticated } = useAuth()
  const apiClient = createApiClient(token || '')

  return useQuery<UserProfile | null>({
    queryKey: ['user-profile', token],
    queryFn: async () => {
      if (!token) throw new Error('Authentication required')
      const response = await apiClient.getProfile()
      if (response.error) throw new Error(response.error)
      // API returns flat UserResponse (not wrapped in { user: ... })
      return (response.data as UserProfile) || null
    },
    enabled: !!token && isAuthenticated,
  })
}

/**
 * Hook for fetching the user's linked wallets (IAM GET /api/v1/me/wallets).
 */
export function useWallets() {
  const { token, isAuthenticated } = useAuth()
  const apiClient = createApiClient(token || '')

  return useQuery<import('@/types/features').UserWallet[]>({
    queryKey: ['user-wallets', token],
    queryFn: async () => {
      if (!token) throw new Error('Authentication required')
      const response = await apiClient.listWallets()
      if (response.error) throw new Error(response.error)
      return (response.data as import('@/types/features').UserWallet[]) || []
    },
    enabled: !!token && isAuthenticated,
  })
}

/**
 * Hook for fetching wallet balance
 */
export function useWalletBalance(walletAddress?: string) {
  const { token } = useAuth()
  const apiClient = createApiClient(token || '')

  return useQuery<TokenBalance>({
    // Same key as features/wallet/hooks/useUserBalance + useWalletBalance —
    // one cache entry, one poll, whichever of the three mounts.
    queryKey: queryKeys.wallet.balance(walletAddress),
    queryFn: async () => {
      if (!token) throw new Error('Authentication required')
      if (!walletAddress) throw new Error('Wallet address required')
      const response = await apiClient.getBalance(walletAddress)
      if (response.error) throw new Error(response.error)
      // See useWalletBalance: `data` is optional, so a bodyless 200 would
      // resolve the query to `undefined` against a non-optional type.
      if (!response.data) throw new Error('Balance response contained no data')
      return response.data
    },
    enabled: !!token && !!walletAddress,
    refetchInterval: BALANCE_POLL_MS,
  })
}

/** Shape returned by GET /api/v1/markets/price (all prices are decimal strings). */
export interface MarketPrice {
  vwap: string
  last_price: string
  high: string
  low: string
  volume_kwh: string
  trade_count: number
  window_hours: number
  as_of: string
}

/**
 * Hook for the real, trade-derived market price (24h VWAP by default).
 * Backed by /api/v1/markets/price — computed from completed settlements, so it
 * replaces the old hardcoded display rate. `trade_count === 0` means "no price
 * yet" (every price field is "0"); callers should fall back, not render 0.
 */
export function useMarketPrice(windowHours = 24, enabled = true) {
  const { token } = useAuth()
  const apiClient = createApiClient(token || '')

  return useQuery<MarketPrice>({
    queryKey: ['market-price', token, windowHours],
    queryFn: async () => {
      if (!token) throw new Error('Authentication required')
      const response = await apiClient.getMarketPrice(windowHours)
      if (response.error) throw new Error(response.error)
      if (!response.data) throw new Error('No market price returned')
      return response.data
    },
    enabled: !!token && enabled,
    refetchInterval: 15000,
  })
}
