import { useRef, useCallback, useMemo } from 'react'
import {
    isWasmLoaded,
    blackScholes,
    calculateGreeks as calculateGreeksWasmHelper,
    calculateBezier as calculateBezierWasmHelper,
    Clusterer,
    Simulation
} from '@/lib/wasm-bridge'
import { useWasm } from '@/lib/wasm-provider'

export function useWasmMath() {
    const { isLoaded, isLoading, error } = useWasm()

    // Instances of WASM classes
    const clustererRef = useRef<Clusterer | null>(null)
    const simulationRef = useRef<Simulation | null>(null)

    // Initialize instances once WASM is loaded
    if (isLoaded && !clustererRef.current) {
        clustererRef.current = new Clusterer()
    }
    if (isLoaded && !simulationRef.current) {
        simulationRef.current = new Simulation()
    }

    const generateCurvedLineWasm = useCallback((
        from: [number, number],
        to: [number, number],
        curveIntensity: number = 0.2,
        segments: number = 20
    ): [number, number][] | null => {
        if (!isLoaded) return null
        return calculateBezierWasmHelper(from[0], from[1], to[0], to[1], curveIntensity, segments)
    }, [isLoaded])

    const loadPointsWasm = useCallback((points: Array<{ lat: number, lng: number, id: number }>) => {
        if (!isLoaded || !clustererRef.current) return

        // Pass JSON-like object to wasm-bindgen
        clustererRef.current.load_points(points)
    }, [isLoaded])

    const getClustersWasm = useCallback((
        bounds: [number, number, number, number],
        zoom: number
    ): Array<{ lat: number, lng: number, count: number, id: number }> => {
        if (!isLoaded || !clustererRef.current) return []

        const [minLng, minLat, maxLng, maxLat] = bounds
        try {
            const clusters = clustererRef.current.get_clusters(minLng, minLat, maxLng, maxLat, zoom)
            // wasm-bindgen handles the conversion back to JS objects
            return clusters as Array<{ lat: number, lng: number, count: number, id: number }>
        } catch (err) {
            console.error('[WASM] Clustering error:', err)
            return []
        }
    }, [isLoaded])

    const initSimulationNodesWasm = useCallback((nodes: any[]) => {
        if (!isLoaded || !simulationRef.current) return
        simulationRef.current.set_nodes(nodes)
    }, [isLoaded])

    const initSimulationFlowsWasm = useCallback((flows: any[]) => {
        if (!isLoaded || !simulationRef.current) return
        simulationRef.current.set_flows(flows)
    }, [isLoaded])

    const updateSimulationWasm = useCallback((hour: number, minute: number, nodeCount: number, flowCount: number) => {
        if (!isLoaded || !simulationRef.current) return null

        simulationRef.current.update(hour, minute)

        const nodes = simulationRef.current.get_nodes()
        const flows = simulationRef.current.get_flows()

        // Match the legacy return format if possible, or update callers
        // The legacy format used Float64Array slices
        return {
            nodes: new Float64Array(nodes.flatMap((n: any) => [n.current || 0, n.status || 0])),
            flows: new Float64Array(flows.map((f: any) => f.current || 0))
        }
    }, [isLoaded])

    const calculateOptionsPrice = useCallback((s: number, k: number, t: number, isCall: boolean) => {
        return blackScholes(s, k, t, isCall)
    }, [])

    const calculateGreeks = useCallback((s: number, k: number, t: number, isCall: boolean) => {
        return calculateGreeksWasmHelper(s, k, t, isCall)
    }, [])

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
