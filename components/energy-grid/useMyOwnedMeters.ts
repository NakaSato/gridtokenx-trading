'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'

export interface UseMyOwnedMetersResult {
    /**
     * Ids the viewer's own meters can be matched by, across BOTH id spaces a map
     * node may carry: the backend uuid `id` and the `serial_number` (a node's id
     * is meter_id when present; the serial merge in useMeterMapData adds
     * node.serial for authenticated viewers). Match a node if either is present.
     */
    ownedIds: Set<string>
    /**
     * Whether the owner filter can be applied. False when logged out, still
     * loading, or the request failed — callers must NOT filter in that case
     * (an unknown answer must not read as "you own nothing").
     */
    isFilterable: boolean
    isLoading: boolean
    error: string | null
}

/**
 * The set of meters the authenticated viewer OWNS (GET /api/v1/me/meters),
 * expressed as an id set for filtering map nodes. Shares the ['my-meters']
 * query cache with useMyMeterTotals, so enabling the map's owner filter adds no
 * extra request.
 */
export function useMyOwnedMeters(refreshIntervalMs = 30000): UseMyOwnedMetersResult {
    const { isAuthenticated } = useAuth()

    const { data: myMeters = [], isLoading, error, isSuccess } = useQuery({
        queryKey: ['my-meters'],
        queryFn: async () => {
            const response = await defaultApiClient.getMyMeters()
            if (response.error) throw new Error(response.error)
            return response.data || []
        },
        enabled: isAuthenticated,
        refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    })

    const ownedIds = useMemo(() => {
        const ids = new Set<string>()
        for (const m of myMeters) {
            if (m.id) ids.add(m.id)
            if (m.serial_number) ids.add(m.serial_number)
        }
        return ids
    }, [myMeters])

    return {
        ownedIds,
        // Only filter once we actually have the owned list. Logged out / loading
        // / errored → not filterable (show the public fleet, don't blank the map).
        isFilterable: isAuthenticated && isSuccess,
        isLoading,
        error: error ? (error as Error).message : null,
    }
}
