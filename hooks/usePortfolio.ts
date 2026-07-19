'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { format } from 'date-fns'
import type { ApiFuturesPosition, ApiOrder, TradeRecord } from '@/types/trading'
import type { UserProfile, TokenBalance } from '@/types/auth'
import type { Position, Order } from '@/lib/data/Positions'
import { mapApiOrderToOrder } from '@/lib/data/Positions'
import type { Transaction } from '@/lib/data/WalletActivity'

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
        queryKey: ['wallet-balance', token, walletAddress],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            if (!walletAddress) throw new Error('Wallet address required')
            const response = await apiClient.getBalance(walletAddress)
            if (response.error) throw new Error(response.error)
            return response.data
        },
        enabled: !!token && !!walletAddress,
        refetchInterval: 10000,
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

/**
 * Hook for fetching portfolio positions with mapping
 */
export function usePortfolioPositions() {
    const { token } = useAuth()
    const apiClient = createApiClient(token || '')

    const query = useQuery<Position[]>({
        queryKey: ['portfolio-positions', token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            const response = await apiClient.getFuturesPositions()
            const rawData = ((response.data as { data?: unknown[] })?.data || response.data || []) as ApiFuturesPosition[]

            return rawData.map((pos) => ({
                index: pos.id,
                token: pos.product_symbol || 'Unknown',
                logo: '/images/solana.png',
                symbol: pos.product_symbol || 'GRX',
                type: pos.side === 'long' ? 'Call' : 'Put',
                strikePrice: parseFloat(pos.entry_price),
                expiry: 'Perpetual',
                size: parseFloat(pos.quantity),
                pnl: parseFloat(pos.unrealized_pnl || '0'),
                greeks: { delta: 0, gamma: 0, theta: 0, vega: 0 },
            }))
        },
        enabled: !!token,
    })

    const queryClient = useQueryClient()
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const refreshEvents = ['TradeExecuted', 'OrderMatched', 'PositionClosed', 'PositionUpdated']

            if (refreshEvents.includes(message.type)) {
                queryClient.invalidateQueries({ queryKey: ['portfolio-positions'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    return query
}

/**
 * Hook for fetching portfolio orders with mapping
 */
export function usePortfolioOrders() {
    const { token } = useAuth()
    const apiClient = createApiClient(token || '')

    const query = useQuery<Order[]>({
        queryKey: ['portfolio-orders', token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            // No status filter — a freshly placed order starts 'pending' and only
            // becomes 'active' once the matcher processes it, so status=active hid
            // every order until that async promotion happened. Keep open statuses
            // client-side instead (mirrors TradingPositions.tsx fetchData).
            const OPEN_STATUSES = new Set(['pending', 'active', 'partially_filled'])
            // Match the envelope seen in legacy code
            const response = await apiClient.getOrders({})
            const data = ((response.data as { data?: ApiOrder[] })?.data || response.data || []) as ApiOrder[]

            return data.filter((o) => OPEN_STATUSES.has(o.status)).map(mapApiOrderToOrder)
        },
        enabled: !!token,
    })

    const queryClient = useQueryClient()
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const refreshEvents = ['OrderCreated', 'OrderCancelled', 'OrderMatched', 'OrderUpdated']

            if (refreshEvents.includes(message.type)) {
                queryClient.invalidateQueries({ queryKey: ['portfolio-orders'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    return query
}

/**
 * Hook for fetching portfolio trade history with mapping
 */
export function usePortfolioTradeHistory(limit = 50) {
    const { token } = useAuth()
    const apiClient = createApiClient(token || '')

    const query = useQuery<Transaction[]>({
        queryKey: ['portfolio-trade-history', token, limit],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            const response = await apiClient.getTrades({ limit })
            const rawData = ((response.data as { trades?: unknown[] })?.trades || response.data || []) as TradeRecord[]

            return rawData.map((trade) => ({
                transactionID: trade.id,
                token: {
                    name: 'GridToken',
                    symbol: 'GRX',
                    logo: '/images/grid.png',
                },
                transactionType: trade.role === 'buyer' ? 'Buy' : 'Sell',
                optionType: 'Spot',
                strikePrice: parseFloat(trade.price),
                expiry: format(new Date(trade.executed_at), 'dd MMM, yyy HH:mm:ss'),
                quantity: parseFloat(trade.quantity),
                totalValue: parseFloat(trade.total_value),
                wheelingCharge: trade.wheeling_charge ? parseFloat(trade.wheeling_charge) : undefined,
                lossCost: trade.loss_cost ? parseFloat(trade.loss_cost) : undefined,
                effectiveEnergy: trade.effective_energy ? parseFloat(trade.effective_energy) : undefined,
                buyerZoneId: trade.buyer_zone_id,
                sellerZoneId: trade.seller_zone_id,
            })) as Transaction[]
        },
        enabled: !!token,
    })

    const queryClient = useQueryClient()
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const refreshEvents = ['TradeExecuted', 'OrderMatched']

            if (refreshEvents.includes(message.type)) {
                queryClient.invalidateQueries({ queryKey: ['portfolio-trade-history'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    return query
}

// Re-export Option hooks for convenience
export { useExpiredOptions, useOptionSettlement } from './useOptions'
