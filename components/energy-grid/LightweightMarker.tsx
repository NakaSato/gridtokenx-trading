'use client'

import { memo, useCallback } from 'react'
import { Zap, Battery, BatteryCharging, ShoppingCart } from 'lucide-react'
import { Marker } from 'react-map-gl/mapbox'
import type { EnergyNode, LiveNodeData } from './types'

interface LightweightMarkerProps {
    node: EnergyNode
    liveData?: LiveNodeData
    isSelected: boolean
    onSelect: (node: EnergyNode) => void
    onDoubleClick: (node: EnergyNode) => void
    onTradeClick?: (node: EnergyNode) => void
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
 * - Trade button when selected
 */
function LightweightMarkerComponent({
    node,
    liveData,
    isSelected,
    onSelect,
    onDoubleClick,
    onTradeClick,
}: LightweightMarkerProps) {
    const status = liveData?.status ?? node.status
    const liveValue = liveData?.currentValue ?? 0

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onSelect(node)
    }, [node, onSelect])

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onDoubleClick(node)
    }, [node, onDoubleClick])

    const handleTradeClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onTradeClick?.(node)
    }, [node, onTradeClick])

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

                {/* Selected Node Action Card */}
                {isSelected && (
                    <div
                        className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-background/95 backdrop-blur-md border border-primary/40 rounded-lg p-2 shadow-xl min-w-[140px]">
                            <p className="text-xs font-medium text-foreground truncate mb-1">{node.name}</p>
                            <p className="text-[10px] text-secondary-foreground mb-2">
                                {node.type === 'storage'
                                    ? `${liveValue.toFixed(0)}% charged`
                                    : `${liveValue.toFixed(1)} kW`}
                            </p>
                            {onTradeClick && (
                                <button
                                    onClick={handleTradeClick}
                                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    <ShoppingCart className="h-3 w-3" />
                                    Trade
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Marker>
    )
}

// Export memoized version with strict equality check
export const LightweightMarker = memo(LightweightMarkerComponent, (prev, next) => {
    return (
        prev.node.id === next.node.id &&
        prev.isSelected === next.isSelected &&
        prev.liveData?.status === next.liveData?.status &&
        prev.liveData?.currentValue === next.liveData?.currentValue
    )
})

LightweightMarker.displayName = 'LightweightMarker'

