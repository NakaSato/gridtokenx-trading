import { useMemo, useEffect } from 'react'
import Supercluster from 'supercluster'
import type { EnergyNode } from './types'
import { useWasmMath } from './useWasmMath'

export interface ClusterProperties {
    cluster: true
    cluster_id: number
    point_count: number
    point_count_abbreviated: string
}

export interface PointProperties {
    cluster: false
    nodeId: string
    node: EnergyNode
}

export type ClusterFeature = GeoJSON.Feature<GeoJSON.Point, ClusterProperties>
export type PointFeature = GeoJSON.Feature<GeoJSON.Point, PointProperties>
export type ClusterOrPoint = ClusterFeature | PointFeature

export interface UseMeterClustersOptions {
    /** Array of energy nodes to cluster */
    nodes: EnergyNode[]
    /** Current map zoom level */
    zoom: number
    /** Map bounds [west, south, east, north] */
    bounds?: [number, number, number, number]
    /** Min zoom for clustering (default: 0) */
    minZoom?: number
    /** Max zoom for clustering (default: 16) */
    maxZoom?: number
    /** Cluster radius in pixels (default: 60) */
    radius?: number
}

export interface UseMeterClustersResult {
    /** Clusters and individual points for rendering */
    clusters: ClusterOrPoint[]
    /** Supercluster instance for expansion zoom calculation (legacy support or null) */
    supercluster: Supercluster<PointProperties, ClusterProperties> | null
    /** Get expansion zoom for a cluster */
    getClusterExpansionZoom: (clusterId: number) => number
    /** Get leaves (points) of a cluster */
    getClusterLeaves: (clusterId: number, limit?: number) => PointFeature[]
}

/**
 * Hook to cluster energy nodes using Wasm-based Grid Clustering
 * Falls back to Supercluster if Wasm is not loaded
 */
export function useMeterClusters(options: UseMeterClustersOptions): UseMeterClustersResult {
    const {
        nodes,
        zoom,
        bounds,
        minZoom = 0,
        maxZoom = 16,
        radius = 60,
    } = options

    const { isLoaded: wasmLoaded, loadPointsWasm, getClustersWasm } = useWasmMath()

    // Load points into Wasm when they change
    useEffect(() => {
        if (wasmLoaded && nodes.length > 0) {
            // Map nodes to flat structure with numeric ID if possible
            // Since we need to look them back up, we generate a map index
            const points = nodes.map((n, i) => ({
                lat: n.latitude,
                lng: n.longitude,
                id: i
            }))
            loadPointsWasm(points)
        }
    }, [wasmLoaded, nodes, loadPointsWasm])

    // Create Supercluster instance (Fallback)
    const superclusterFallback = useMemo(() => {
        // Only create if Wasm IS NOT loaded
        if (wasmLoaded) return null

        const points: GeoJSON.Feature<GeoJSON.Point, PointProperties>[] = nodes.map((node) => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [node.longitude, node.latitude] as [number, number],
            },
            properties: {
                cluster: false as const,
                nodeId: node.id,
                node,
            },
        }))

        if (points.length === 0) return null

        const sc = new Supercluster<PointProperties, ClusterProperties>({
            radius,
            maxZoom,
            minZoom,
        })
        sc.load(points)
        return sc
    }, [wasmLoaded, nodes, radius, maxZoom, minZoom])

    // Get clusters
    const clusters = useMemo((): ClusterOrPoint[] => {
        if (!bounds) return []

        // 1. Try Wasm Clustering
        if (wasmLoaded) {
            const rawClusters = getClustersWasm(bounds, zoom)

            return rawClusters.map((c, i) => {
                if (c.count > 1) {
                    // Cluster
                    return {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
                        properties: {
                            cluster: true,
                            cluster_id: Math.floor(c.id), // Use first node ID as cluster ID seed
                            point_count: c.count,
                            point_count_abbreviated: c.count > 1000 ? `${(c.count / 1000).toFixed(1)}k` : `${c.count}`,
                        }
                    } as ClusterFeature
                } else {
                    // Single Point
                    const nodeIndex = Math.floor(c.id)
                    const node = nodes[nodeIndex]
                    if (!node) return null

                    return {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
                        properties: {
                            cluster: false,
                            nodeId: node.id,
                            node,
                        }
                    } as PointFeature
                }
            }).filter(Boolean) as ClusterOrPoint[]
        }

        // 2. Fallback to Supercluster
        if (superclusterFallback) {
            try {
                const result = superclusterFallback.getClusters(bounds, Math.floor(zoom))
                return result as ClusterOrPoint[]
            } catch (error) {
                console.error('Error getting clusters:', error)
                return []
            }
        }

        return []
    }, [wasmLoaded, getClustersWasm, superclusterFallback, bounds, zoom, nodes])

    // Get expansion zoom for a cluster - uses Supercluster if available
    const getClusterExpansionZoom = (clusterId: number): number => {
        if (superclusterFallback) {
            try {
                return superclusterFallback.getClusterExpansionZoom(clusterId)
            } catch {
                return zoom + 2
            }
        }
        // WASM fallback: simple heuristic
        return Math.min(maxZoom, zoom + 2)
    }

    // Get leaves (individual points) of a cluster
    const getClusterLeaves = (clusterId: number, limit = 10): PointFeature[] => {
        if (superclusterFallback) {
            try {
                const leaves = superclusterFallback.getLeaves(clusterId, limit)
                return leaves as PointFeature[]
            } catch {
                return []
            }
        }
        // WASM fallback: return empty (WASM doesn't track cluster membership)
        return []
    }

    return {
        clusters,
        supercluster: superclusterFallback,
        getClusterExpansionZoom,
        getClusterLeaves,
    }
}
