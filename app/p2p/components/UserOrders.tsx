'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { defaultApiClient } from '@/lib/api-client'
import { formatDistanceToNow } from 'date-fns'

interface Order {
    id: string
    energy_amount: string
    price_per_kwh: string
    filled_amount: string
    side: 'Buy' | 'Sell'
    status: string
    created_at: string
}

export default function UserOrders() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    const fetchOrders = async () => {
        try {
            // Fetch user's active/pending orders
            const { data } = await defaultApiClient.getMyP2POrders()
            if (data) {
                // Map backend P2POrder to local Order interface
                const mappedOrders = data.map((o: any) => ({
                    ...o,
                    energy_amount: o.amount,
                    side: o.side === 'buy' ? 'Buy' : 'Sell',
                }))
                setOrders(mappedOrders)
            }
        } catch (error) {
            console.error('Failed to fetch user orders:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
        const interval = setInterval(fetchOrders, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleCancel = async (orderId: string) => {
        // TODO: Implement cancel P2P order
        alert('Cancel functionality not yet available for P2P')
    }

    if (loading) return null

    if (orders.length === 0) return null

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-lg">My Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                            <div>
                                <div className={`font-semibold ${order.side === 'Buy' ? 'text-green-600' : 'text-red-600'}`}>
                                    {order.side} {parseFloat(order.energy_amount).toFixed(2)} kWh
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    @ {parseFloat(order.price_per_kwh).toFixed(2)} Tokens/kWh
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(order.id)}
                                disabled={true}
                                className="text-red-500 hover:text-red-600 border-red-200"
                            >
                                Cancel
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
