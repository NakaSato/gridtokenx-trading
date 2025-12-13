'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { formatDistanceToNow } from 'date-fns'

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
    const [trades, setTrades] = useState<Trade[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                // Fetch recent 20 trades
                const response = await defaultApiClient.getTrades({ limit: 20 })
                if (response.data) {
                    setTrades(response.data.trades)
                }
            } catch (error) {
                console.error('Failed to fetch trades:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTrades()
        // Poll every 10 seconds
        const interval = setInterval(fetchTrades, 10000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Trades</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse flex justify-between items-center">
                                <div className="h-4 bg-muted w-1/3 rounded"></div>
                                <div className="h-4 bg-muted w-1/4 rounded"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
                {trades.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        No trades executed yet
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trades.map((trade) => (
                            <div key={trade.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                                <div>
                                    <div className="font-semibold">
                                        {trade.role === 'buyer' ? 'Bought' : 'Sold'} {parseFloat(trade.quantity).toFixed(2)} kWh
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(trade.executed_at), { addSuffix: true })}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-mono ${trade.role === 'buyer' ? 'text-red-500' : 'text-green-500'}`}>
                                        {trade.role === 'buyer' ? '-' : '+'} {parseFloat(trade.total_value).toFixed(2)} Tokens
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        @ {parseFloat(trade.price).toFixed(2)} / kWh
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
