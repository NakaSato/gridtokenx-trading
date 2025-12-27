'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { formatDistanceToNow } from 'date-fns'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthProvider'
import { History, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Trade {
    id: string
    quantity: string
    price: string
    total_value: string
    role: 'buyer' | 'seller'
    counterparty_id: string
    executed_at: string
    status: string
}

export default function TradeHistory() {
    const { token } = useAuth()
    const [trades, setTrades] = useState<Trade[]>([])
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
            <Card className="h-full border border-border">
                <CardHeader className="pb-2 border-b border-border/50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        Recent Trades
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                    <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse flex justify-between items-center p-2 rounded-sm bg-secondary/30">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-secondary rounded-sm" />
                                    <div className="space-y-1">
                                        <div className="h-3 bg-secondary w-20 rounded" />
                                        <div className="h-2 bg-secondary w-14 rounded" />
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="h-3 bg-secondary w-16 rounded" />
                                    <div className="h-2 bg-secondary w-12 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full flex flex-col border border-border">
            <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        Recent Trades
                        {trades.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                {trades.length}
                            </Badge>
                        )}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-2">
                {trades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <TrendingUp className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm font-medium">No trades yet</p>
                        <p className="text-xs">Your trade history will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {trades.map((trade, idx) => {
                            const isBuyer = trade.role === 'buyer'

                            return (
                                <div
                                    key={trade.id}
                                    className="flex items-center justify-between p-2 rounded-sm hover:bg-accent/50 transition-all"
                                >
                                    {/* Trade Info */}
                                    <div className="flex flex-col justify-center min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0 h-4 font-semibold",
                                                    isBuyer
                                                        ? "bg-chart-2/10 text-chart-2 border-chart-2/20"
                                                        : "bg-destructive/10 text-destructive border-destructive/20"
                                                )}
                                            >
                                                {isBuyer ? 'BUY' : 'SELL'}
                                            </Badge>
                                            <span className="text-sm font-medium">
                                                {parseFloat(trade.quantity).toFixed(1)} kWh
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(trade.executed_at), { addSuffix: true })}
                                        </div>
                                    </div>

                                    {/* Value */}
                                    <div className="flex flex-col items-end justify-center">
                                        <div className={cn(
                                            "font-mono text-sm font-bold",
                                            isBuyer ? "text-destructive" : "text-chart-2"
                                        )}>
                                            {isBuyer ? '-' : '+'}{parseFloat(trade.total_value).toFixed(2)}
                                            <span className="text-[10px] font-normal ml-0.5">THB</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-mono">
                                            @{parseFloat(trade.price).toFixed(2)}/kWh
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
