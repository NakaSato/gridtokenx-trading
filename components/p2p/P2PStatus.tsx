'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { defaultApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import {
    Activity,
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    Database,
    Zap,
    RefreshCw,
    Radio
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useOrderMatchedWebSocket } from '@/hooks/useWebSocket'
import { useP2POrderUpdates, useSettlementUpdates } from '@/hooks/useTransactionUpdates'

export default function P2PStatus() {
    const { token } = useAuth()
    const [matchingStatus, setMatchingStatus] = useState<any>(null)
    const [settlementStats, setSettlementStats] = useState<any>(null)
    const [loading, setLoading] = useState(false)
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
        <div className="space-y-4">
            {/* Real-time Connection Status */}
            <div className="flex items-center justify-end gap-2 text-xs">
                <Radio className={cn(
                    "h-3 w-3",
                    isRealTimeConnected ? "text-green-500 animate-pulse" : "text-secondary-foreground"
                )} />
                <span className={cn(
                    isRealTimeConnected ? "text-green-500" : "text-secondary-foreground"
                )}>
                    {isRealTimeConnected ? "Live Updates" : "Polling"}
                </span>
            </div>

            {/* Matching Engine Status */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Matching Engine
                        </div>
                        <Badge variant={matchingStatus?.can_match ? "default" : "secondary"} className={cn(
                            "text-[10px]",
                            matchingStatus?.can_match ? "bg-green-500/15 text-green-500 hover:bg-green-500/25" : "bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25"
                        )}>
                            {matchingStatus?.can_match ? "Matching Active" : "Waiting for Setup"}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="bg-secondary/30 rounded p-2">
                            <div className="text-xs text-secondary-foreground mb-1">Buy Orders</div>
                            <div className="font-mono text-lg font-bold text-green-500">{matchingStatus?.pending_buy_orders || 0}</div>
                            <div className="text-[10px] text-secondary-foreground">
                                Max: ฿{matchingStatus?.buy_price_range?.max?.toFixed(2) || '0.00'}
                            </div>
                        </div>
                        <div className="bg-secondary/30 rounded p-2">
                            <div className="text-xs text-secondary-foreground mb-1">Matches</div>
                            <div className="font-mono text-lg font-bold text-primary">{matchingStatus?.pending_matches || 0}</div>
                            <div className="text-[10px] text-secondary-foreground">Pending</div>
                        </div>
                        <div className="bg-secondary/30 rounded p-2">
                            <div className="text-xs text-secondary-foreground mb-1">Sell Orders</div>
                            <div className="font-mono text-lg font-bold text-red-500">{matchingStatus?.pending_sell_orders || 0}</div>
                            <div className="text-[10px] text-secondary-foreground">
                                Min: ฿{matchingStatus?.sell_price_range?.min?.toFixed(2) || '0.00'}
                            </div>
                        </div>
                    </div>

                    {!matchingStatus?.can_match && matchingStatus?.match_reason && (
                        <div className="text-[10px] text-secondary-foreground bg-secondary/20 p-2 rounded flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 mt-0.5" />
                            {matchingStatus.match_reason}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Settlement Status */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-blue-500" />
                            Settlements (24h)
                        </div>
                        <span className="text-[10px] text-secondary-foreground font-normal flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin duration-[5000ms]" />
                            {lastUpdated.toLocaleTimeString()}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-secondary-foreground flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-500" /> Completed
                            </span>
                            <span className="font-mono">{settlementStats?.confirmed_count || 0}</span>
                        </div>
                        <Progress value={
                            ((settlementStats?.confirmed_count || 0) / (
                                (settlementStats?.confirmed_count || 0) +
                                (settlementStats?.failed_count || 0) +
                                (settlementStats?.pending_count || 0) + 0.0001
                            )) * 100
                        } className="h-1.5 bg-secondary" indicatorClassName="bg-green-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="flex flex-col gap-1 bg-secondary/20 p-2 rounded">
                            <span className="text-[10px] text-secondary-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3 text-yellow-500" /> Pending
                            </span>
                            <span className="font-mono text-sm font-medium">{settlementStats?.pending_count || 0}</span>
                        </div>
                        <div className="flex flex-col gap-1 bg-secondary/20 p-2 rounded">
                            <span className="text-[10px] text-secondary-foreground flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 text-red-500" /> Failed
                            </span>
                            <span className="font-mono text-sm font-medium">{settlementStats?.failed_count || 0}</span>
                        </div>
                    </div>

                    {settlementStats?.total_settled_value > 0 && (
                        <div className="pt-2 border-t mt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-secondary-foreground">Total Settled Value</span>
                                <span className="font-mono text-sm font-bold text-primary">
                                    ฿{settlementStats.total_settled_value.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
