import { useState, useEffect, useCallback, useMemo } from 'react'
import { initWasm, isWasmLoaded, Topology as WasmTopology } from '@/lib/wasm-bridge'
import type { EnergyNode, EnergyTransfer } from './types'

export interface PathResult {
    nodeIds: string[]
    distance: number
}

export interface TopologyInfo {
    nodeCount: number
    lineCount: number
    totalLoss: number
}

interface UseTopologyResult {
    isLoaded: boolean
    loadNetwork: (nodes: EnergyNode[], transfers: EnergyTransfer[]) => void
    findPath: (fromId: string, toId: string) => PathResult | null
    getInfo: () => TopologyInfo
}

/**
 * Hook to use WASM topology module for path finding and power flow
 */
export function useTopology(): UseTopologyResult {
    const [isLoaded, setIsLoaded] = useState(false)
    const [topologyInstance, setTopologyInstance] = useState<WasmTopology | null>(null)
    const [stats, setStats] = useState<TopologyInfo>({ nodeCount: 0, lineCount: 0, totalLoss: 0 })

    // Initialize WASM on mount
    useEffect(() => {
        const init = async () => {
            if (!isWasmLoaded()) {
                await initWasm()
            }
            const instance = new WasmTopology()
            setTopologyInstance(instance)
            setIsLoaded(true)
        }
        init().catch(err => console.error('Failed to init Topology WASM:', err))

        return () => {
            if (topologyInstance) {
                topologyInstance.free()
            }
        }
    }, [])

    // Load network from energy nodes and transfers
    const loadNetwork = useCallback((nodes: EnergyNode[], transfers: EnergyTransfer[]) => {
        if (!topologyInstance) return

        // Format nodes for WASM
        const wasmNodes = nodes.map(node => ({
            id: node.id,
            x: node.longitude,
            y: node.latitude,
            node_type: node.type
        }))

        // Format edges/transfers for WASM
        const wasmEdges = transfers.map(transfer => ({
            from: transfer.from,
            to: transfer.to,
            capacity: transfer.power || 500,
            load: 0 // Inital load
        }))

        try {
            topologyInstance.set_graph(wasmNodes, wasmEdges)
            setStats({
                nodeCount: nodes.length,
                lineCount: transfers.length,
                totalLoss: 0 // Logic for loss calculation moved/changed in WASM
            })
        } catch (error) {
            console.error('Failed to set topology graph:', error)
        }
    }, [topologyInstance])

    // Find shortest path between two nodes
    const findPath = useCallback((fromId: string, toId: string): PathResult | null => {
        if (!topologyInstance) return null

        try {
            const result = topologyInstance.find_path(fromId, toId)
            if (!result) return null

            return {
                nodeIds: result.path,
                distance: result.total_distance
            }
        } catch (error) {
            console.error('Failed to find path:', error)
            return null
        }
    }, [topologyInstance])

    // Get network info
    const getInfo = useCallback((): TopologyInfo => {
        return stats
    }, [stats])

    return {
        isLoaded,
        loadNetwork,
        findPath,
        getInfo,
    }
}
