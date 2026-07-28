'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'
import type { EnergyTransfer } from '@/types/grid'

interface UseGridFlowsResult {
    transfers: EnergyTransfer[]
    isLoading: boolean
    error: string | null
    refresh: () => Promise<void>
}

/**
 * Real instantaneous grid flows from GET /api/v1/public/grid-flows.
 * Replaces the former synthetic surplus/deficit → fake-transformer routing.
 * Returns [] (empty map flows) until the backend endpoint ships.
 */
export function useGridFlows(refreshIntervalMs = 30000): UseGridFlowsResult {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['grid-flows'],
        queryFn: async () => {
            const res = await defaultApiClient.getGridFlows()
            if (res.error) throw new Error(res.error)
            return res.data?.flows ?? []
        },
        refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    })

    const transfers = useMemo<EnergyTransfer[]>(
        () =>
            (data ?? []).map((f) => ({
                from: f.from,
                to: f.to,
                power: f.power_kw,
                description: f.description,
            })),
        [data]
    )

    return {
        transfers,
        isLoading,
        error: error ? (error as Error).message : null,
        refresh: async () => { await refetch() },
    }
}
