'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'
import { useAuth } from '@/features/auth/provider'
import type { EnergyNode } from '@/types/grid'
import type { MeterTelemetry } from '@/features/energy-grid/hooks/useMeterTelemetry'
import { liveValueFor } from '@/features/energy-grid/hooks/utils'

export interface MyMeterTotals {
    totalGeneration: number
    totalConsumption: number
    netBalance: number
    /** Owned meters actually matched to a map node. */
    meterCount: number
}

export interface UseMyMeterTotalsProps {
    /** Full (unfiltered) meter node list — totals must not shrink when map filters hide markers. */
    nodes: EnergyNode[]
    /** Live WS telemetry keyed by node id; overrides poll values when present. */
    telemetry?: Record<string, MeterTelemetry>
    refreshIntervalMs?: number
}

/**
 * Generation/consumption/net-balance summed over the METERS THE VIEWER OWNS
 * (GET /api/v1/me/meters), not the whole grid. Owned meters are matched to map
 * nodes by both id spaces a node can carry — backend meter id and serial number
 * (see useMeterMapData: node.id is meter_id when present, serial merge adds
 * node.serial for authenticated viewers).
 *
 * Returns `totals: null` when the viewer is logged out, owns no meters, or none
 * of their meters matched a map node — callers fall back to grid-wide numbers.
 */
export function useMyMeterTotals({ nodes, telemetry, refreshIntervalMs = 30000 }: UseMyMeterTotalsProps): {
    totals: MyMeterTotals | null
    isLoading: boolean
    error: string | null
} {
    const { isAuthenticated } = useAuth()

    const { data: myMeters = [], isLoading, error } = useQuery({
        queryKey: ['my-meters'],
        queryFn: async () => {
            const response = await defaultApiClient.getMyMeters()
            if (response.error) throw new Error(response.error)
            return response.data || []
        },
        enabled: isAuthenticated,
        refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    })

    // Owned identity set across BOTH id spaces (uuid id + serial number).
    const ownedIds = useMemo(() => {
        const ids = new Set<string>()
        for (const m of myMeters) {
            if (m.id) ids.add(m.id)
            if (m.serial_number) ids.add(m.serial_number)
        }
        return ids
    }, [myMeters])

    const totals = useMemo<MyMeterTotals | null>(() => {
        if (!isAuthenticated || ownedIds.size === 0) return null
        const owned = nodes.filter(
            (n) => ownedIds.has(n.id) || (n.serial != null && ownedIds.has(n.serial))
        )
        if (owned.length === 0) return null

        let totalGeneration = 0
        let totalConsumption = 0
        owned.forEach((n) => {
            const value = liveValueFor(n, telemetry?.[n.id])
            if (n.type === 'generator') totalGeneration += value
            else if (n.type === 'consumer') totalConsumption += value
        })
        return {
            totalGeneration,
            totalConsumption,
            netBalance: totalGeneration - totalConsumption,
            meterCount: owned.length,
        }
    }, [isAuthenticated, ownedIds, nodes, telemetry])

    return {
        totals,
        isLoading,
        error: error ? (error as Error).message : null,
    }
}
