'use client'

import { Zap, Battery, BatteryCharging } from 'lucide-react'

interface MapLegendProps {
    showFlowLines: boolean
}

export function MapLegend({ showFlowLines }: MapLegendProps) {
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

            {/* Energy Flow Legend */}
            {showFlowLines && (
                <>
                    <div className="my-1.5 border-t border-primary/20" />
                    <h4 className="mb-1 text-[10px] font-bold text-foreground">Power Flow</h4>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 p-0.5">
                            <div className="h-0.5 w-4 rounded bg-green-500" />
                            <span className="text-[9px] text-secondary-foreground">≥300 kW</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-0.5">
                            <div className="h-0.5 w-4 rounded bg-yellow-500" />
                            <span className="text-[9px] text-secondary-foreground">200-299 kW</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-0.5">
                            <div className="h-0.5 w-4 rounded bg-orange-500" />
                            <span className="text-[9px] text-secondary-foreground">100-199 kW</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-0.5">
                            <div className="h-0.5 w-4 rounded bg-red-500" />
                            <span className="text-[9px] text-secondary-foreground">&lt;100 kW</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

