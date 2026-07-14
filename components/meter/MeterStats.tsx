import React from 'react'
import { Card } from '@/components/ui/card'
import { Zap, Activity, BatteryCharging, CheckCircle2, Coins } from 'lucide-react'
import { format } from 'date-fns'

interface MeterStatsProps {
    totalGenerated: number
    totalMinted: number
    mintedCount: number
    pendingToMint: number
    pendingCount: number
    netEnergy: number
    meterCount: number
    lastUpdate: Date | null
    lastRefreshed: Date | null
}

export function MeterStats({
    totalGenerated,
    totalMinted,
    mintedCount,
    pendingToMint,
    pendingCount,
    netEnergy,
    meterCount,
    lastUpdate,
    lastRefreshed
}: MeterStatsProps) {
    return (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {/* Total Generation */}
            <Card className="p-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Total Generation</span>
                    <Zap className="h-4 w-4 text-green-500" />
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{totalGenerated.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">kWh</span></div>
                <p className="text-[10px] text-muted-foreground">Lifetime production</p>
            </Card>

            {/* Minted Tokens */}
            <Card className="p-3 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800/50">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Minted Tokens</span>
                    <Coins className="h-4 w-4 text-green-400" />
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-green-400">{totalMinted.toFixed(2)} <span className="text-sm font-normal text-green-400/70">GRX</span></div>
                <p className="text-[10px] text-muted-foreground">{mintedCount} readings minted</p>
            </Card>

            {/* Pending Mints */}
            <Card className={`p-3 ${pendingCount > 0 ? "bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-800/50" : ""}`}>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Pending Mints</span>
                    <Activity className="h-4 w-4 text-yellow-500" />
                </div>
                <div className={`mt-1 text-2xl font-bold tabular-nums ${pendingCount > 0 ? 'text-yellow-400' : ''}`}>
                    {pendingToMint.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">kWh</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{pendingCount} ready to mint</p>
            </Card>

            {/* Net Energy */}
            <Card className="p-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Net Energy</span>
                    <BatteryCharging className="h-4 w-4 text-blue-500" />
                </div>
                <div className={`mt-1 text-2xl font-bold tabular-nums ${netEnergy >= 0 ? 'text-green-500' : 'text-orange-500'}`}>
                    {netEnergy > 0 ? '+' : ''}{netEnergy.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">kWh</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Generation − Consumption</p>
            </Card>

            {/* Active Meters */}
            <Card className="p-3 col-span-2 md:col-span-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Active Meters</span>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{meterCount}</div>
                <p className="flex items-center gap-1 text-[10px] text-green-600/80">
                    {lastRefreshed ? (
                        <>
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                            </span>
                            Synced {format(lastRefreshed, 'HH:mm:ss')}
                        </>
                    ) : lastUpdate ? `Last: ${format(lastUpdate, 'HH:mm')}` : 'Syncing…'}
                </p>
            </Card>
        </div>
    )
}

export const MemoizedMeterStats = React.memo(MeterStats)
