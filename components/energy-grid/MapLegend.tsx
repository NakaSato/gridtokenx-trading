'use client'

import { Zap, Battery, BatteryCharging } from 'lucide-react'

interface MapLegendProps {
    showZones?: boolean
}

// Zone colors matching ZonePolygonLayers
const ZONE_LEGEND = [
    { name: 'Zone 0', color: 'bg-red-500' },
    { name: 'Zone 1', color: 'bg-green-500' },
    { name: 'Zone 2', color: 'bg-blue-500' },
    { name: 'Zone 3', color: 'bg-purple-500' },
    { name: 'Zone 4', color: 'bg-amber-500' },
]

export function MapLegend({ showZones = true }: MapLegendProps) {
    return (
        <div className="from-background/95 to-background/90 absolute bottom-12 left-2 rounded border border-primary/30 bg-gradient-to-br p-2 text-xs shadow-xl backdrop-blur-md w-auto">
            <h4 className="mb-1 text-[10px] font-bold text-foreground">Nodes</h4>
            <div className="space-y-0.5">
                <div className="flex items-center gap-1 rounded p-0.5">
                    <div className="rounded-full border border-yellow-500/40 bg-yellow-500/20 p-0.5">
                        <Zap className="h-2 w-2 text-yellow-500" />
                    </div>
                    <span className="text-[9px] font-medium text-secondary-foreground">
                        Prosumer
                    </span>
                </div>
                <div className="flex items-center gap-1 rounded p-0.5">
                    <div className="rounded-full border border-green-500/40 bg-green-500/20 p-0.5">
                        <BatteryCharging className="h-2 w-2 text-green-500" />
                    </div>
                    <span className="text-[9px] font-medium text-secondary-foreground">
                        Storage
                    </span>
                </div>
                <div className="flex items-center gap-1 rounded p-0.5">
                    <div className="rounded-full border border-blue-500/40 bg-blue-500/20 p-0.5">
                        <Battery className="h-2 w-2 text-blue-500" />
                    </div>
                    <span className="text-[9px] font-medium text-secondary-foreground">
                        Consumer
                    </span>
                </div>
            </div>

            {/* Zone Colors Legend */}
            {showZones && (
                <>
                    <div className="my-1.5 border-t border-primary/20" />
                    <h4 className="mb-1 text-[10px] font-bold text-foreground">Zones</h4>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        {ZONE_LEGEND.map((zone) => (
                            <div key={zone.name} className="flex items-center gap-1 p-0.5">
                                <div className={`h-2 w-2 rounded-sm ${zone.color} opacity-60`} />
                                <span className="text-[9px] text-secondary-foreground">{zone.name}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-1 p-0.5 col-span-2">
                            <div className="h-2 w-2 rounded-sm bg-cyan-400 animate-pulse" />
                            <span className="text-[9px] text-secondary-foreground">Active Trading</span>
                        </div>
                    </div>
                </>
            )}

        </div>
    )
}
