'use client'

import { useState, useEffect } from 'react'
import { Zap, Battery, BatteryCharging, Leaf, Activity, ChevronUp, ChevronDown } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface GridHistoryPoint {
    timestamp: string
    total_generation: number
    total_consumption: number
}

interface GridStatsPanelProps {
    totalGeneration: number
    totalConsumption: number
    avgStorage: number
    co2Saved?: number
    activeMeters?: number
}

export function GridStatsPanel({
    totalGeneration,
    totalConsumption,
    avgStorage,
    co2Saved = 0,
    activeMeters = 0,
}: GridStatsPanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [history, setHistory] = useState<GridHistoryPoint[]>([])

    const netBalance = totalGeneration - totalConsumption
    const totalLoad = totalGeneration + totalConsumption
    const balancePercentage = totalLoad > 0 ? (totalGeneration / totalLoad) * 100 : 50

    // Fetch history on mount and periodic updates
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
                const response = await fetch(`${baseUrl}/api/v1/public/grid-status/history?limit=30`)
                if (response.ok) {
                    const data = await response.json()
                    // Recharts likes chronological order
                    setHistory(data.reverse())
                }
            } catch (error) {
                console.error('Failed to fetch grid history:', error)
            }
        }

        fetchHistory()
        const interval = setInterval(fetchHistory, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [])

    return (
        <div
            className={`absolute bottom-8 right-4 overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-in-out hover:border-white/20 ${isCollapsed ? 'w-48 p-3' : 'w-64 p-4'
                }`}
        >
            {/* Header - Clickable to toggle */}
            {/* Header - Clickable to toggle */}
            <button
                type="button"
                className={`flex w-full items-center justify-between group appearance-none focus:outline-none ${!isCollapsed ? 'mb-4 border-b border-white/5 pb-2' : ''}`}
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-expanded={!isCollapsed}
                aria-controls="grid-stats-content"
                aria-label={isCollapsed ? "Expand grid statistics" : "Collapse grid statistics"}
            >
                <div className="flex items-center gap-2">
                    <Activity className={`transition-colors duration-300 ${isCollapsed ? 'h-3.5 w-3.5 text-blue-400/70' : 'h-4 w-4 text-blue-400'}`} />
                    <h4 className={`font-bold uppercase tracking-wider text-white/90 transition-all ${isCollapsed ? 'text-[10px]' : 'text-sm'}`}>
                        Grid Status
                    </h4>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-white/30 group-hover:text-white/60 transition-colors">
                        {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                </div>
            </button>

            {/* Metrics Content */}
            <div className={`space-y-3 transition-all duration-500 ${isCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[800px] opacity-100'}`}>
                {/* Visual Chart - Historical Trends */}
                <div className="h-24 w-full bg-white/5 rounded-lg p-1 border border-white/5 mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history.length > 0 ? history : []}>
                            <defs>
                                <linearGradient id="genGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="consGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="total_generation"
                                stroke="#facc15"
                                fillOpacity={1}
                                fill="url(#genGradient)"
                                strokeWidth={1}
                                isAnimationActive={false}
                            />
                            <Area
                                type="monotone"
                                dataKey="total_consumption"
                                stroke="#60a5fa"
                                fillOpacity={1}
                                fill="url(#consGradient)"
                                strokeWidth={1}
                                isAnimationActive={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', fontSize: '10px' }}
                                itemStyle={{ padding: '0px' }}
                                labelStyle={{ display: 'none' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Generation */}
                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 text-white/60">
                            <Zap className="h-3.5 w-3.5 text-yellow-400" />
                            <span>Generation</span>
                        </div>
                        <span className="font-mono font-bold text-yellow-400">
                            {totalGeneration.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px]">kW</span>
                        </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full bg-yellow-400/80 transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(100, (totalGeneration / 500) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Consumption */}
                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 text-white/60">
                            <Battery className="h-3.5 w-3.5 text-blue-400" />
                            <span>Consumption</span>
                        </div>
                        <span className="font-mono font-bold text-blue-400">
                            {totalConsumption.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px]">kW</span>
                        </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full bg-blue-400/80 transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(100, (totalConsumption / 500) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Balance Progress Bar */}
                <div className="pt-1">
                    <div className="flex justify-between text-[10px] text-white/40 mb-1 uppercase tracking-widest font-bold">
                        <span>Load Balance</span>
                        <span className={netBalance >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {netBalance >= 0 ? '+' : ''}{Math.round(netBalance)} kW
                        </span>
                    </div>
                    <div className="relative h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                            className={`absolute inset-y-0 h-full transition-all duration-700 ease-in-out ${netBalance >= 0 ? 'bg-green-500/60' : 'bg-red-500/60'
                                }`}
                            style={{
                                left: netBalance >= 0 ? '50%' : `${balancePercentage}%`,
                                width: `${Math.abs(50 - balancePercentage)}%`
                            }}
                        />
                        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/20 transform -translate-x-1/2" />
                    </div>
                </div>

                {/* Secondary Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-white/40">
                            <BatteryCharging className="h-3 w-3 text-emerald-400" />
                            <span className="text-[9px] uppercase font-bold tracking-tighter">Storage</span>
                        </div>
                        <span className="text-xs font-bold text-white/90">{avgStorage.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-white/40">
                            <Leaf className="h-3 w-3 text-green-400" />
                            <span className="text-[9px] uppercase font-bold tracking-tighter">CO₂ Saved</span>
                        </div>
                        <span className="text-xs font-bold text-white/90">~{co2Saved.toFixed(2)} <span className="text-[8px] text-white/40 font-normal">kg</span></span>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-1 text-[9px] text-white/30 italic">
                    <span>{activeMeters} Active Meters</span>
                    <span>v2.2.0-analytics</span>
                </div>
            </div>

            {/* Collapsed Mini-Stats (visible only when collapsed) */}
            {isCollapsed && (
                <div
                    className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 animate-in fade-in slide-in-from-top-1 duration-300"
                    onClick={(e) => { e.stopPropagation(); setIsCollapsed(false); }}
                >
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-tighter text-white/30 font-bold">Net</span>
                        <span className={`text-[10px] font-mono font-bold ${netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {netBalance >= 0 ? '+' : ''}{Math.round(netBalance)} <span className="text-[8px] opacity-50">kW</span>
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] uppercase tracking-tighter text-white/30 font-bold">Active</span>
                        <span className="text-[10px] font-mono font-bold text-white/80">{activeMeters}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
