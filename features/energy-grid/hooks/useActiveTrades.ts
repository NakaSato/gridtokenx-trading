'use client'

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api/useApiClient'
import { useAuth } from '@/features/auth/provider'
import { useSequencedChannel } from '@/lib/ws/useSequencedChannel'
import type { TradeRecord } from '@/types/trading'

export interface ActiveTrade extends TradeRecord {
    isActive: boolean
}

interface UseActiveTradesResult {
    trades: ActiveTrade[]
    isLoading: boolean
    error: string | null
    refresh: () => Promise<void>
}

export function useActiveTrades(): UseActiveTradesResult {
    // /api/v1/trades is JWT-gated. This used to reach for the token-less
    // defaultApiClient and poll every 10s, so a logged-out visitor re-issued a
    // 401 burst (x3, via QueryProvider's retry: 2) for as long as the page
    // stayed open. Take the token from the session and stay idle without one.
    const { token } = useAuth()
    const client = useApiClient(token ?? undefined)

    const queryClient = useQueryClient()
    const tradesKey = useMemo(() => ['active-trades'], [])

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: tradesKey,
        queryFn: async () => {
            const response = await client.getTrades({ limit: 20 })

            if (response.error || !response.data) {
                throw new Error(response.error || 'Failed to fetch trades')
            }

            return response.data
        },
        enabled: !!token,
        staleTime: 10000,
        // Was 10s. Trades now arrive over /ws/trading; this is the fallback for
        // a gateway outage, not the primary path.
        refetchInterval: 60_000,
    })

    // A match is a trade. Market-wide view, so no zone filter — see
    // useSequencedChannel for why a duplicate frame is harmless here (a refetch
    // is idempotent).
    useSequencedChannel({
        messageTypes: ['order_matched'],
        snapshotKey: tradesKey,
        enabled: !!token,
        onFrame: () => {
            void queryClient.invalidateQueries({ queryKey: tradesKey })
        },
    })

    // Process trades - mark active ones
    const trades: ActiveTrade[] = (data?.trades || [])
        .filter(trade =>
            // Only include trades with zone info for visualization
            trade.buyer_zone_id !== undefined &&
            trade.seller_zone_id !== undefined
        )
        .map(trade => ({
            ...trade,
            // Consider trades active if status is executing, matched, or very recent
            isActive: ['executing', 'matched', 'pending_settlement'].includes(trade.status) ||
                (trade.status === 'completed' &&
                    new Date(trade.executed_at).getTime() > Date.now() - 60000) // Last minute
        }))

    return {
        trades,
        isLoading,
        error: error ? (error as Error).message : null,
        refresh: async () => { await refetch() },
    }
}
