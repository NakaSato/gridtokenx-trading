
'use client'

import { useEffect, useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'

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
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(false)

    const fetchOrderBook = async () => {
        setLoading(true)
        try {
            const { data } = await defaultApiClient.getP2POrderBook()
            if (data) {
                // Transform backend data to match frontend interface
                const transform = (items: any[]) => items.map(i => ({
                    ...i,
                    order_type: i.side === 'buy' ? 'Buy' : 'Sell',
                    seller: i.user_email || i.user_id, // Fallback
                    buyer: i.user_email || i.user_id
                }))

                setOrders([...transform(data.asks), ...transform(data.bids)])
            }
        } catch (error) {
            console.error('Failed to fetch order book:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrderBook()
        const interval = setInterval(fetchOrderBook, 5000) // Refresh every 5s
        return () => clearInterval(interval)
    }, [])

    const sellOrders = orders.filter((o) => o.order_type === 'Sell')
    const buyOrders = orders.filter((o) => o.order_type === 'Buy')

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Sell Orders */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-red-500">Asks (Sell Orders)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Price (Tokens)</TableHead>
                                <TableHead>Amount (kWh)</TableHead>
                                <TableHead>Seller</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sellOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>{order.price_per_kwh}</TableCell>
                                    <TableCell>{order.amount - order.filled_amount}</TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {order.seller.slice(0, 8)}...
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sellOrders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        No active sell orders
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Buy Orders */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-green-500">Bids (Buy Orders)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Price (Tokens)</TableHead>
                                <TableHead>Amount (kWh)</TableHead>
                                <TableHead>Buyer</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {buyOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>{order.price_per_kwh}</TableCell>
                                    <TableCell>{order.amount - order.filled_amount}</TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {order.buyer.slice(0, 8)}...
                                    </TableCell>
                                </TableRow>
                            ))}
                            {buyOrders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        No active buy orders
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
