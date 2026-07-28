'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, Gauge } from 'lucide-react'
import { format } from 'date-fns'

interface MeterHeaderProps {
    meterCount: number
    lastRefreshed: Date | null
    refreshing: boolean
    onRefresh: () => void
    onRegister: () => void
}

export function MeterHeader({
    meterCount,
    lastRefreshed,
    refreshing,
    onRefresh,
    onRegister,
}: MeterHeaderProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Icon + meter count */}
                <div className="flex items-center gap-2.5 rounded-lg border bg-gradient-to-br from-muted/60 to-muted/20 px-3 py-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold tabular-nums leading-none">{meterCount}</span>
                        <span className="text-xs text-muted-foreground">
                            {meterCount === 1 ? 'meter' : 'meters'}
                        </span>
                    </div>
                </div>

                {/* Sync status */}
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    {refreshing ? (
                        <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            <span className="text-muted-foreground">Syncing…</span>
                        </>
                    ) : lastRefreshed ? (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                            </span>
                            <span className="text-muted-foreground">Synced</span>
                            <span className="font-mono tabular-nums" title={lastRefreshed.toLocaleString()}>
                                {format(lastRefreshed, 'HH:mm:ss')}
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="h-2 w-2 rounded-full bg-yellow-500" />
                            <span className="text-muted-foreground">Connecting…</span>
                        </>
                    )}
                </div>

            {/* Actions */}
            <div className="flex flex-none gap-2 sm:ml-auto">
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
                <Button size="sm" onClick={onRegister}>
                    <Plus className="mr-2 h-4 w-4" />
                    Register Meter
                </Button>
            </div>
        </div>
    )
}

export const MemoizedMeterHeader = React.memo(MeterHeader)
