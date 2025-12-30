'use client'

import { memo, useState, useCallback } from 'react'
import { Zap, Battery, BatteryCharging } from 'lucide-react'
import { Marker } from 'react-map-gl/mapbox'
import type { EnergyNode, LiveNodeData } from './types'

interface LightweightMarkerProps {
    node: EnergyNode
    liveData?: LiveNodeData
    isSelected: boolean
    onSelect: (node: EnergyNode) => void
    onDoubleClick: (node: EnergyNode) => void
}

// Get status color - simple inline function
const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'bg-green-500'
        case 'idle': return 'bg-yellow-500'
        case 'warning': return 'bg-orange-500'
        case 'critical': return 'bg-red-500'
        default: return 'bg-gray-500'
    }
}

// Simple inline icon component
const MarkerIcon = memo(({ type }: { type: string }) => {
    switch (type) {
        case 'generator':
            return <Zap className="h-3 w-3 text-yellow-500" />
        case 'storage':
            return <BatteryCharging className="h-3 w-3 text-green-500" />
        default:
            return <Battery className="h-3 w-3 text-blue-500" />
    }
})
MarkerIcon.displayName = 'MarkerIcon'

/**
 * Lightweight marker for maximum rendering performance
 * - No Popover/Accordion (heavy components)
 * - Minimal DOM nodes
 * - Simple click to select
 */
function LightweightMarkerComponent({
    node,
    liveData,
    isSelected,
    onSelect,
    onDoubleClick,
}: LightweightMarkerProps) {
    const status = liveData?.status ?? node.status

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onSelect(node)
    }, [node, onSelect])

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onDoubleClick(node)
    }, [node, onDoubleClick])

    return (
        <Marker longitude={node.longitude} latitude={node.latitude}>
            <div
                className={`relative cursor-pointer transition-transform duration-150 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}`}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                title={node.name}
            >
                {/* Status dot - top right */}
                <div
                    className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ${getStatusColor(status)} z-10 border border-background/50`}
                />
                {/* Main marker - simplified */}
                <div className={`rounded-full p-1.5 shadow-md backdrop-blur-sm transition-colors ${isSelected
                        ? 'bg-primary/90 border-2 border-primary'
                        : 'bg-background/80 border border-primary/40 hover:border-primary'
                    }`}>
                    <MarkerIcon type={node.type} />
                </div>
            </div>
        </Marker>
    )
}

// Export memoized version with strict equality check
export const LightweightMarker = memo(LightweightMarkerComponent, (prev, next) => {
    return (
        prev.node.id === next.node.id &&
        prev.isSelected === next.isSelected &&
        prev.liveData?.status === next.liveData?.status
    )
})

LightweightMarker.displayName = 'LightweightMarker'
