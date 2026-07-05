'use client'

import { useEffect, useState } from 'react'
import { defaultWSManager, WebSocketEventHandler } from '@/lib/websocket-client'

/** Live per-meter telemetry pushed over WS (keyed by the node/meter id the map uses). */
export interface MeterTelemetry {
    generation_kw?: number
    consumption_kw?: number
    surplus_kw?: number
    deficit_kw?: number
    status?: 'active' | 'idle' | 'maintenance'
}

interface RawTelemetryEntry extends MeterTelemetry {
    /** Id matching the map node id (or raw meter id the backend agrees to send). */
    id?: string
    meter_id?: string
    node_id?: string
}

/**
 * Subscribes to `meter.telemetry` messages on the shared public market WS
 * (lib/websocket-client.ts — refcounted socket, backoff reconnect, clean
 * teardown) and returns the latest telemetry per meter id. Replaces
 * client-side value simulation: live values stream from the backend.
 * Returns {} until the backend emits the message type — callers fall back
 * to the REST poll values (see useLiveMeterData).
 *
 * NOTE: keys MUST match the map node ids (backend meter_id — see
 * useMeterMapData#generateMeterId) — see docs/MAP_REAL_DATA_API.md §4.
 */
export function useMeterTelemetry(): Record<string, MeterTelemetry> {
    const [telemetry, setTelemetry] = useState<Record<string, MeterTelemetry>>({})

    useEffect(() => {
        const client = defaultWSManager.getOrCreatePublic()

        const handler: WebSocketEventHandler = (message) => {
            const entries = Array.isArray(message.data)
                ? (message.data as RawTelemetryEntry[])
                : []
            if (entries.length === 0) return
            setTelemetry((prev) => {
                const next = { ...prev }
                entries.forEach((e) => {
                    const key = e.id ?? e.meter_id ?? e.node_id
                    if (!key) return
                    next[key] = {
                        generation_kw: e.generation_kw,
                        consumption_kw: e.consumption_kw,
                        surplus_kw: e.surplus_kw,
                        deficit_kw: e.deficit_kw,
                        status: e.status,
                    }
                })
                return next
            })
        }

        client.on('meter.telemetry', handler)
        client.on('meter_telemetry', handler)
        client.connect()

        return () => {
            client.off('meter.telemetry', handler)
            client.off('meter_telemetry', handler)
            defaultWSManager.disconnectPublic()
        }
    }, [])

    return telemetry
}
