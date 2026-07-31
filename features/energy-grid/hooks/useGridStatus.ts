'use client'

import { useEffect } from 'react'
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query'
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
 * Hook exposing real-time aggregate grid status, WebSocket-only.
 *
 * The REST poll of GET /api/v1/public/grid-status was removed — the
 * `['grid-status']` key is now a push-only cache written by the effect below,
 * so there is nothing to fetch or refetch. `refreshIntervalMs` is accepted for
 * call-site compatibility and ignored; `refresh` is a no-op and `error` never
 * populates, since a socket that never delivers just leaves `status` null.
 */
export function useGridStatus(_refreshIntervalMs = 30000): UseGridStatusResult {
    const queryClient = useQueryClient()

    // skipToken (not enabled:false) so the missing queryFn is a typed,
    // deliberate "never fetches" rather than a runtime throw if anything
    // invalidates this key.
    const { data: status = null, isLoading, error } = useQuery<GridStatus | null>({
        queryKey: ['grid-status'],
        queryFn: skipToken,
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

            const incoming: Partial<GridStatus> = {
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

            // Merge over the cached value instead of replacing it: a partial
            // push (a message carrying only some fields) must not blank out
            // numbers the REST poll already provided — consumers call
            // .toLocaleString()/.toFixed() on them.
            queryClient.setQueryData(['grid-status'], (prev: GridStatus | null | undefined) => {
                const defined = Object.fromEntries(
                    Object.entries(incoming).filter(([, v]) => v !== undefined)
                ) as Partial<GridStatus>
                return { ...(prev ?? {}), ...defined } as GridStatus
            })
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
        refresh: async () => { }
    }
}
