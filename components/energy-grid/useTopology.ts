'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { initWasm, getWasmExports, isWasmLoaded } from '@/lib/wasm-bridge'
import type { EnergyNode, EnergyTransfer } from './types'

export interface PathResult {
    nodeIds: number[]
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
    findPath: (fromId: number, toId: number) => PathResult | null
    getInfo: () => TopologyInfo
}

/**
 * Hook to use WASM topology module for path finding and power flow
 */
export function useTopology(): UseTopologyResult {
    const [isLoaded, setIsLoaded] = useState(false)

    // Initialize WASM on mount
    // Check WASM status on mount and when it changes
    useEffect(() => {
        if (isWasmLoaded()) {
            setIsLoaded(true)
        } else {
            // Listen for WASM load event or poll? 
            // For now, simple polling fallback since we don't have a global event bus for this yet
            const interval = setInterval(() => {
                if (isWasmLoaded()) {
                    setIsLoaded(true)
                    clearInterval(interval)
                }
            }, 100)
            return () => clearInterval(interval)
        }
    }, [])

    // Load network from energy nodes and transfers
    const loadNetwork = useCallback((nodes: EnergyNode[], transfers: EnergyTransfer[]) => {
        const wasm = getWasmExports()
        if (!wasm) return

        // Initialize network
        wasm.topology_init()

        // Get buffer pointer for data transfer
        const bufferPtr = wasm.get_buffer_ptr()
        const memory = new Float64Array(wasm.memory.buffer)

        // Load nodes
        // Format: [id, x (lng), y (lat), type, capacity, current_load]
        const nodeTypeMap: Record<string, number> = {
            'generator': 0,
            'storage': 1,
            'consumer': 2,
            'transformer': 3,
        }

        const nodeData: number[] = []
        nodes.forEach((node, idx) => {
            // Parse capacity from string (e.g. "500 kW" -> 500)
            const capacity = parseFloat(node.capacity) || 0
            // Get current load based on node type
            const currentLoad = node.type === 'generator'
                ? parseFloat(node.currentOutput || '0')
                : parseFloat(node.currentLoad || '0')

            nodeData.push(
                idx + 1, // Use index as ID
                node.longitude,
                node.latitude,
                nodeTypeMap[node.type] ?? 2,
                capacity,
                currentLoad
            )
        })

        // Copy node data to WASM memory
        const nodeOffset = bufferPtr / 8
        for (let i = 0; i < nodeData.length; i++) {
            memory[nodeOffset + i] = nodeData[i]
        }
        wasm.topology_load_nodes(bufferPtr, nodes.length)

        // Load lines (transfers)
        // Format: [from_id, to_id, resistance, max_capacity, length_km]
        const lineData: number[] = []
        transfers.forEach((transfer) => {
            const fromIdx = nodes.findIndex(n => n.id === transfer.from)
            const toIdx = nodes.findIndex(n => n.id === transfer.to)
            if (fromIdx === -1 || toIdx === -1) return

            // Calculate approximate distance in km based on lat/lng
            const fromNode = nodes[fromIdx]
            const toNode = nodes[toIdx]
            const dx = (toNode.longitude - fromNode.longitude) * 111 // ~111km per degree lng at equator
            const dy = (toNode.latitude - fromNode.latitude) * 111
            const distKm = Math.sqrt(dx * dx + dy * dy)

            lineData.push(
                fromIdx + 1, // from_id
                toIdx + 1,   // to_id
                0.1,         // resistance (default)
                transfer.power || 500, // max capacity
                distKm || 0.1 // length in km
            )
        })

        // Copy line data to WASM memory
        for (let i = 0; i < lineData.length; i++) {
            memory[nodeOffset + i] = lineData[i]
        }
        wasm.topology_load_lines(bufferPtr, transfers.length)

        console.log(`[Topology] Loaded ${nodes.length} nodes, ${transfers.length} lines`)
    }, [])

    // Find shortest path between two nodes
    const findPath = useCallback((fromId: number, toId: number): PathResult | null => {
        const wasm = getWasmExports()
        if (!wasm) return null

        const pathLen = wasm.topology_shortest_path(fromId, toId)
        if (pathLen === 0) return null

        const pathPtr = wasm.topology_path_ptr()
        const pathMemory = new Float64Array(wasm.memory.buffer, pathPtr, pathLen)

        const nodeIds: number[] = []
        for (let i = 0; i < pathLen; i++) {
            nodeIds.push(pathMemory[i])
        }

        return {
            nodeIds,
            distance: pathLen - 1, // Distance is number of hops
        }
    }, [])

    // Get network info
    const getInfo = useCallback((): TopologyInfo => {
        const wasm = getWasmExports()
        if (!wasm) return { nodeCount: 0, lineCount: 0, totalLoss: 0 }

        return {
            nodeCount: wasm.topology_node_count(),
            lineCount: wasm.topology_line_count(),
            totalLoss: wasm.topology_calc_losses(11.0), // 11kV
        }
    }, [])

    return {
        isLoaded,
        loadNetwork,
        findPath,
        getInfo,
    }
}
