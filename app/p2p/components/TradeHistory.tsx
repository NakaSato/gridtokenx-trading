'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { formatDistanceToNow } from 'date-fns'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthProvider'
import { ArrowUpRight, ArrowDownRight, History } from 'lucide-react'
import { cn } from '@/lib/utils'

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
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Recent Trades
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse flex justify-between items-center py-2">
                                <div className="h-4 bg-secondary w-24 rounded" />
                                <div className="h-4 bg-secondary w-16 rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Recent Trades
                    </span>
                    {trades.length > 0 && (
                        <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                            {trades.length}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
                {trades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <p className="text-sm">No trades yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {trades.map((trade) => {
                            const isBuyer = trade.role === 'buyer'

                            return (
                                <div
                                    key={trade.id}
                                    className="flex items-center justify-between py-2.5 px-4 hover:bg-accent transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "p-1.5 rounded",
                                            isBuyer ? "bg-chart-2/10" : "bg-destructive/10"
                                        )}>
                                            {isBuyer ? (
                                                <ArrowDownRight className="h-3 w-3 text-chart-2" />
                                            ) : (
                                                <ArrowUpRight className="h-3 w-3 text-destructive" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">
                                                {isBuyer ? 'Bought' : 'Sold'} {parseFloat(trade.quantity).toFixed(1)} kWh
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(trade.executed_at), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn(
                                            "font-mono text-sm font-medium",
                                            isBuyer ? "text-destructive" : "text-chart-2"
                                        )}>
                                            {isBuyer ? '-' : '+'}{parseFloat(trade.total_value).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            @{parseFloat(trade.price).toFixed(2)}
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
