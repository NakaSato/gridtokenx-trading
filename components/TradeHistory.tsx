'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthProvider'
import { History, TrendingUp, BarChart3, Globe, AlertOctagon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import type { TradeRecord } from '@/types/trading'

// Compact relative time: "39m", "2h", "3d", "5mo", "1y"
function shortTimeAgo(date: Date): string {
    const s = Math.floor((Date.now() - date.getTime()) / 1000)
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    const d = Math.floor(h / 24)
    if (d < 30) return `${d}d`
    const mo = Math.floor(d / 30)
    if (mo < 12) return `${mo}mo`
    return `${Math.floor(mo / 12)}y`
}

/** Terminal settlement state: the worker exhausted its retries and parked the row. */
const PERMANENTLY_FAILED = 'permanently_failed'

const TradeHistory = React.memo(function TradeHistory() {
    const { token } = useAuth()
    const [trades, setTrades] = useState<TradeRecord[]>([])
    const [loading, setLoading] = useState(true)

    const { socket } = useSocket()

    const fetchTrades = async () => {
        if (!token) {
            setLoading(false)
            return
        }

        try {
            defaultApiClient.setToken(token)
            const response = await defaultApiClient.getTrades({ limit: 20 })
            if (response.data) {
                setTrades(response.data.trades || [])
            }
        } catch (error) {
            console.error('Failed to fetch trades:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!token) {
            setTrades([])
            setLoading(false)
            return
        }

        fetchTrades()
        const interval = setInterval(fetchTrades, 10000)

        if (socket) {
            const handleMessage = (event: MessageEvent) => {
                try {
                    const message = JSON.parse(event.data)
                    if (message.type === 'trade_executed') {
                        fetchTrades()
                    }
                } catch (e) { }
            }
            socket.addEventListener('message', handleMessage)
            return () => {
                socket.removeEventListener('message', handleMessage)
                clearInterval(interval)
            }
        }

        return () => clearInterval(interval)
    }, [socket, token])

    if (loading) {
        return (
            <Card className="h-full border-0 shadow-none">
                <CardHeader className="pb-2 border-b border-border/50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        Recent Trades
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                    <div className="space-y-1">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center gap-2 px-3 py-1.5 rounded-sm bg-secondary/30">
                                <div className="h-4 w-9 bg-secondary rounded-sm" />
                                <div className="h-3 w-16 bg-secondary rounded" />
                                <div className="h-3 w-12 bg-secondary rounded" />
                                <div className="h-4 w-14 bg-secondary rounded-sm" />
                                <div className="ml-auto h-3 w-14 bg-secondary rounded" />
                                <div className="h-3 w-12 bg-secondary rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex h-full flex-col border-0 shadow-none">
            <CardHeader className="py-3 px-4 border-b border-border/40">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <History className="h-3.5 w-3.5" />
                        Market Activity
                    </span>
                    {trades.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-medium text-foreground uppercase tracking-widest">{trades.length} Trades</span>
                        </div>
                    )}
                </CardTitle>
            </CardHeader>

            {/* Market Statistics Bar */}
            <div className="px-4 py-3 bg-accent/20 border-b border-border/30 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                        <TrendingUp className="h-2.5 w-2.5 text-primary" /> VWAP (24H)
                    </p>
                    <div className="text-sm font-black font-mono">
                        ฿{(trades.reduce((acc, t) => acc + (parseFloat(t.price) * parseFloat(t.quantity)), 0) /
                            trades.reduce((acc, t) => acc + parseFloat(t.quantity), 0) || 0).toFixed(2)}
                    </div>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest flex items-center justify-end gap-1">
                        <BarChart3 className="h-2.5 w-2.5 text-purple-500" /> Volume
                    </p>
                    <div className="text-sm font-black font-mono">
                        {trades.reduce((acc, t) => acc + parseFloat(t.quantity), 0).toFixed(1)} <span className="text-[9px] font-normal uppercase text-muted-foreground">kWh</span>
                    </div>
                </div>
            </div>

            <CardContent className="flex-1 overflow-y-auto p-0">
                {trades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3">
                        <div className="p-3 rounded-full bg-accent/50">
                            <TrendingUp className="h-6 w-6 opacity-50" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-foreground">No trades yet</p>
                            <p className="text-xs opacity-70">Market is quiet</p>
                        </div>
                    </div>
                ) : (
                    <TooltipProvider delayDuration={150}>
                    <div className="divide-y divide-border/30">
                        {trades.map((trade, idx) => {
                            const isBuyer = trade.role === 'buyer'
                            // Calculate extra costs if available (only relevant for buyer usually, or net for seller)
                            const fees = (parseFloat(trade.wheeling_charge || '0') || 0) + (parseFloat(trade.loss_cost || '0') || 0);
                            const isPermanentlyFailed = trade.status === PERMANENTLY_FAILED
                            const isSuccess = trade.status === 'confirmed' || trade.status === 'completed'

                            return (
                                <div
                                    key={trade.id}
                                    className="group flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 hover:bg-accent/30 transition-colors"
                                >
                                    {/* Left group: trade meta — wraps as a unit, never overflows */}
                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "shrink-0 text-[9px] px-1.5 py-0 h-4 font-mono font-bold tracking-tight border-opacity-40",
                                            isBuyer
                                                ? "bg-green-500/10 text-green-500 border-green-500"
                                                : "bg-red-500/10 text-red-500 border-red-500"
                                        )}
                                    >
                                        {isBuyer ? 'BUY' : 'SELL'}
                                    </Badge>

                                    {/* Zone Badge */}
                                    {(trade.buyer_zone_id !== undefined && trade.seller_zone_id !== undefined) && (
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "shrink-0 text-[9px] px-1.5 py-0 h-4 font-normal tracking-tight",
                                                trade.buyer_zone_id === trade.seller_zone_id
                                                    ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                                    : "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                                            )}
                                        >
                                            {trade.buyer_zone_id === trade.seller_zone_id ? 'LOCAL' : 'X-ZONE'}
                                        </Badge>
                                    )}

                                    <span className="shrink-0 text-xs font-medium font-mono text-foreground tabular-nums">
                                        {parseFloat(trade.quantity).toFixed(2)}
                                        <span className="text-[9px] text-muted-foreground ml-0.5">kWh</span>
                                    </span>

                                    <span className="shrink-0 text-[11px] text-muted-foreground font-mono tabular-nums">
                                        @{parseFloat(trade.price).toFixed(2)}
                                    </span>

                                    {fees > 0 && (
                                        <span className="shrink-0 text-[9px] text-muted-foreground opacity-70 tabular-nums">
                                            +{fees.toFixed(2)} fees
                                        </span>
                                    )}

                                    {/* Status Badge — only for in-flight or non-terminal failure states.
                                        Success needs no badge (the row itself means the trade settled);
                                        terminal failure collapses to the diagnostics icon below. */}
                                    {!isPermanentlyFailed && !isSuccess && (
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "shrink-0 text-[9px] px-1.5 py-0 h-4 font-normal tracking-tight border-opacity-40",
                                                trade.status === 'failed'
                                                    ? "bg-destructive/10 text-destructive border-destructive"
                                                    : "bg-amber-500/10 text-amber-500 border-amber-500"
                                            )}
                                        >
                                            {trade.status.toUpperCase()}
                                        </Badge>
                                    )}

                                    {/* Terminal failures collapse to one icon; it carries both the state
                                        and the settlement worker's diagnostics on hover. */}
                                    {isPermanentlyFailed && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    aria-label="Settlement permanently failed — show diagnostics"
                                                    className="shrink-0 rounded-sm text-destructive hover:text-destructive/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
                                                >
                                                    <AlertOctagon className="h-3.5 w-3.5" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="top"
                                                align="start"
                                                className="max-w-xs space-y-1 bg-popover text-popover-foreground border border-destructive/40"
                                            >
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">
                                                    Settlement permanently failed
                                                </p>
                                                <p className="font-mono text-[11px] leading-snug break-words">
                                                    {trade.error_message || 'No error message recorded.'}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Retries: {trade.retry_count ?? 0} · Trade {trade.id.slice(0, 8)}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}

                                    </div>

                                    {/* Right group: own line — time on the left, value on the right */}
                                    <div className="flex w-full shrink-0 items-center justify-between gap-x-2">
                                    <span className="shrink-0 whitespace-nowrap text-[10px] text-muted-foreground tabular-nums">
                                        {shortTimeAgo(new Date(trade.executed_at))} ago
                                    </span>

                                    <span className={cn(
                                        "shrink-0 font-mono text-base font-medium tabular-nums",
                                        isBuyer ? "text-red-500" : "text-green-500"
                                    )}>
                                        {isBuyer ? '-' : '+'}{parseFloat(trade.total_value).toFixed(2)}
                                        <span className="text-[10px] text-muted-foreground ml-0.5">THBC</span>
                                    </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    </TooltipProvider>
                )}
            </CardContent>
        </Card>
    )
})

export default TradeHistory
