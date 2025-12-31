'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { API_ENDPOINTS, API_CONFIG } from '@/lib/config'

export interface GridStatus {
    total_generation: number
    total_consumption: number
    net_balance: number
    active_meters: number
    co2_saved_kg: number
    timestamp: string
}

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
    const [status, setStatus] = useState<GridStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const wsRef = useRef<WebSocket | null>(null)

    const fetchStatus = useCallback(async () => {
        try {
            try {
                const response = await fetch(API_ENDPOINTS.grid.status)
                if (response.ok) {
                    const statusData = await response.json() as GridStatus
                    setStatus(statusData)
                    setError(null)
                } else {
                    throw new Error(`API Gateway returned ${response.status}: ${response.statusText}`)
                }
            } catch (err) {
                console.error('API Gateway failed:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch grid status')
            }
        } catch (err) {
            console.error('Error fetching grid status:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch grid status')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // WebSocket connection logic
    useEffect(() => {
        const wsUrl = `${API_CONFIG.wsBaseUrl}/ws`

        const connectWs = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) return

            console.log('🔌 Connecting to Grid Status WebSocket:', wsUrl)
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.type === 'grid_status_updated') {
                        console.log('⚡ Real-time Grid Update Received:', data)
                        setStatus({
                            total_generation: data.total_generation,
                            total_consumption: data.total_consumption,
                            net_balance: data.net_balance,
                            active_meters: data.active_meters,
                            co2_saved_kg: data.co2_saved_kg,
                            timestamp: data.timestamp
                        })
                    }
                } catch (e) {
                    console.error('Failed to parse WS message:', e)
                }
            }

            ws.onclose = () => {
                console.log('❌ WebSocket connection closed. Reconnecting in 5s...')
                setTimeout(connectWs, 5000)
            }

            ws.onerror = () => {
                // Error handler - close event will trigger reconnection
                // Note: Browser WebSocket errors don't provide details
                ws.close()
            }
        }

        connectWs()

        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [])

    // Polling fallback (much slower when WS is active)
    useEffect(() => {
        fetchStatus()

        if (refreshIntervalMs > 0) {
            const interval = setInterval(fetchStatus, refreshIntervalMs)
            return () => clearInterval(interval)
        }
    }, [fetchStatus, refreshIntervalMs])

    return {
        status,
        isLoading,
        error,
        refresh: fetchStatus
    }
}
