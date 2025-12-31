'use client'

import { useState, useEffect, useCallback } from 'react'
import type { EnergyNode, EnergyTransfer } from './types'
import { API_ENDPOINTS, API_CONFIG } from '@/lib/config'

interface ZoneData {
    zone_id: number
    centroid_lat: number
    centroid_lon: number
    meter_count: number
    transformer_name: string
}

interface MeterLink {
    meter_id: string
    zone_id: number | null
}

interface GridTopologyResponse {
    zones: Record<string, ZoneData>
    meters: MeterLink[]
}

interface UseGridTopologyResult {
    transformers: EnergyNode[]
    transfers: EnergyTransfer[]
    isLoading: boolean
    error: string | null
    refresh: () => Promise<void>
}

export function useGridTopology(): UseGridTopologyResult {
    const [transformers, setTransformers] = useState<EnergyNode[]>([])
    const [transfers, setTransfers] = useState<EnergyTransfer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTopology = useCallback(async () => {
        try {
            setIsLoading(true)

            // Try fetching from the main topology endpoint first
            const response = await fetch(API_ENDPOINTS.grid.topology)

            if (!response.ok) {
                // Warning: Fallback to thailand data if main endpoint fails
                // Ideally this should be handled by the backend or a specific fallback config
                const demoResponse = await fetch(`${API_CONFIG.baseUrl}/api/thailand/data`)
                if (!demoResponse.ok) {
                    throw new Error(`Failed to fetch grid topology: ${response.status}`)
                }
                const demoData = await demoResponse.json()
                processTopologyData(demoData)
                return
            }

            const data = await response.json()
            processTopologyData(data)
        } catch (err) {
            console.error('Error fetching grid topology:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch topology')
        } finally {
            setIsLoading(false)
        }
    }, [])

    const processTopologyData = (data: GridTopologyResponse) => {
        const newTransformers: EnergyNode[] = []
        const newTransfers: EnergyTransfer[] = []

        // Process Zones (Transformers)
        Object.values(data.zones).forEach((zone) => {
            const transformerId = `transformer-${zone.zone_id}`
            newTransformers.push({
                id: transformerId,
                name: zone.transformer_name || `Transformer Zone ${zone.zone_id}`,
                type: 'transformer',
                latitude: zone.centroid_lat,
                longitude: zone.centroid_lon,
                capacity: '500 kVA', // Placeholder
                status: 'active',
                buildingCode: `TR-${zone.zone_id}`,
            })
        })

        // Process Meters connections
        data.meters.forEach((meter) => {
            if (meter.zone_id === null) return

            const transformerId = `transformer-${meter.zone_id}`

            // Link Meter to Transformer
            // We assume meters are already fetched by useMeterMapData
            // This transfer represents the physical line
            newTransfers.push({
                from: transformerId,
                to: meter.meter_id,
                power: 0, // Will be updated by live simulation data
                description: 'Service Line'
            })
        })

        setTransformers(newTransformers)
        setTransfers(newTransfers)
    }

    useEffect(() => {
        fetchTopology()
    }, [fetchTopology])

    return {
        transformers,
        transfers,
        isLoading,
        error,
        refresh: fetchTopology
    }
}
