'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { defaultApiClient } from '@/lib/api-client'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/contexts/AuthProvider'
import { Loader2, RefreshCw, X } from 'lucide-react'

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
    const { token } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [cancellingId, setCancellingId] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    const fetchOrders = async (showRefresh = false) => {
        if (!token) {
            setLoading(false)
            return
        }

        if (showRefresh) setRefreshing(true)

        try {
            defaultApiClient.setToken(token)
            const response = await defaultApiClient.getMyP2POrders()
            const responseData = response.data as any
            const ordersData = responseData?.data || responseData || []

            if (Array.isArray(ordersData)) {
                const mappedOrders = ordersData
                    .filter((o: any) => o.status === 'pending' || o.status === 'active')
                    .map((o: any) => ({
                        ...o,
                        energy_amount: o.energy_amount || o.amount,
                        side: o.side === 'buy' ? 'Buy' : o.side === 'sell' ? 'Sell' : o.side,
                    }))
                setOrders(mappedOrders)
            }
        } catch (error) {
            console.error('Failed to fetch user orders:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchOrders()
        const interval = setInterval(() => fetchOrders(), 10000)
        return () => clearInterval(interval)
    }, [token])

    const handleCancel = async (orderId: string) => {
        if (!token) return

        setCancellingId(orderId)
        try {
            defaultApiClient.setToken(token)
            const response = await defaultApiClient.cancelOrder(orderId)

            if (response.error) {
                alert(`Failed to cancel: ${response.error}`)
            } else {
                // Remove from local state immediately
                setOrders(prev => prev.filter(o => o.id !== orderId))
            }
        } catch (error: any) {
            alert(`Cancel failed: ${error.message}`)
        } finally {
            setCancellingId(null)
        }
    }

    if (loading) {
        return (
            <Card className="mt-6">
                <CardContent className="py-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (orders.length === 0) {
        return (
            <Card className="mt-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                        My Orders
                        <Button variant="ghost" size="sm" onClick={() => fetchOrders(true)} disabled={refreshing}>
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No active orders. Create one above!
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="mt-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                    My Orders ({orders.length})
                    <Button variant="ghost" size="sm" onClick={() => fetchOrders(true)} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className={`flex justify-between items-center p-3 rounded-lg border ${order.side === 'Buy' ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                                }`}
                        >
                            <div className="flex-1">
                                <div className={`font-semibold ${order.side === 'Buy' ? 'text-green-600' : 'text-red-600'}`}>
                                    {order.side} {parseFloat(order.energy_amount).toFixed(1)} kWh
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    @ {parseFloat(order.price_per_kwh).toFixed(2)} tokens/kWh
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(order.id)}
                                disabled={cancellingId === order.id}
                                className="text-red-500 hover:text-red-600 hover:bg-red-100"
                            >
                                {cancellingId === order.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <X className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

