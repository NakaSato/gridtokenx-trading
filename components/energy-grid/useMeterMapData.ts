'use client'

import { useState, useEffect, useMemo } from 'react'
import type { PublicMeterResponse } from '@/types/meter'
import type { EnergyNode } from './types'
import { useQuery } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'

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
 * Node id for a meter. Prefers the backend meter id so grid-flow endpoints
 * (from_meter_id) and WS telemetry keys match nodes directly; falls back to a
 * deterministic synthetic id when the backend omits it.
 */
function generateMeterId(meter: PublicMeterResponse, index: number): string {
    if (meter.meter_id) return meter.meter_id
    // Create a unique ID from location and coordinates
    const locationKey = meter.location.replace(/\s+/g, '_').toLowerCase()
    const latKey = meter.latitude?.toFixed(4) || '0'
    const lngKey = meter.longitude?.toFixed(4) || '0'
    return `meter-${locationKey}-${latKey}-${lngKey}-${index}`
}

/**
 * Convert a PublicMeterResponse to an EnergyNode for map display.
 * Requires real coordinates — callers filter out meters without them.
 */
function meterToEnergyNode(meter: PublicMeterResponse, index: number): EnergyNode {
    const lat = meter.latitude as number
    const lng = meter.longitude as number

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
        capacity: meter.capacity_kwh != null ? `${meter.capacity_kwh} kWh` : '',
        status: meter.is_verified ? 'active' : 'idle',
        // Telemetry from real meters
        voltage: meter.voltage,
        currentAmps: meter.current,
        frequency: meter.frequency,
        powerFactor: meter.power_factor,
        surplusEnergy: meter.surplus_energy,
        deficitEnergy: meter.deficit_energy,
        zoneId: meter.zone_id,
        // Type-specific real data only (no hardcoded defaults)
        ...(nodeType === 'generator' && {
            currentOutput: `${(meter.current_generation ?? 0).toFixed(2)} kW`,
            ...(meter.efficiency_pct != null && { efficiency: `${meter.efficiency_pct.toFixed(0)}%` }),
        }),
        ...(nodeType === 'consumer' && {
            currentLoad: `${(meter.current_consumption ?? 0).toFixed(2)} kW`,
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
        refreshIntervalMs = 60000,
    } = options

    const { data: meters = [], isLoading, error, refetch } = useQuery({
        queryKey: ['public-meters'],
        queryFn: async () => {
            const response = await defaultApiClient.getPublicMeters()
            if (response.error) throw new Error(response.error)
            return response.data || []
        },
        refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    })

    // Convert meters to EnergyNodes. Only verified meters WITH real coordinates
    // are placed on the map — meters without lat/lng from the backend are dropped
    // (no synthetic placement). See docs/MAP_REAL_DATA_API.md.
    const realMeterNodes: EnergyNode[] = useMemo(() => {
        const verified = meters.filter(meter => meter.is_verified)
        const placeable = verified.filter(meter => meter.latitude != null && meter.longitude != null)
        if (placeable.length < verified.length) {
            console.warn(
                `[useMeterMapData] Dropped ${verified.length - placeable.length} verified meter(s) without coordinates from the map`
            )
        }
        return placeable.map((meter, index) => meterToEnergyNode(meter, index))
    }, [meters])

    // Combine with static nodes if requested
    const nodes: EnergyNode[] = useMemo(() =>
        includeStaticNodes ? [...staticNodes, ...realMeterNodes] : realMeterNodes,
        [includeStaticNodes, staticNodes, realMeterNodes]
    )

    return {
        nodes,
        realMeterNodes,
        meters,
        isLoading,
        error: error ? (error as Error).message : null,
        refresh: async () => { await refetch() },
    }
}
