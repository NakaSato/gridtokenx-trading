'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { defaultApiClient } from '@/lib/api-client'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/contexts/AuthProvider'
import { Loader2, RefreshCw, X, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

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
                    .filter((o: any) => o.status === 'pending' || o.status === 'active' || o.status === 'partial')
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
                setOrders(prev => prev.filter(o => o.id !== orderId))
            }
        } catch (error: any) {
            alert(`Cancel failed: ${error.message}`)
        } finally {
            setCancellingId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary">Pending</Badge>
            case 'active':
                return <Badge variant="outline" className="border-primary text-primary">Active</Badge>
            case 'partial':
                return <Badge variant="outline" className="border-chart-1 text-chart-1">Partial</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        My Orders
                        {orders.length > 0 && (
                            <span className="text-xs font-normal bg-secondary px-2 py-0.5 rounded">
                                {orders.length}
                            </span>
                        )}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchOrders(true)}
                        disabled={refreshing}
                        className="h-8 w-8 p-0"
                    >
                        <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No active orders
                    </p>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => {
                            const isBuy = order.side === 'Buy'
                            const totalAmount = parseFloat(order.energy_amount)
                            const filledAmount = parseFloat(order.filled_amount || '0')
                            const fillPercent = totalAmount > 0 ? (filledAmount / totalAmount) * 100 : 0

                            return (
                                <div
                                    key={order.id}
                                    className={cn(
                                        "p-3 rounded-lg border",
                                        isBuy ? "border-chart-2/30 bg-chart-2/5" : "border-destructive/30 bg-destructive/5"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={cn(
                                            "font-medium",
                                            isBuy ? "text-chart-2" : "text-destructive"
                                        )}>
                                            {order.side} {totalAmount.toFixed(1)} kWh
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(order.status)}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCancel(order.id)}
                                                disabled={cancellingId === order.id}
                                                className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                            >
                                                {cancellingId === order.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <X className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="text-sm text-muted-foreground mb-2">
                                        @ {parseFloat(order.price_per_kwh).toFixed(2)} GRX/kWh
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Filled: {filledAmount.toFixed(1)} / {totalAmount.toFixed(1)}</span>
                                            <span>{fillPercent.toFixed(0)}%</span>
                                        </div>
                                        <Progress
                                            value={fillPercent}
                                            className={cn(
                                                "h-1.5",
                                                isBuy ? "[&>div]:bg-chart-2" : "[&>div]:bg-destructive"
                                            )}
                                        />
                                    </div>

                                    <div className="text-xs text-muted-foreground mt-2">
                                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
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
