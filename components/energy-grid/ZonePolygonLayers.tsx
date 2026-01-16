'use client'

import { useMemo, memo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { EnergyNode } from './types'

// Zone colors matching the simulator
const ZONE_COLORS = [
    { fill: 'rgba(239, 68, 68, 0.15)', stroke: '#ef4444' },   // Red
    { fill: 'rgba(34, 197, 94, 0.15)', stroke: '#22c55e' },   // Green
    { fill: 'rgba(59, 130, 246, 0.15)', stroke: '#3b82f6' },  // Blue
    { fill: 'rgba(168, 85, 247, 0.15)', stroke: '#a855f7' },  // Purple
    { fill: 'rgba(245, 158, 11, 0.15)', stroke: '#f59e0b' },  // Amber
    { fill: 'rgba(236, 72, 153, 0.15)', stroke: '#ec4899' },  // Pink
    { fill: 'rgba(20, 184, 166, 0.15)', stroke: '#14b8a6' },  // Teal
    { fill: 'rgba(249, 115, 22, 0.15)', stroke: '#f97316' },  // Orange
]

interface ZonePolygonLayersProps {
    energyNodes: EnergyNode[]
    visible?: boolean
}

/**
 * Convex Hull algorithm (Gift Wrapping / Jarvis March)
 * Returns points in order to form a convex polygon
 */
function convexHull(points: [number, number][]): [number, number][] {
    if (points.length < 3) return points

    // Find leftmost point
    let leftmost = 0
    for (let i = 1; i < points.length; i++) {
        if (points[i][0] < points[leftmost][0]) leftmost = i
    }

    const hull: [number, number][] = []
    let p = leftmost
    let q: number

    do {
        hull.push(points[p])
        q = (p + 1) % points.length

        for (let i = 0; i < points.length; i++) {
            // Cross product to determine turn direction
            const val = (points[i][1] - points[p][1]) * (points[q][0] - points[i][0]) -
                (points[i][0] - points[p][0]) * (points[q][1] - points[i][1])
            if (val < 0) q = i
        }

        p = q
    } while (p !== leftmost && hull.length < points.length + 1)

    // Close the polygon
    if (hull.length > 0) {
        hull.push(hull[0])
    }

    return hull
}

/**
 * Expand polygon outward from centroid for better visual padding
 */
function expandPolygon(points: [number, number][], factor: number = 1.15): [number, number][] {
    if (points.length < 3) return points

    // Calculate centroid
    let cx = 0, cy = 0
    const n = points.length - 1 // Exclude closing point
    for (let i = 0; i < n; i++) {
        cx += points[i][0]
        cy += points[i][1]
    }
    cx /= n
    cy /= n

    // Expand each point outward from centroid
    return points.map(([x, y]) => {
        const dx = x - cx
        const dy = y - cy
        return [cx + dx * factor, cy + dy * factor] as [number, number]
    })
}

export const ZonePolygonLayers = memo(function ZonePolygonLayers({
    energyNodes,
    visible = true,
}: ZonePolygonLayersProps) {

    // Group nodes by zone and create polygon GeoJSON
    const zonePolygonsGeoJSON = useMemo(() => {
        // Group meters by zone_id
        const zoneMeters: Record<number, EnergyNode[]> = {}

        energyNodes.forEach(node => {
            // Only include actual meters (not transformers)
            if (node.type === 'transformer') return
            if (node.zoneId === undefined || node.zoneId === null) return

            if (!zoneMeters[node.zoneId]) {
                zoneMeters[node.zoneId] = []
            }
            zoneMeters[node.zoneId].push(node)
        })

        // Create polygon features for each zone
        const features = Object.entries(zoneMeters)
            .filter(([, meters]) => meters.length >= 3) // Need at least 3 points for polygon
            .map(([zoneIdStr, meters]) => {
                const zoneId = parseInt(zoneIdStr)
                const color = ZONE_COLORS[zoneId % ZONE_COLORS.length]

                // Get coordinates
                const points: [number, number][] = meters.map(m => [m.longitude, m.latitude])

                // Calculate convex hull
                let hull = convexHull(points)

                // Expand polygon for better visual appearance
                hull = expandPolygon(hull, 1.08)

                return {
                    type: 'Feature' as const,
                    properties: {
                        zoneId,
                        fillColor: color.fill,
                        strokeColor: color.stroke,
                        meterCount: meters.length,
                    },
                    geometry: {
                        type: 'Polygon' as const,
                        coordinates: [hull],
                    },
                }
            })

        return {
            type: 'FeatureCollection' as const,
            features,
        }
    }, [energyNodes])

    if (!visible || zonePolygonsGeoJSON.features.length === 0) return null

    return (
        <>
            {/* Zone Fill Layer */}
            <Source
                id="zone-polygons"
                type="geojson"
                data={zonePolygonsGeoJSON as GeoJSON.FeatureCollection}
            >
                <Layer
                    id="zone-polygon-fill"
                    type="fill"
                    paint={{
                        'fill-color': ['get', 'fillColor'],
                        'fill-opacity': 0.6,
                    }}
                />
                <Layer
                    id="zone-polygon-stroke"
                    type="line"
                    paint={{
                        'line-color': ['get', 'strokeColor'],
                        'line-width': 2,
                        'line-opacity': 0.8,
                        'line-dasharray': [4, 2],
                    }}
                />
            </Source>
        </>
    )
})
