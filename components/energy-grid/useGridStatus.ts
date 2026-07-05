'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'
import { defaultWSManager, WebSocketEventHandler } from '@/lib/websocket-client'
import { GridStatus, ZoneGridStatus } from '@/types/grid'

// Interfaces moved to types/grid.ts

export interface UseGridStatusResult {
    status: GridStatus | null
    isLoading: boolean
    error: string | null
    refresh: () => Promise<void>
}

/**
 * Hook to fetch real-time aggregate grid status from the PUBLIC API.
 * Supports both polling and persistent WebSocket updates.
 */
export function useGridStatus(refreshIntervalMs = 30000): UseGridStatusResult {
    const queryClient = useQueryClient()

    const { data: status = null, isLoading, error, refetch } = useQuery({
        queryKey: ['grid-status'],
        queryFn: async () => {
            const response = await defaultApiClient.getGridStatus()
            if (response.error) throw new Error(response.error)
            return response.data || null
        },
        refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    })

    // WebSocket updates over the shared public market socket
    // (lib/websocket-client.ts — refcounted, backoff reconnect, clean teardown).
    useEffect(() => {
        const client = defaultWSManager.getOrCreatePublic()

        const handler: WebSocketEventHandler = (message) => {
            // The simulator's 'grid_status' wraps the fields in message.data;
            // 'grid_status_updated' carries them at the message root.
            const parsed = message as unknown as Record<string, any>
            const data = message.type === 'grid_status' && message.data ? (message.data as Record<string, any>) : parsed

            const updatedStatus: GridStatus = {
                total_generation: data.total_generation,
                total_consumption: data.total_consumption,
                net_balance: data.net_balance,
                active_meters: data.active_meters,
                co2_saved_kg: data.co2_saved_kg,
                timestamp: data.timestamp || parsed.timestamp,
                zones: data.zones,
                frequency: typeof data.frequency === 'object' && data.frequency !== null ? data.frequency.value : data.frequency,
                island_status: data.island_status,
                health_score: data.health_score,
                is_under_attack: data.is_under_attack,
                tariff: data.tariff,
                adr_event: data.adr_event,
                load_forecast: data.load_forecast,
                ev_fleet: data.ev_fleet,
                avg_nodal_price: data.avg_nodal_price,
                carbon_intensity: data.carbon_intensity,
                peak_capacity_kw: data.peak_capacity_kw
            }
            // Update cache immediately on WS message
            queryClient.setQueryData(['grid-status'], updatedStatus)
        }

        client.on('grid_status_updated', handler)
        client.on('grid_status', handler)
        client.connect()

        return () => {
            client.off('grid_status_updated', handler)
            client.off('grid_status', handler)
            defaultWSManager.disconnectPublic()
        }
    }, [queryClient])

    return {
        status,
        isLoading,
        error: error ? (error as Error).message : null,
        refresh: async () => { await refetch() }
    }
}
