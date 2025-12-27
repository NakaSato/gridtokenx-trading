'use client'

import { Zap, Battery, BatteryCharging } from 'lucide-react'

interface GridStatsPanelProps {
    totalGeneration: number
    totalConsumption: number
    avgStorage: number
}

export function GridStatsPanel({
    totalGeneration,
    totalConsumption,
    avgStorage,
}: GridStatsPanelProps) {
    const netBalance = totalGeneration - totalConsumption

    return (
        <div className="from-background/95 to-background/90 absolute bottom-8 right-2 rounded border border-primary/30 bg-gradient-to-br p-2 text-xs shadow-xl backdrop-blur-md">
            <div className="mb-1 flex items-center justify-between gap-4">
                <h4 className="text-[10px] font-bold text-foreground">Grid Status</h4>
                <span className="flex items-center gap-1 text-[9px] text-green-500">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-green-500" />
                    Live
                </span>
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5 text-yellow-500" />
                        <span className="text-secondary-foreground">Generation:</span>
                    </div>
                    <span className="font-bold text-yellow-500 transition-all duration-500">
                        {totalGeneration.toFixed(0)} kW
                    </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-1">
                        <Battery className="h-2.5 w-2.5 text-blue-500" />
                        <span className="text-secondary-foreground">Consumption:</span>
                    </div>
                    <span className="font-bold text-blue-500 transition-all duration-500">
                        {totalConsumption.toFixed(0)} kW
                    </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-1">
                        <BatteryCharging className="h-2.5 w-2.5 text-green-500" />
                        <span className="text-secondary-foreground">Storage Avg:</span>
                    </div>
                    <span className="font-bold text-green-500 transition-all duration-500">
                        {avgStorage.toFixed(1)}%
                    </span>
                </div>
                <div className="mt-1 border-t border-primary/20 pt-1">
                    <div className="flex items-center justify-between">
                        <span className="text-secondary-foreground">Net Balance:</span>
                        <span
                            className={`font-bold transition-all duration-500 ${netBalance >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}
                        >
                            {netBalance >= 0 ? '+' : ''}
                            {netBalance.toFixed(0)} kW
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
