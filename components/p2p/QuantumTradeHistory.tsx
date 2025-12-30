'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { History, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface QuantumTransaction {
    id: number
    buyer_id: string
    seller_id: string
    amount_kwh: number
    price_per_kwh: number
    total_cost: number
    timestamp: string
    transaction_type: string
    tx_hash?: string
}

export default function QuantumTradeHistory() {
    const [trades, setTrades] = useState<QuantumTransaction[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTrades = async () => {
        try {
            // Fetch from the Python Simulator API directly
            // Note: In production, this might need a proxy or be routed through the Next.js API
            // For dev/demo, direct fetch is fine if CORS allows or we use localhost
            const response = await fetch('http://localhost:8000/api/v1/p2p/transactions?limit=20')
            if (response.ok) {
                const data = await response.json()
                setTrades(data)
            }
        } catch (error) {
            console.error('Failed to fetch quantum trades:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTrades()
        const interval = setInterval(fetchTrades, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <Card className="h-full border border-border">
                <CardHeader className="pb-2 border-b border-border/50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-violet-400">
                        <Zap className="h-4 w-4" />
                        Quantum Settlements
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                    <div className="animate-pulse space-y-3">
                        <div className="h-10 bg-secondary/30 rounded" />
                        <div className="h-10 bg-secondary/30 rounded" />
                        <div className="h-10 bg-secondary/30 rounded" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex h-full flex-col border border-border shadow-none">
            <CardHeader className="py-3 px-4 border-b border-border/40">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2 text-violet-400">
                        <Zap className="h-3.5 w-3.5" />
                        Quantum Settlements
                    </span>
                    {trades.length > 0 && (
                        <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-[10px] px-1.5">
                            LIVE
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
                {trades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3">
                        <p className="text-sm font-medium text-foreground">No quantum trades yet</p>
                        <p className="text-xs opacity-70">Waiting for optimization cycle</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        {trades.map((trade) => (
                            <div
                                key={trade.id}
                                className="group flex flex-col gap-1 px-4 py-3 hover:bg-accent/30 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-[9px] px-1.5 py-0 h-4 font-mono font-bold tracking-tight"
                                        >
                                            VQE
                                        </Badge>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {trade.buyer_id.substring(0, 8)}...
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                        {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pl-1 mt-1">
                                    <div className="text-sm font-medium font-mono text-foreground">
                                        {trade.amount_kwh.toFixed(2)} kWh
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground font-mono">
                                            @{trade.price_per_kwh.toFixed(2)}
                                        </span>
                                        <span className="font-mono text-sm font-medium text-violet-400">
                                            {trade.total_cost.toFixed(2)} THB
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-1 flex justify-end">
                                    <span className="text-[9px] font-mono text-slate-500" title={trade.tx_hash || "Simulated"}>
                                        Tx: {trade.tx_hash ? trade.tx_hash.substring(0, 8) + '...' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
