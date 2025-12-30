import { useEffect, useState, useRef, useCallback } from 'react'

interface WasmExports extends WebAssembly.Exports {
    calculate_bezier: (
        x1: number, y1: number,
        x2: number, y2: number,
        curve_intensity: number,
        segments: number,
        ptr: number
    ) => number
    load_points: (ptr: number, count: number) => void
    get_clusters: (
        min_lng: number, min_lat: number,
        max_lng: number, max_lat: number,
        zoom: number
    ) => number
    // Simulation
    init_simulation_nodes: (ptr: number, count: number) => void
    init_simulation_flows: (ptr: number, count: number) => void
    update_simulation: (hour: number, minute: number) => void
    get_node_output_ptr: () => number
    get_flow_output_ptr: () => number

    get_buffer_ptr: () => number
    get_output_buffer_ptr: () => number
    memory: WebAssembly.Memory
}

export function useWasmMath() {
    const [wasm, setWasm] = useState<WasmExports | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const bufferPtrRef = useRef<number>(0)

    useEffect(() => {
        const loadWasm = async () => {
            try {
                // In streaming instantiation, response MUST be fetched from the public dir
                // Adjust the path to where you put the .wasm file
                const response = await fetch('/wasm/gridtokenx_math_wasm.wasm')

                if (!response.ok) {
                    throw new Error(`Failed to load wasm: ${response.statusText}`)
                }

                const { instance } = await WebAssembly.instantiateStreaming(response, {
                    env: {
                        abort: () => console.error("Abort called from Wasm"),
                    },
                })

                const exports = instance.exports as WasmExports
                setWasm(exports)

                // Get the static buffer pointer once
                if (exports.get_buffer_ptr) {
                    bufferPtrRef.current = exports.get_buffer_ptr()
                } else {
                    console.warn('get_buffer_ptr not found in Wasm exports')
                }
            } catch (err: any) {
                console.error('Wasm load error:', err)
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        loadWasm()
    }, [])

    const generateCurvedLineWasm = useCallback((
        from: [number, number],
        to: [number, number],
        curveIntensity: number = 0.2,
        segments: number = 20
    ): [number, number][] | null => {
        if (!wasm || !wasm.memory) return null

        const [x1, y1] = from
        const [x2, y2] = to
        const ptr = bufferPtrRef.current

        // Call Wasm function
        // It writes result to the buffer at `ptr`
        const numPoints = wasm.calculate_bezier(x1, y1, x2, y2, curveIntensity, segments, ptr)

        // Read from memory
        // Each point is 2 f64s (16 bytes)
        // We need to create a view into the memory buffer
        const memoryArray = new Float64Array(wasm.memory.buffer)

        // The pointer `ptr` is a byte offset. For Float64Array (8 bytes per element), index is ptr / 8
        const offset = ptr / 8

        const result: [number, number][] = []
        for (let i = 0; i < numPoints; i++) {
            const x = memoryArray[offset + i * 2]
            const y = memoryArray[offset + i * 2 + 1]
            result.push([x, y])
        }

        return result
    }, [wasm])

    const loadPointsWasm = useCallback((points: Array<{ lat: number, lng: number, id: number }>) => {
        if (!wasm || !wasm.memory) return

        const ptr = bufferPtrRef.current
        const memoryArray = new Float64Array(wasm.memory.buffer)
        const offset = ptr / 8

        // Write points to buffer [lat, lng, id, ...]
        points.forEach((p, i) => {
            memoryArray[offset + i * 3] = p.lat
            memoryArray[offset + i * 3 + 1] = p.lng
            memoryArray[offset + i * 3 + 2] = p.id
        })

        wasm.load_points(ptr, points.length)
    }, [wasm])

    const getClustersWasm = useCallback((
        bounds: [number, number, number, number],
        zoom: number
    ): Array<{ lat: number, lng: number, count: number, id: number }> => {
        if (!wasm || !wasm.memory) return []

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
    }, [wasm])

    const initSimulationNodesWasm = useCallback((nodes: any[]) => {
        if (!wasm || !wasm.memory) return

        const ptr = bufferPtrRef.current
        const memoryArray = new Float64Array(wasm.memory.buffer)
        const offset = ptr / 8

        // [type, base, current, status, is_real]
        nodes.forEach((n, i) => {
            memoryArray[offset + i * 5] = n.type
            memoryArray[offset + i * 5 + 1] = n.base
            memoryArray[offset + i * 5 + 2] = n.current
            memoryArray[offset + i * 5 + 3] = n.status // 0, 1, 2
            memoryArray[offset + i * 5 + 4] = n.isReal ? 1 : 0
        })

        wasm.init_simulation_nodes(ptr, nodes.length)
    }, [wasm])

    const initSimulationFlowsWasm = useCallback((flows: any[]) => {
        if (!wasm || !wasm.memory) return

        const ptr = bufferPtrRef.current
        const memoryArray = new Float64Array(wasm.memory.buffer)
        const offset = ptr / 8

        // [base, current]
        flows.forEach((f, i) => {
            memoryArray[offset + i * 2] = f.base
            memoryArray[offset + i * 2 + 1] = f.current
        })

        wasm.init_simulation_flows(ptr, flows.length)
    }, [wasm])

    const updateSimulationWasm = useCallback((hour: number, minute: number, nodeCount: number, flowCount: number) => {
        if (!wasm || !wasm.memory) return null

        wasm.update_simulation(hour, minute)

        const memoryArray = new Float64Array(wasm.memory.buffer)

        // Read Nodes
        const nodePtr = wasm.get_node_output_ptr()
        const nodeOffset = nodePtr / 8
        const nodeData = [] // For now, maybe return raw array to save performance?
        // Actually, just returning the raw Float64Array slice might be faster for the hook to consume
        const nodesSlice = new Float64Array(wasm.memory.buffer, nodePtr, nodeCount * 2) // [val, status]

        // Read Flows
        const flowPtr = wasm.get_flow_output_ptr()
        const flowsSlice = new Float64Array(wasm.memory.buffer, flowPtr, flowCount) // [val]

        return { nodes: nodesSlice, flows: flowsSlice }
    }, [wasm])

    return {
        isLoaded: !!wasm,
        isLoading,
        error,
        generateCurvedLineWasm,
        loadPointsWasm,
        getClustersWasm,
        initSimulationNodesWasm,
        initSimulationFlowsWasm,
        updateSimulationWasm
    }
}
