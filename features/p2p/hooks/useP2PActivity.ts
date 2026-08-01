'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/provider'
import { useApiClient } from '@/lib/api/useApiClient'
import { useProfile } from '@/features/portfolio/hooks/usePortfolio'
import { queryKeys } from '@/lib/query/keys'
import { useOrderMatchedWebSocket } from '@/lib/ws/useWebSocket'
import {
    useP2POrderUpdates,
    useSettlementUpdates,
} from '@/features/trading/hooks/useTransactionUpdates'

/** Fallback cadence. The socket drives the common case. */
const POLL_MS = 10_000

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
 *
 * The WS handlers invalidate the cache rather than calling a fetcher directly.
 * The previous version did both — an effect on the latest-update object plus a
 * direct `fetchData()` inside the match handler — so a single match fired two
 * identical requests.
 */
export function useP2PActivity() {
    const { token } = useAuth()
    const client = useApiClient(token ?? undefined)
    const queryClient = useQueryClient()
    const { data: profile } = useProfile()
    const enabled = !!token

    // Memoized because `refresh` closes over them and the WS hooks re-subscribe
    // whenever their handler's identity changes — a fresh key array every render
    // would redial the socket listeners on every render.
    const matchingKey = useMemo(() => queryKeys.p2p.matchingStatus(), [])
    const settlementKey = useMemo(() => queryKeys.p2p.settlementStats(), [])
    const ordersKey = useMemo(
        () => queryKeys.p2p.activity(profile?.id),
        [profile?.id]
    )

    const [matching, settlement, orders] = useQueries({
        queries: [
            {
                queryKey: matchingKey,
                queryFn: async () => {
                    const res = await client.getMatchingStatus()
                    if (res.error) throw new Error(res.error)
                    return (res.data as MatchingStatus) ?? null
                },
                enabled,
                refetchInterval: POLL_MS,
            },
            {
                queryKey: settlementKey,
                queryFn: async () => {
                    const res = await client.getSettlementStats()
                    if (res.error) throw new Error(res.error)
                    return (res.data as SettlementStats) ?? null
                },
                enabled,
                refetchInterval: POLL_MS,
            },
            {
                queryKey: ordersKey,
                // Tolerated, as before: this endpoint may not exist on every
                // deployment, and its absence must not blank the other two cards.
                queryFn: async () => {
                    const res = await client.getMyP2POrders().catch(() => null)
                    const raw = res?.data as unknown
                    return Array.isArray(raw)
                        ? (raw as any[])
                        : ((raw as any)?.orders ?? [])
                },
                enabled,
                refetchInterval: POLL_MS,
            },
        ],
    })

    const matchingStatus = (matching.data as MatchingStatus | null) ?? null
    const settlementStats = (settlement.data as SettlementStats | null) ?? null

    const userStats: UserP2PStats | null = useMemo(() => {
        const list = orders.data as any[] | undefined
        if (!list) return null
        return {
            active_orders: list.filter((o: any) => o.status === 'open').length,
            total_traded_24h: 0, // Would need dedicated endpoint
            total_volume_24h: 0,
            success_rate: 0,
        }
    }, [orders.data])

    const refresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: matchingKey })
        queryClient.invalidateQueries({ queryKey: settlementKey })
        queryClient.invalidateQueries({ queryKey: ordersKey })
    }, [queryClient, matchingKey, settlementKey, ordersKey])

    // Real-time P2P order + settlement updates. Toasts are the parent's job.
    const { latestUpdate: latestOrderUpdate } = useP2POrderUpdates({
        showToasts: false,
        onUpdate: refresh,
    })
    const { latestSettlement } = useSettlementUpdates({
        showToasts: false,
        onSettlement: refresh,
    })

    // Accumulating client-side feed — not server state, so it stays in useState.
    const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])

    useOrderMatchedWebSocket(
        useCallback(
            (data: any) => {
                refresh()
                const energy = parseFloat(data?.energy_amount || data?.amount || '0')
                if (energy <= 0) return
                const match: RecentMatch = {
                    id: data?.match_id || `match-${Date.now()}`,
                    energy,
                    price: parseFloat(data?.price_per_kwh || data?.price || '0'),
                    timestamp: new Date(),
                }
                setRecentMatches((prev) => [match, ...prev].slice(0, 5)) // Keep last 5
            },
            [refresh]
        ),
        token || undefined
    )

    // Freshness of the data actually on screen, straight from the cache — the
    // old manual Date was set on fetch completion and drifted from it.
    const lastUpdated = useMemo(
        () =>
            new Date(
                Math.max(
                    matching.dataUpdatedAt,
                    settlement.dataUpdatedAt,
                    orders.dataUpdatedAt
                )
            ),
        [matching.dataUpdatedAt, settlement.dataUpdatedAt, orders.dataUpdatedAt]
    )

    return {
        matchingStatus,
        settlementStats,
        userStats,
        recentMatches,
        lastUpdated,
        refresh,
        latestOrderUpdate,
        latestSettlement,
    }
}
