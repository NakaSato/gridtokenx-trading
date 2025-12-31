'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PublicMeterResponse } from '@/types/meter'
import type { EnergyNode } from './types'

export interface UseMeterMapDataOptions {
    /** Whether to include static config nodes alongside real meters */
    includeStaticNodes?: boolean
    /** Static nodes to include if includeStaticNodes is true */
    staticNodes?: EnergyNode[]
    /** Refresh interval in milliseconds (0 to disable auto-refresh) */
    refreshIntervalMs?: number
}

export interface UseMeterMapDataResult {
    /** Combined list of energy nodes (real meters + optional static nodes) */
    nodes: EnergyNode[]
    /** Just the real meters converted to EnergyNode format */
    realMeterNodes: EnergyNode[]
    /** Raw meter responses from API */
    meters: PublicMeterResponse[]
    /** Loading state */
    isLoading: boolean
    /** Error message if any */
    error: string | null
    /** Manually refresh meter data */
    refresh: () => Promise<void>
}

/**
 * Generate a unique ID from meter data since public API no longer exposes id/serial_number.
 * Uses location + coordinates to create a deterministic unique identifier.
 */
function generateMeterId(meter: PublicMeterResponse, index: number): string {
    // Create a unique ID from location and coordinates
    const locationKey = meter.location.replace(/\s+/g, '_').toLowerCase()
    const latKey = meter.latitude?.toFixed(4) || '0'
    const lngKey = meter.longitude?.toFixed(4) || '0'
    return `meter-${locationKey}-${latKey}-${lngKey}-${index}`
}

/**
 * Convert a PublicMeterResponse to an EnergyNode for map display.
 * Uses default UTCC campus coordinates if meter has no location data.
 */
function meterToEnergyNode(meter: PublicMeterResponse, index: number): EnergyNode {
    // UTCC Campus default coordinates (Bangkok, Thailand)
    const DEFAULT_LAT = 13.7856
    const DEFAULT_LNG = 100.5661

    // Use meter coordinates if available, otherwise use UTCC campus default
    const lat = (meter.latitude !== undefined && meter.latitude !== null)
        ? meter.latitude
        : DEFAULT_LAT
    const lng = (meter.longitude !== undefined && meter.longitude !== null)
        ? meter.longitude
        : DEFAULT_LNG

    // Determine node type based on meter_type
    let nodeType: 'generator' | 'consumer' | 'storage' = 'consumer'
    const meterTypeLower = (meter.meter_type || '').toLowerCase()
    if (meterTypeLower.includes('solar') || meterTypeLower.includes('generator') || meterTypeLower.includes('producer') || meterTypeLower.includes('prosumer')) {
        nodeType = 'generator'
    } else if (meterTypeLower.includes('battery') || meterTypeLower.includes('storage')) {
        nodeType = 'storage'
    }

    return {
        id: generateMeterId(meter, index),
        name: meter.location || 'Unknown Meter',
        buildingCode: meter.location.slice(0, 10).toUpperCase().replace(/\s+/g, '-'),
        type: nodeType,
        longitude: lng,
        latitude: lat,
        capacity: '100 kWh', // Default capacity for real meters
        status: meter.is_verified ? 'active' : 'idle',
        // Telemetry from real meters
        voltage: meter.voltage,
        currentAmps: meter.current,
        frequency: meter.frequency,
        powerFactor: meter.power_factor,
        surplusEnergy: meter.surplus_energy,
        deficitEnergy: meter.deficit_energy,
        // Add type-specific defaults or real data if available
        ...(nodeType === 'generator' && {
            currentOutput: `${(meter.current_generation ?? 0).toFixed(2)} kW`,
            solarPanels: 4, // Assume some panels if it's a generator
            efficiency: meter.power_factor ? `${(meter.power_factor * 100).toFixed(0)}%` : '94%',
        }),
        ...(nodeType === 'consumer' && {
            currentLoad: `${(meter.current_consumption ?? 0).toFixed(2)} kW`,
        }),
        ...(nodeType === 'storage' && {
            currentCharge: '50 kWh', // Still placeholder for storage
            batteryType: 'Li-ion',
        }),
    }
}

/**
 * Hook to fetch real meter data from the PUBLIC API and convert it to map-compatible EnergyNode format.
 * Uses public endpoint - no authentication required.
 */
export function useMeterMapData(options: UseMeterMapDataOptions = {}): UseMeterMapDataResult {
    const {
        includeStaticNodes = true,
        staticNodes = [],
        refreshIntervalMs = 60000, // Optimized: refresh every 60 seconds (was 30s)
    } = options

    const [meters, setMeters] = useState<PublicMeterResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchMeters = useCallback(async () => {
        try {
            setError(null)
            const apiGatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            let metersData: PublicMeterResponse[] = []

            try {
                const apiResponse = await fetch(`${apiGatewayUrl}/api/v1/public/meters`)
                if (apiResponse.ok) {
                    metersData = await apiResponse.json() as PublicMeterResponse[]
                } else {
                    throw new Error(`API Gateway returned ${apiResponse.status}: ${apiResponse.statusText}`)
                }
            } catch (err) {
                console.error('API Gateway failed:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch meters')
            }

            console.log(`Loaded ${metersData.length} meters for map`)
            setMeters(metersData)
        } catch (err) {
            console.error('Error fetching meters for map:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch meters')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Initial fetch
    useEffect(() => {
        fetchMeters()
    }, [fetchMeters])

    // Auto-refresh
    useEffect(() => {
        if (refreshIntervalMs <= 0) return

        const interval = setInterval(fetchMeters, refreshIntervalMs)
        return () => clearInterval(interval)
    }, [fetchMeters, refreshIntervalMs])

    // Convert meters to EnergyNodes with generated unique IDs
    const realMeterNodes: EnergyNode[] = meters.map((meter, index) => meterToEnergyNode(meter, index))

    // Combine with static nodes if requested
    const nodes: EnergyNode[] = includeStaticNodes
        ? [...staticNodes, ...realMeterNodes]
        : realMeterNodes

    return {
        nodes,
        realMeterNodes,
        meters,
        isLoading,
        error,
        refresh: fetchMeters,
    }
}
