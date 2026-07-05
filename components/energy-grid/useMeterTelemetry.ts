'use client'

import { useEffect, useRef, useState } from 'react'
import { API_CONFIG } from '@/lib/config'

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
 * Subscribes to `meter.telemetry` messages on /api/market/ws and returns the
 * latest telemetry per meter id. Replaces client-side value simulation: live
 * values stream from the backend. Returns {} until the backend emits the
 * message type — callers fall back to the REST poll values (see useLiveMeterData).
 *
 * NOTE: keys MUST match the map node ids (see useMeterMapData#generateMeterId)
 * or the backend must send a matching id — see docs/MAP_REAL_DATA_API.md §4.
 */
export function useMeterTelemetry(): Record<string, MeterTelemetry> {
    const [telemetry, setTelemetry] = useState<Record<string, MeterTelemetry>>({})
    const wsRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        const wsUrl = `${API_CONFIG.wsBaseUrl}/api/market/ws`
        let disposed = false
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null

        const connectWs = () => {
            if (disposed) return
            if (wsRef.current?.readyState === WebSocket.OPEN) return
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data)
                    if (parsed.type !== 'meter.telemetry' && parsed.type !== 'meter_telemetry') return
                    const entries: RawTelemetryEntry[] = Array.isArray(parsed.data) ? parsed.data : []
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
                } catch (err) {
                    console.error('Failed to parse meter.telemetry WS message:', err)
                }
            }

            // Unmount cleanup close() also fires onclose — the disposed flag
            // stops it from resurrecting the connection after the hook is gone.
            ws.onclose = () => {
                if (disposed) return
                reconnectTimer = setTimeout(connectWs, 5000)
            }
            ws.onerror = () => { ws.close() }
        }

        connectWs()
        return () => {
            disposed = true
            if (reconnectTimer) clearTimeout(reconnectTimer)
            wsRef.current?.close()
        }
    }, [])

    return telemetry
}
