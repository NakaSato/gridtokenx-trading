'use client'

import { useState, useEffect, useCallback } from 'react'
import { defaultApiClient, createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { useOrderMatchedWebSocket } from '@/hooks/useWebSocket'
import {
    useP2POrderUpdates,
    useSettlementUpdates,
} from '@/hooks/useTransactionUpdates'

// Matching engine status from API
export interface MatchingStatus {
    can_match: boolean
    match_reason?: string
    pending_buy_orders: number
    pending_sell_orders: number
    pending_matches: number
    buy_price_range?: { min: number; max: number }
    sell_price_range?: { min: number; max: number }
}

// Settlement statistics from API
export interface SettlementStats {
    confirmed_count: number
    pending_count: number
    failed_count: number
    total_settled_value: number
}

// User P2P stats from API
export interface UserP2PStats {
    active_orders: number
    total_traded_24h: number
    total_volume_24h: number
    success_rate: number
}

export interface RecentMatch {
    id: string
    energy: number
    price: number
    timestamp: Date
}

/**
 * Shared data layer for P2P activity views (portfolio P2PStatus card stack,
 * trading-panel P2PActivityPanel). Polls matching/settlement/user-order stats
 * every 10s and refreshes on WebSocket order/settlement/match events.
 */
export function useP2PActivity() {
    const { token } = useAuth()
    const [matchingStatus, setMatchingStatus] = useState<MatchingStatus | null>(null)
    const [settlementStats, setSettlementStats] = useState<SettlementStats | null>(null)
    const [userStats, setUserStats] = useState<UserP2PStats | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])

    // Real-time P2P order updates
    const { latestUpdate: latestOrderUpdate } = useP2POrderUpdates({
        showToasts: false, // Handle in parent component
    })

    // Real-time settlement updates
    const { latestSettlement } = useSettlementUpdates({
        showToasts: false,
    })

    const fetchData = useCallback(async () => {
        if (!token) return

        try {
            defaultApiClient.setToken(token)
            const apiClient = createApiClient(token)
            const [matchRes, settleRes, userRes] = await Promise.all([
                defaultApiClient.getMatchingStatus(),
                defaultApiClient.getSettlementStats(),
                apiClient.getMyP2POrders().catch(() => ({ data: null })), // Fallback if endpoint doesn't exist
            ])

            if (matchRes.data) setMatchingStatus(matchRes.data)
            if (settleRes.data) setSettlementStats(settleRes.data)

            // Calculate user stats from orders if available
            if (userRes.data) {
                const raw = userRes.data as any
                const orders: any[] = Array.isArray(raw) ? raw : raw?.orders || []
                const activeOrders = orders.filter((o: any) => o.status === 'open').length
                setUserStats({
                    active_orders: activeOrders,
                    total_traded_24h: 0, // Would need dedicated endpoint
                    total_volume_24h: 0,
                    success_rate: 0,
                })
            }

            setLastUpdated(new Date())
        } catch (error) {
            console.error('Failed to fetch P2P status:', error)
        }
    }, [token])

    // Initial fetch
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Poll every 10 seconds (increased from 5s since we have WebSocket)
    useEffect(() => {
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [fetchData])

    // Refresh on WebSocket updates
    useEffect(() => {
        if (latestOrderUpdate || latestSettlement) {
            fetchData()
        }
    }, [latestOrderUpdate, latestSettlement, fetchData])

    // Listen for WebSocket match events — accumulate for live feed
    useOrderMatchedWebSocket(useCallback((data: any) => {
        fetchData()
        // Add to recent matches feed
        const match: RecentMatch = {
            id: data?.match_id || `match-${Date.now()}`,
            energy: parseFloat(data?.energy_amount || data?.amount || '0'),
            price: parseFloat(data?.price_per_kwh || data?.price || '0'),
            timestamp: new Date(),
        }
        if (match.energy > 0) {
            setRecentMatches(prev => [match, ...prev].slice(0, 5)) // Keep last 5
        }
    }, [fetchData]), token || undefined)

    return {
        matchingStatus,
        settlementStats,
        userStats,
        recentMatches,
        lastUpdated,
        refresh: fetchData,
    }
}
