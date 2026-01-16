import { useRef, useCallback, useMemo } from 'react'
import { getWasmExports } from '@/lib/wasm-bridge'
import { useWasm } from '@/lib/wasm-provider'

export function useWasmMath() {
    const { isLoaded, isLoading, error } = useWasm()
    const wasm = useMemo(() => getWasmExports(), [isLoaded])
    const bufferPtrRef = useRef<number>(0)

    // Initialize buffer pointer once wasm is loaded
    if (isLoaded && wasm && bufferPtrRef.current === 0) {
        if (wasm.get_buffer_ptr) {
            bufferPtrRef.current = wasm.get_buffer_ptr()
        }
    }

    const generateCurvedLineWasm = useCallback((
        from: [number, number],
        to: [number, number],
        curveIntensity: number = 0.2,
        segments: number = 20
    ): [number, number][] | null => {
        if (!isLoaded || !wasm || !wasm.memory) return null

        const [x1, y1] = from
        const [x2, y2] = to
        const ptr = bufferPtrRef.current

        // Call Wasm function
        const numPoints = wasm.calculate_bezier(x1, y1, x2, y2, curveIntensity, segments, ptr)

        const memoryArray = new Float64Array(wasm.memory.buffer)
        const offset = ptr / 8

        const result: [number, number][] = []
        for (let i = 0; i < numPoints; i++) {
            const x = memoryArray[offset + i * 2]
            const y = memoryArray[offset + i * 2 + 1]
            result.push([x, y])
        }

        return result
    }, [isLoaded, wasm])

    const loadPointsWasm = useCallback((points: Array<{ lat: number, lng: number, id: number }>) => {
        if (!isLoaded || !wasm || !wasm.memory) return

        const ptr = bufferPtrRef.current
        const memoryArray = new Float64Array(wasm.memory.buffer)
        const offset = ptr / 8

        points.forEach((p, i) => {
            memoryArray[offset + i * 3] = p.lat
            memoryArray[offset + i * 3 + 1] = p.lng
            memoryArray[offset + i * 3 + 2] = p.id
        })

        wasm.load_points(ptr, points.length)
    }, [isLoaded, wasm])

    const getClustersWasm = useCallback((
        bounds: [number, number, number, number],
        zoom: number
    ): Array<{ lat: number, lng: number, count: number, id: number }> => {
        if (!isLoaded || !wasm || !wasm.memory) return []

        const [minLng, minLat, maxLng, maxLat] = bounds
        const numClusters = wasm.get_clusters(minLng, minLat, maxLng, maxLat, zoom)

        const outputPtr = wasm.get_output_buffer_ptr()
        const memoryArray = new Float64Array(wasm.memory.buffer)
        const offset = outputPtr / 8

        const clusters: Array<{ lat: number, lng: number, count: number, id: number }> = []

        for (let i = 0; i < numClusters; i++) {
            const lat = memoryArray[offset + i * 4]
            const lng = memoryArray[offset + i * 4 + 1]
            const count = memoryArray[offset + i * 4 + 2]
            const id = memoryArray[offset + i * 4 + 3]
            clusters.push({ lat, lng, count, id })
        }

        return clusters
    }, [isLoaded, wasm])

    const initSimulationNodesWasm = useCallback((nodes: any[]) => {
        if (!isLoaded || !wasm || !wasm.memory) return

        const ptr = bufferPtrRef.current
        const memoryArray = new Float64Array(wasm.memory.buffer)
        const offset = ptr / 8

        nodes.forEach((n, i) => {
            memoryArray[offset + i * 5] = n.type
            memoryArray[offset + i * 5 + 1] = n.base
            memoryArray[offset + i * 5 + 2] = n.current
            memoryArray[offset + i * 5 + 3] = n.status
            memoryArray[offset + i * 5 + 4] = n.isReal ? 1 : 0
        })

        wasm.init_simulation_nodes(ptr, nodes.length)
    }, [isLoaded, wasm])

    const initSimulationFlowsWasm = useCallback((flows: any[]) => {
        if (!isLoaded || !wasm || !wasm.memory) return

        const ptr = bufferPtrRef.current
        const memoryArray = new Float64Array(wasm.memory.buffer)
        const offset = ptr / 8

        flows.forEach((f, i) => {
            memoryArray[offset + i * 2] = f.base
            memoryArray[offset + i * 2 + 1] = f.current
        })

        wasm.init_simulation_flows(ptr, flows.length)
    }, [isLoaded, wasm])

    const updateSimulationWasm = useCallback((hour: number, minute: number, nodeCount: number, flowCount: number) => {
        if (!isLoaded || !wasm || !wasm.memory) return null

        wasm.update_simulation(hour, minute)

        // Read Nodes
        const nodePtr = wasm.get_node_output_ptr()
        const nodesSlice = new Float64Array(wasm.memory.buffer, nodePtr, nodeCount * 2)

        // Read Flows
        const flowPtr = wasm.get_flow_output_ptr()
        const flowsSlice = new Float64Array(wasm.memory.buffer, flowPtr, flowCount)

        return { nodes: nodesSlice, flows: flowsSlice }
    }, [isLoaded, wasm])

    const calculateOptionsPrice = useCallback((s: number, k: number, t: number, isCall: boolean) => {
        if (!isLoaded || !wasm) return 0
        return wasm.black_scholes(s, k, t, isCall ? 1 : 0)
    }, [isLoaded, wasm])

    const calculateGreeks = useCallback((s: number, k: number, t: number, isCall: boolean) => {
        if (!isLoaded || !wasm || !wasm.memory) return null

        const outPtr = bufferPtrRef.current
        wasm.calc_all_greeks(s, k, t, isCall ? 1 : 0, outPtr)

        const memoryArray = new Float64Array(wasm.memory.buffer)
        const offset = outPtr / 8

        return {
            delta: memoryArray[offset],
            gamma: memoryArray[offset + 1],
            vega: memoryArray[offset + 2],
            theta: memoryArray[offset + 3],
            rho: memoryArray[offset + 4]
        }
    }, [isLoaded, wasm])

    return {
        isLoaded,
        isLoading,
        error: error?.message || null,
        generateCurvedLineWasm,
        loadPointsWasm,
        getClustersWasm,
        initSimulationNodesWasm,
        initSimulationFlowsWasm,
        updateSimulationWasm,
        calculateOptionsPrice,
        calculateGreeks
    }
}
