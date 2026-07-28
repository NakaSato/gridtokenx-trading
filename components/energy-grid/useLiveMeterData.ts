'use client'

import { useMemo } from 'react'
import type { EnergyNode, EnergyTransfer, LiveNodeData, LiveTransferData } from '@/types/grid'
import { getInitialLiveValue, liveValueFor } from './utils'
import type { MeterTelemetry } from './useMeterTelemetry'

interface UseLiveMeterDataProps {
    energyNodes: EnergyNode[]
    energyTransfers: EnergyTransfer[]
    /** Optional live WS telemetry keyed by node id; overrides poll values when present. */
    telemetry?: Record<string, MeterTelemetry>
}

/**
 * Maps REAL meter telemetry (already on each EnergyNode from the API poll) to the
 * live-data shape the markers/flow lines consume. No client-side simulation:
 * values come straight from the latest API/WS payload. Replaces the former
 * WASM/JS simulation hook — values refresh on each meter poll (or telemetry WS
 * once it ships), not via Math.random interpolation.
 */
export function useLiveMeterData({ energyNodes, energyTransfers, telemetry }: UseLiveMeterDataProps) {
    const liveNodeData = useMemo<Record<string, LiveNodeData>>(() => {
        const now = new Date()
        const out: Record<string, LiveNodeData> = {}
        energyNodes.forEach((n) => {
            const t = telemetry?.[n.id]
            let status: 'active' | 'idle' | 'maintenance' = 'idle'
            if ((t?.status ?? n.status) === 'active') status = 'active'
            if ((t?.status ?? n.status) === 'maintenance') status = 'maintenance'
            out[n.id] = {
                nodeId: n.id,
                currentValue: liveValueFor(n, t),
                status,
                lastUpdate: now,
            }
        })
        return out
    }, [energyNodes, telemetry])

    const liveTransferData = useMemo<Record<string, LiveTransferData>>(() => {
        const out: Record<string, LiveTransferData> = {}
        energyTransfers.forEach((t, i) => {
            out[`flow-${i}`] = { transferId: `flow-${i}`, currentPower: t.power }
        })
        return out
    }, [energyTransfers])

    const gridTotals = useMemo(() => {
        const totalGeneration = energyNodes
            .filter((n) => n.type === 'generator')
            .reduce((sum, n) => sum + liveValueFor(n, telemetry?.[n.id]), 0)
        const totalConsumption = energyNodes
            .filter((n) => n.type === 'consumer')
            .reduce((sum, n) => sum + liveValueFor(n, telemetry?.[n.id]), 0)
        const storageNodes = energyNodes.filter((n) => n.type === 'storage')
        const avgStorage = storageNodes.length
            ? storageNodes.reduce((sum, n) => sum + getInitialLiveValue(n), 0) / storageNodes.length
            : 0
        return {
            totalGeneration,
            totalConsumption,
            // CO2 comes from grid-status API (co2_saved_kg); no client estimate.
            co2Saved: 0,
            activeMeters: energyNodes.filter((n) => (telemetry?.[n.id]?.status ?? n.status) === 'active').length,
            avgStorage,
        }
    }, [energyNodes, telemetry])

    return { liveNodeData, liveTransferData, gridTotals }
}
