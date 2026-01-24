'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { defaultApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import {
    Activity,
    CheckCircle2,
    Clock,
    AlertCircle,
    Database,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useOrderMatchedWebSocket } from '@/hooks/useWebSocket'
import { useP2POrderUpdates, useSettlementUpdates } from '@/hooks/useTransactionUpdates'

// Matching engine status from API
interface MatchingStatus {
    can_match: boolean
    match_reason?: string
    pending_buy_orders: number
    pending_sell_orders: number
    pending_matches: number
    buy_price_range?: { min: number; max: number }
    sell_price_range?: { min: number; max: number }
}

// Settlement statistics from API
interface SettlementStats {
    confirmed_count: number
    pending_count: number
    failed_count: number
    total_settled_value: number
}

const P2PStatus = React.memo(function P2PStatus() {
    const { token } = useAuth()
    const [matchingStatus, setMatchingStatus] = useState<MatchingStatus | null>(null)
    const [settlementStats, setSettlementStats] = useState<SettlementStats | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

    // Real-time P2P order updates
    const { connected: p2pConnected, latestUpdate: latestOrderUpdate } = useP2POrderUpdates({
        showToasts: false, // Handle in parent component
    })

    // Real-time settlement updates
    const { connected: settlementConnected, latestSettlement } = useSettlementUpdates({
        showToasts: false,
    })

    const isRealTimeConnected = p2pConnected || settlementConnected

    const fetchData = useCallback(async () => {
        if (!token) return

        try {
            defaultApiClient.setToken(token)
            const [matchRes, settleRes] = await Promise.all([
                defaultApiClient.getMatchingStatus(),
                defaultApiClient.getSettlementStats()
            ])

            if (matchRes.data) setMatchingStatus(matchRes.data)
            if (settleRes.data) setSettlementStats(settleRes.data)
            setLastUpdated(new Date())
        } catch (error) {
            console.error('Failed to fetch P2P status:', error)
        }
    }, [token])

    // Initial fetch
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Poll every 10 seconds (increased from 5s since we have WebSocket)
    useEffect(() => {
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [fetchData])

    // Refresh on WebSocket updates
    useEffect(() => {
        if (latestOrderUpdate || latestSettlement) {
            fetchData()
        }
    }, [latestOrderUpdate, latestSettlement, fetchData])

    // Listen for legacy WebSocket updates
    useOrderMatchedWebSocket(() => {
        fetchData()
    }, token || undefined)

    if (!token) return null

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Real-time Connection Status */}
            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">System Status</span>
                <div className="flex items-center gap-1.5">
                    <div className="relative flex h-2 w-2">
                        <span className={cn(
                            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                            isRealTimeConnected ? "bg-emerald-500" : "bg-amber-500"
                        )}></span>
                        <span className={cn(
                            "relative inline-flex rounded-full h-2 w-2",
                            isRealTimeConnected ? "bg-emerald-500" : "bg-amber-500"
                        )}></span>
                    </div>
                    <span className={cn(
                        "text-[10px] font-medium",
                        isRealTimeConnected ? "text-emerald-500" : "text-amber-500"
                    )}>
                        {isRealTimeConnected ? "Live" : "Polling"}
                    </span>
                </div>
            </div>

            {/* Matching Engine Status */}
            <Card className="rounded-sm border-border bg-card shadow-sm overflow-hidden group hover:border-primary/20 transition-colors duration-300">
                <CardHeader className="pb-3 pt-3 px-3 border-b border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-sm bg-primary/10 text-primary">
                                <Zap className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-semibold">Matching Engine</span>
                        </div>
                        <Badge variant="outline" className={cn(
                            "text-[10px] h-5 px-1.5 font-normal border-0 rounded-sm",
                            matchingStatus?.can_match
                                ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20"
                                : "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20"
                        )}>
                            {matchingStatus?.can_match ? "Active" : "Paused"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-3">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="flex flex-col gap-1 p-2 rounded-sm bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
                            <span className="text-[10px] uppercase text-muted-foreground font-medium flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-emerald-500" /> Buy
                            </span>
                            <span className="font-mono text-base font-bold text-emerald-500 lining-nums">
                                {matchingStatus?.pending_buy_orders || 0}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 p-2 rounded-sm bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors items-center text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                            <span className="text-[10px] uppercase text-muted-foreground font-medium flex items-center gap-1 relative z-10">
                                <ArrowRightLeft className="h-3 w-3 text-primary" /> Match
                            </span>
                            <span className="font-mono text-base font-bold text-primary lining-nums relative z-10">
                                {matchingStatus?.pending_matches || 0}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 p-2 rounded-sm bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors items-end text-right">
                            <span className="text-[10px] uppercase text-muted-foreground font-medium flex items-center gap-1">
                                Sell <TrendingDown className="h-3 w-3 text-destructive" />
                            </span>
                            <span className="font-mono text-base font-bold text-destructive lining-nums">
                                {matchingStatus?.pending_sell_orders || 0}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
                        <span>Max Buy: <span className="font-mono text-foreground">฿{matchingStatus?.buy_price_range?.max?.toFixed(2) || '0.00'}</span></span>
                        <span className="w-px h-3 bg-border mx-1"></span>
                        <span>Min Sell: <span className="font-mono text-foreground">฿{matchingStatus?.sell_price_range?.min?.toFixed(2) || '0.00'}</span></span>
                    </div>

                    {!matchingStatus?.can_match && matchingStatus?.match_reason && (
                        <div className="mt-3 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-sm flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="leading-tight">{matchingStatus.match_reason}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Settlement Status */}
            <Card className="rounded-sm border-border bg-card shadow-sm group hover:border-primary/20 transition-colors duration-300">
                <CardHeader className="pb-3 pt-3 px-3 border-b border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-sm bg-blue-500/10 text-blue-500">
                                <Database className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-semibold">Settlements (24h)</span>
                        </div>
                        <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" style={{ animationDuration: '3000ms' }} />
                    </div>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                    <div className="flex items-baseline justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground">Total Volume</span>
                        <span className="text-sm font-bold font-mono tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                            ฿{(settlementStats?.total_settled_value ?? 0).toFixed(2)}
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-emerald-500 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Confirmed
                            </span>
                            <span className="font-mono font-medium">{settlementStats?.confirmed_count || 0}</span>
                        </div>
                        <div className="relative h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500 ease-out"
                                style={{
                                    width: `${((settlementStats?.confirmed_count || 0) / (
                                        (settlementStats?.confirmed_count || 0) +
                                        (settlementStats?.failed_count || 0) +
                                        (settlementStats?.pending_count || 0) + 0.0001
                                    )) * 100}%`
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between p-1.5 rounded-sm bg-amber-500/5 border border-amber-500/10">
                            <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Pending
                            </span>
                            <span className="font-mono text-xs font-medium">{settlementStats?.pending_count || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-sm bg-destructive/5 border border-destructive/10">
                            <span className="text-[10px] text-destructive dark:text-destructive-foreground font-medium flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Failed
                            </span>
                            <span className="font-mono text-xs font-medium">{settlementStats?.failed_count || 0}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end pr-1">
                <span className="text-[9px] text-muted-foreground/50 font-mono">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
            </div>
        </div>
    )
})

export default P2PStatus
