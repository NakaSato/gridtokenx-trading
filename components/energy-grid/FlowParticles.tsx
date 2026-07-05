'use client'

import { useEffect, useMemo } from 'react'
import { Source, Layer, useMap } from 'react-map-gl/mapbox'
import type { GeoJSONSource } from 'mapbox-gl'

/**
 * FlowParticles renders animated "energy packets" (glowing comet dots) that travel
 * along pre-computed flow curves, visualizing the direction of P2P energy flow.
 *
 * Design notes:
 * - The point Source is mounted once with a stable empty FeatureCollection so
 *   react-map-gl never resets it; the moving particles are pushed each frame
 *   imperatively via `GeoJSONSource.setData`. This avoids React re-render churn
 *   (no new GeoJSON object per frame) and keeps the animation smooth at 60fps.
 * - Each packet emits a short trail of fading points → comet effect.
 */

interface FlowLineFeature {
    geometry: { type: 'LineString'; coordinates: number[][] }
    properties?: Record<string, unknown> | null
}

interface FlowParticlesProps {
    /** Unique id prefix for the source/layers (must differ per layer instance) */
    id: string
    /** Pre-computed curved flow lines (e.g. from EnergyFlowLayers / TradeFlowLayers) */
    lineFeatures: FlowLineFeature[]
    visible?: boolean
    /** Packets travelling along each line simultaneously */
    packetsPerLine?: number
    /** Number of trailing points behind each packet head (comet tail length) */
    tailLength?: number
    /** Base travel speed in fraction-of-line per second */
    speed?: number
    /** Fallback packet color when a feature has no `color` property */
    defaultColor?: string
}

// Module-level constant keeps the `data` prop reference stable so react-map-gl
// does not overwrite our imperative setData on re-render.
const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

interface PreparedLine {
    coords: number[][]
    cumulative: number[]
    total: number
    color: string
    speedMul: number
}

// Interpolate a point at fraction `f` (0..1) along a polyline using its
// cumulative segment lengths.
function pointAt(line: PreparedLine, f: number): [number, number] {
    const target = Math.max(0, Math.min(1, f)) * line.total
    const { coords, cumulative } = line
    for (let j = 1; j < cumulative.length; j++) {
        if (cumulative[j] >= target) {
            const segLen = cumulative[j] - cumulative[j - 1] || 1
            const t = (target - cumulative[j - 1]) / segLen
            const a = coords[j - 1]
            const b = coords[j]
            return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
        }
    }
    const last = coords[coords.length - 1]
    return [last[0], last[1]]
}

export function FlowParticles({
    id,
    lineFeatures,
    visible = true,
    packetsPerLine = 2,
    tailLength = 6,
    speed = 0.18,
    defaultColor = '#ffffff',
}: FlowParticlesProps) {
    const { current: map } = useMap()
    const sourceId = `${id}-particles`

    // Pre-compute polyline geometry + cumulative lengths (only when lines change).
    const lines = useMemo<PreparedLine[]>(() => {
        return lineFeatures
            .map((f) => {
                const coords = f.geometry?.coordinates as number[][] | undefined
                if (!coords || coords.length < 2) return null
                const cumulative = [0]
                for (let j = 1; j < coords.length; j++) {
                    const dx = coords[j][0] - coords[j - 1][0]
                    const dy = coords[j][1] - coords[j - 1][1]
                    cumulative.push(cumulative[j - 1] + Math.hypot(dx, dy))
                }
                const total = cumulative[cumulative.length - 1]
                if (total <= 0) return null
                const props = (f.properties ?? {}) as Record<string, unknown>
                return {
                    coords,
                    cumulative,
                    total,
                    color: (props.color as string) || defaultColor,
                    speedMul: (props.speedMultiplier as number) || 1,
                }
            })
            .filter((l): l is PreparedLine => l !== null)
    }, [lineFeatures, defaultColor])

    // Imperative animation loop — pushes particle points each frame via setData.
    useEffect(() => {
        if (!visible || lines.length === 0 || !map) return

        let raf = 0
        const tick = (time: number) => {
            // Pause work while the tab is hidden (still re-arm so it resumes).
            if (document.hidden) {
                raf = requestAnimationFrame(tick)
                return
            }

            const src = map.getSource(sourceId) as GeoJSONSource | undefined
            if (src) {
                const features: GeoJSON.Feature[] = []
                const tSec = time / 1000

                for (let li = 0; li < lines.length; li++) {
                    const line = lines[li]
                    const cycle = tSec * speed * line.speedMul
                    for (let p = 0; p < packetsPerLine; p++) {
                        const head = ((cycle + p / packetsPerLine) % 1 + 1) % 1
                        for (let k = 0; k < tailLength; k++) {
                            const f = head - k * 0.012
                            if (f < 0) continue
                            const fade = 1 - k / tailLength
                            features.push({
                                type: 'Feature',
                                properties: {
                                    color: line.color,
                                    opacity: k === 0 ? 1 : fade * 0.6,
                                    radius: k === 0 ? 5 : Math.max(1.5, 4 - k * 0.7),
                                },
                                geometry: { type: 'Point', coordinates: pointAt(line, f) },
                            })
                        }
                    }
                }

                src.setData({ type: 'FeatureCollection', features })
            }
            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [visible, lines, map, sourceId, packetsPerLine, tailLength, speed])

    if (!visible || lines.length === 0) return null

    return (
        <Source id={sourceId} type="geojson" data={EMPTY_FC}>
            {/* Colored glow halo */}
            <Layer
                id={`${sourceId}-glow`}
                type="circle"
                paint={{
                    'circle-color': ['get', 'color'],
                    'circle-radius': ['*', ['get', 'radius'], 2.2],
                    'circle-opacity': ['*', ['get', 'opacity'], 0.35],
                    'circle-blur': 1,
                }}
            />
            {/* Bright white core */}
            <Layer
                id={`${sourceId}-core`}
                type="circle"
                paint={{
                    'circle-color': '#ffffff',
                    'circle-radius': ['get', 'radius'],
                    'circle-opacity': ['get', 'opacity'],
                    'circle-blur': 0.3,
                }}
            />
        </Source>
    )
}
