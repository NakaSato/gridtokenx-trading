
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
import { useSocket } from '@/contexts/SocketContext'

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

    const { socket } = useSocket()
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

    const fetchOrderBook = async () => {
        setLoading(true)
        try {
            const response = await defaultApiClient.getP2POrderBook() as any
            const data = response.data

            if (data && data.data) {
                // Backend returns { data: [Order...], pagination: ... }
                const items = data.data

                const transform = (item: any) => ({
                    ...item,
                    id: item.id,
                    order_type: item.side === 'buy' ? 'Buy' : 'Sell', // Map 'side' to UI 'order_type'
                    seller: item.side === 'sell' ? (item.user_email || item.user_id) : 'Market',
                    buyer: item.side === 'buy' ? (item.user_email || item.user_id) : 'Market',
                    amount: parseFloat(item.energy_amount),
                    filled_amount: parseFloat(item.filled_amount || 0),
                    price_per_kwh: parseFloat(item.price_per_kwh),
                    status: item.status
                })

                const allOrders = items.map(transform)
                setOrders(allOrders)
                setLastUpdated(new Date())
            }
        } catch (error) {
            console.error('Failed to fetch order book:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrderBook()

        // Poll every 30s as fallback
        const interval = setInterval(fetchOrderBook, 30000)

        // Real-time updates via WebSocket
        if (socket) {
            const handleMessage = (event: MessageEvent) => {
                try {
                    const message = JSON.parse(event.data)
                    // Refresh on relevant market events
                    const updateEvents = [
                        'order_created',
                        'order_matched',
                        'offer_created',
                        'offer_updated',
                        'order_book_buy_update',
                        'order_book_sell_update'
                    ]

                    if (updateEvents.includes(message.type)) {
                        console.log('⚡ Received real-time update:', message.type)
                        fetchOrderBook()
                    }
                } catch (e) {
                    console.error('Error parsing WS message:', e)
                }
            }

            socket.addEventListener('message', handleMessage)
            return () => {
                socket.removeEventListener('message', handleMessage)
                clearInterval(interval)
            }
        }

        return () => clearInterval(interval)
    }, [socket])

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
