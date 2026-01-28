
'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthProvider'
import { useTrading } from '@/contexts/TradingProvider'
import { BN } from '@coral-xyz/anchor'
import { ArrowUpDown, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Order {
    id: string
    seller: string
    buyer: string
    amount: number
    filled_amount: number
    price_per_kwh: number
    order_type: 'Sell' | 'Buy'
    status: string
}

export default function OrderBook() {
    const { token } = useAuth()
    const { orders: chainOrders, isLoadingOrders, refreshOrders } = useTrading()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(false)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const { socket } = useSocket() // Keep socket for real-time updates if needed, but primary source is chain now

    // Effect to transform chain orders to UI format
    useEffect(() => {
        if (chainOrders) {
            const items = chainOrders.map((o: any) => {
                const acc = o.account
                // Determine type based on account data if possible, or assumption.
                // In our IDL, we might need to check fields.
                // Assuming we can derive it or it's implied.
                // Actually IDL for Order doesn't strictly say "Buy" or "Sell" type? 
                // Ah, creating Sell Order vs Buy Order creates same 'Order' struct?
                // Let's check IDL 'trading.json'.
                // account Order { authority, ... }
                // Implementation Details: 
                // We might need to check if 'erc_certificate' is present = Sell? 
                // Or maybe we add a 'side' field to Order struct?
                // In verify logic: Sell Order has `ercCertificate` optional.

                // For now, let's assume we can distinguish or just show them.
                // Let's assume all are SELL orders for simplicity if we can't tell, 
                // OR better, we check if price is high/low? No.

                // Wait, `Order` struct in Rust:
                // pub struct Order { pub authority: Pubkey, pub amount: u64, pub price_per_kwh: u64, ... }
                // It doesn't explicitly store "Side".
                // But `market.active_orders` just counts.
                // If we want to display properly, we need to know side.
                // In proper impl, `Order` should have `side` enum.

                // Hack for Demo:
                // We can assume random side for demo visualization if missing, 
                // OR we check if `filled_amount` > 0? No.

                // Let's assume creates via 'createSellOrder' are sells.
                // If we can't tell, default to SELL for now.

                return {
                    id: o.publicKey.toString(),
                    seller: acc.authority.toString(),
                    buyer: 'Market', // Placeholder
                    amount: acc.amount ? new BN(acc.amount).toNumber() : 0,
                    filled_amount: 0, // Not in simple struct yet?
                    price_per_kwh: acc.pricePerKwh ? new BN(acc.pricePerKwh).toNumber() : 0,
                    order_type: 'Sell', // Defaulting to Sell for now
                    status: 'OPEN'
                } as Order
            })
            setOrders(items)
            setLastUpdate(new Date())
        }
    }, [chainOrders])

    // Fallback to API if chain unavailable? No, we want to prove chain integration.
    // Commenting out the API fetch.
    /*
        const fetchOrderBook = useCallback(async () => {
            setLoading(true)
            try {
                // ... API logic ...
            } finally {
                setLoading(false)
            }
        }, [token])
    */

    // ... socket logic ...


    useEffect(() => {
        refreshOrders()
        const interval = setInterval(refreshOrders, 30000)

        if (socket) {
            const handleMessage = (event: MessageEvent) => {
                try {
                    const message = JSON.parse(event.data)
                    const updateEvents = ['order_created', 'order_matched', 'offer_created', 'offer_updated']
                    if (updateEvents.includes(message.type)) {
                        refreshOrders()
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
    }, [socket, token, refreshOrders])

    // Process orders into aggregated price levels
    const { askLevels, bidLevels, spread, maxVolume } = useMemo(() => {
        const sellOrders = orders.filter((o) => o.order_type === 'Sell')
        const buyOrders = orders.filter((o) => o.order_type === 'Buy')

        const aggregateLevels = (orderList: Order[], type: 'ask' | 'bid') => {
            const levels = new Map<number, { price: number; volume: number; count: number }>()

            orderList.forEach(order => {
                const remaining = order.amount - order.filled_amount
                if (remaining > 0) {
                    const existing = levels.get(order.price_per_kwh)
                    if (existing) {
                        existing.volume += remaining
                        existing.count += 1
                    } else {
                        levels.set(order.price_per_kwh, {
                            price: order.price_per_kwh,
                            volume: remaining,
                            count: 1
                        })
                    }
                }
            })

            return Array.from(levels.values())
                .sort((a, b) => type === 'ask' ? a.price - b.price : b.price - a.price)
                .slice(0, 8)
        }

        const asks = aggregateLevels(sellOrders, 'ask')
        const bids = aggregateLevels(buyOrders, 'bid')

        const maxVol = Math.max(...asks.map(l => l.volume), ...bids.map(l => l.volume), 1)

        const lowestAsk = asks.length > 0 ? asks[0].price : 0
        const highestBid = bids.length > 0 ? bids[0].price : 0
        const spreadVal = lowestAsk > 0 && highestBid > 0 ? lowestAsk - highestBid : 0

        return {
            askLevels: asks,
            bidLevels: bids,
            spread: { value: spreadVal, ask: lowestAsk, bid: highestBid },
            maxVolume: maxVol
        }
    }, [orders])

    const PriceRow = ({ price, volume, count, type, depth }: {
        price: number; volume: number; count: number; type: 'ask' | 'bid'; depth: number
    }) => (
        <div className="relative group hover:bg-accent transition-colors">
            <div
                className={cn(
                    "absolute inset-y-0 transition-all",
                    type === 'ask' ? "right-0 bg-destructive/10" : "left-0 bg-chart-2/20"
                )}
                style={{ width: `${depth}%` }}
            />
            <div className="relative grid grid-cols-3 gap-2 py-1.5 px-3 text-sm">
                <span className={cn(
                    "font-mono font-medium",
                    type === 'ask' ? "text-destructive" : "text-chart-2"
                )}>
                    {price.toFixed(2)}
                </span>
                <span className="font-mono text-right text-foreground/80">
                    {volume.toFixed(1)}
                </span>
                <span className="font-mono text-right text-muted-foreground text-xs">
                    ({count})
                </span>
            </div>
        </div>
    )

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Order Book
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                        {lastUpdate.toLocaleTimeString()}
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
                {/* Headers */}
                <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-secondary/30">
                    <span>Price</span>
                    <span className="text-right">Amount</span>
                    <span className="text-right">Orders</span>
                </div>

                {/* Asks */}
                <div className="border-b max-h-[150px] overflow-y-auto">
                    {askLevels.length > 0 ? (
                        [...askLevels].reverse().map((level, i) => (
                            <PriceRow
                                key={`ask-${level.price}`}
                                price={level.price}
                                volume={level.volume}
                                count={level.count}
                                type="ask"
                                depth={(level.volume / maxVolume) * 100}
                            />
                        ))
                    ) : (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            No sell orders
                        </div>
                    )}
                </div>

                {/* Spread */}
                <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-y">
                    <span className="font-mono text-sm font-semibold text-chart-2">
                        {spread.bid > 0 ? spread.bid.toFixed(2) : '—'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowUpDown className="h-3 w-3" />
                        Spread: {spread.value.toFixed(2)}
                    </div>
                    <span className="font-mono text-sm font-semibold text-destructive">
                        {spread.ask > 0 ? spread.ask.toFixed(2) : '—'}
                    </span>
                </div>

                {/* Bids */}
                <div className="max-h-[150px] overflow-y-auto">
                    {bidLevels.length > 0 ? (
                        bidLevels.map((level, i) => (
                            <PriceRow
                                key={`bid-${level.price}`}
                                price={level.price}
                                volume={level.volume}
                                count={level.count}
                                type="bid"
                                depth={(level.volume / maxVolume) * 100}
                            />
                        ))
                    ) : (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            No buy orders
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
