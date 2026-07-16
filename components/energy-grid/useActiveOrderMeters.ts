'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import type { ActiveOrderMeter } from '@/types/trading'

export interface UseActiveOrderMetersResult {
    /**
     * Meters with at least one resting order, keyed by `meter_serial` — the id
     * space map nodes use. Keying on `meter_id` would never match a node.
     */
    bySerial: Map<string, ActiveOrderMeter>
    /**
     * False when the filter cannot be applied — no auth token, still loading, or
     * the request failed. Callers must show ALL meters in that case rather than
     * an empty map: an unknown answer is not "nothing is trading".
     */
    isFilterable: boolean
    isLoading: boolean
    error: string | null
}

/**
 * Meters that currently have resting buy/sell orders (GET
 * /markets/active-order-meters). Auth-gated, so logged-out visitors get
 * `isFilterable: false` and the map falls back to showing every meter.
 */
export function useActiveOrderMeters(refreshIntervalMs = 30000): UseActiveOrderMetersResult {
    const { token } = useAuth()

    const { data, isLoading, error } = useQuery({
        queryKey: ['active-order-meters'],
        enabled: !!token,
        queryFn: async () => {
            const response = await createApiClient(token!).getActiveOrderMeters()
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
        isFilterable: !!token && !isLoading && !error && data !== undefined,
        isLoading,
        error: error ? (error as Error).message : null,
    }
}
