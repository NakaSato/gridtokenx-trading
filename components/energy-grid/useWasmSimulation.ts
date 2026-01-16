'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import type { EnergyNode, EnergyTransfer, LiveNodeData, LiveTransferData } from './types'
import { getInitialLiveValue } from './utils'
import { useWasmMath } from './useWasmMath'

interface UseWasmSimulationProps {
    energyNodes: EnergyNode[]
    energyTransfers: EnergyTransfer[]
    updateIntervalMs?: number
    isLive?: boolean
    selectedTime?: Date
}

export function useWasmSimulation({
    energyNodes,
    energyTransfers,
    updateIntervalMs = 1000, // Faster updates with Wasm!
    isLive = true,
    selectedTime,
}: UseWasmSimulationProps) {

    // Get time
    const currentTime = useMemo(() => {
        return isLive ? new Date() : (selectedTime || new Date())
    }, [isLive, selectedTime])

    const {
        isLoaded: wasmLoaded,
        initSimulationNodesWasm,
        initSimulationFlowsWasm,
        updateSimulationWasm
    } = useWasmMath()

    // Initialize Wasm State
    useEffect(() => {
        if (!wasmLoaded || energyNodes.length === 0) return

        // Map nodes to flat format
        // Type: 0=Gen, 1=Storage, 2=Consumer
        // Status: 0=Idle, 1=Active, 2=Maintenance
        const nodesFlat = energyNodes.map(n => {
            let type = 2
            if (n.type === 'generator') type = 0
            if (n.type === 'storage') type = 1

            let status = 0
            if (n.status === 'active') status = 1
            if (n.status === 'maintenance') status = 2

            const base = getInitialLiveValue(n)

            return {
                type,
                base,
                current: base, // Initial value
                status,
                isReal: n.id.startsWith('meter-')
            }
        })

        initSimulationNodesWasm(nodesFlat)

        // Map flows
        const flowsFlat = energyTransfers.map(t => ({
            base: t.power,
            current: t.power
        }))

        initSimulationFlowsWasm(flowsFlat)

    }, [wasmLoaded, energyNodes, energyTransfers, initSimulationNodesWasm, initSimulationFlowsWasm])

    // React State for UI
    const [liveNodeData, setLiveNodeData] = useState<Record<string, LiveNodeData>>({})
    const [liveTransferData, setLiveTransferData] = useState<Record<string, LiveTransferData>>({})
    const [lastGlobalUpdate, setLastGlobalUpdate] = useState<Date>(new Date())

    // Simulation Loop
    useEffect(() => {
        if (!isLive || !wasmLoaded) return

        const interval = setInterval(() => {
            const now = new Date()
            const hour = now.getHours() + now.getMinutes() / 60
            const minute = now.getMinutes()

            // Run Wasm Tick
            const result = updateSimulationWasm(hour, minute, energyNodes.length, energyTransfers.length)

            if (result) {
                const { nodes, flows } = result

                // Optimization: Debounce updates - only update if values changed significantly
                // This reduces re-renders when changes are minimal
                const CHANGE_THRESHOLD = 0.02 // 2% change required to trigger update

                // Update Nodes
                // Result nodes layout: [val, status, val, status...]
                const nextNodes: Record<string, LiveNodeData> = {}
                let nodeDataChanged = false

                energyNodes.forEach((n, i) => {
                    const val = nodes[i * 2]
                    const statusNum = nodes[i * 2 + 1]
                    let status: 'active' | 'idle' | 'maintenance' = 'idle'
                    if (statusNum === 1) status = 'active'
                    if (statusNum === 2) status = 'maintenance'

                    const prevData = liveNodeData[n.id]
                    const prevVal = prevData?.currentValue ?? 0
                    const prevStatus = prevData?.status ?? 'idle'

                    // Check if change is significant enough to warrant update
                    const valueDiff = prevVal > 0 ? Math.abs(val - prevVal) / prevVal : (val > 0 ? 1 : 0)
                    const hasSignificantChange = valueDiff > CHANGE_THRESHOLD || status !== prevStatus

                    if (hasSignificantChange) {
                        nodeDataChanged = true
                    }

                    nextNodes[n.id] = {
                        nodeId: n.id,
                        currentValue: val,
                        status,
                        lastUpdate: now
                    }
                })

                // Only trigger re-render if data actually changed
                if (nodeDataChanged) {
                    setLiveNodeData(nextNodes)
                }

                // Update Flows with similar debounce logic
                const nextFlows: Record<string, LiveTransferData> = {}
                let flowDataChanged = false

                energyTransfers.forEach((t, i) => {
                    const id = `flow-${i}`
                    const newPower = flows[i]
                    const prevPower = liveTransferData[id]?.currentPower ?? 0

                    const valueDiff = prevPower > 0 ? Math.abs(newPower - prevPower) / prevPower : (newPower > 0 ? 1 : 0)
                    if (valueDiff > CHANGE_THRESHOLD) {
                        flowDataChanged = true
                    }

                    nextFlows[id] = {
                        transferId: id,
                        currentPower: newPower
                    }
                })

                if (flowDataChanged) {
                    setLiveTransferData(nextFlows)
                }

                if (nodeDataChanged || flowDataChanged) {
                    setLastGlobalUpdate(now)
                }
            }

        }, updateIntervalMs)

        return () => clearInterval(interval)
    }, [isLive, wasmLoaded, updateSimulationWasm, energyNodes, energyTransfers, updateIntervalMs])


    // Calc totals (Same as before, could be moved to Wasm too but fast enough in JS)
    const gridTotals = useMemo(() => {
        const totalGeneration = energyNodes
            .filter((n) => n.type === 'generator')
            .reduce((sum, n) => sum + (liveNodeData[n.id]?.currentValue ?? 0), 0)

        const totalConsumption = energyNodes
            .filter((n) => n.type === 'consumer')
            .reduce((sum, n) => sum + (liveNodeData[n.id]?.currentValue ?? 0), 0)

        const co2SavedPerhour = totalGeneration * 0.431

        return {
            totalGeneration,
            totalConsumption,
            co2Saved: co2SavedPerhour,
            activeMeters: energyNodes.filter(n => liveNodeData[n.id]?.status === 'active').length,
            avgStorage: (() => {
                const storageNodes = energyNodes.filter((n) => n.type === 'storage')
                if (storageNodes.length === 0) return 0
                const totalPercent = storageNodes.reduce(
                    (sum, n) => sum + (liveNodeData[n.id]?.currentValue ?? 0),
                    0
                )
                return totalPercent / storageNodes.length
            })(),
        }
    }, [energyNodes, liveNodeData])

    return {
        liveNodeData,
        liveTransferData,
        lastGlobalUpdate,
        gridTotals,
        currentTime,
    }
}
