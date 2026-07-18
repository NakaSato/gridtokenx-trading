'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'
import type { ActiveOrderMeter } from '@/types/trading'

export interface UseActiveOrderMetersResult {
    /**
     * Meters with at least one resting order, keyed by `meter_serial` — the id
     * space map nodes use. Keying on `meter_id` would never match a node.
     */
    bySerial: Map<string, ActiveOrderMeter>
    /**
     * False when the filter cannot be applied — still loading or the request
     * failed. Callers must show ALL meters in that case rather than an empty map:
     * an unknown answer is not "nothing is trading". The data source is public,
     * so being logged out no longer disables the filter.
     */
    isFilterable: boolean
    isLoading: boolean
    error: string | null
}

/**
 * Meters that currently have resting buy/sell orders (GET
 * /public/active-order-meters). Public/unauthenticated, so the map filters for
 * every visitor — logged in or not. `isFilterable` is false only while loading
 * or on error, where the map falls back to showing every meter.
 */
export function useActiveOrderMeters(refreshIntervalMs = 30000): UseActiveOrderMetersResult {
    const { data, isLoading, error } = useQuery({
        queryKey: ['public-active-order-meters'],
        queryFn: async () => {
            const response = await defaultApiClient.getPublicActiveOrderMeters()
            if (response.error) throw new Error(response.error)
            return response.data?.data ?? []
        },
        refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    })

    const bySerial = useMemo(
        () => new Map((data ?? []).map((m) => [m.meter_serial, m])),
        [data]
    )

    return {
        bySerial,
        isFilterable: !isLoading && !error && data !== undefined,
        isLoading,
        error: error ? (error as Error).message : null,
    }
}
