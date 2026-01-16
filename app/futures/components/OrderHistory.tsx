'use client'

import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { FuturesOrder } from '@/types/futures'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import SkeletonTable from '@/components/ui/SkeletonTable'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export default function OrderHistory() {
    const queryClient = useQueryClient()

    const { data: orders = [], isLoading: loading } = useQuery({
        queryKey: ['futuresOrders'],
        queryFn: async () => {
            const { data } = await defaultApiClient.getFuturesOrders()
            return data || []
        },
        refetchInterval: 30000,
    })

    // WebSocket real-time updates
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const refreshEvents = ['OrderCreated', 'OrderMatched', 'TradeExecuted']

            if (refreshEvents.includes(message.type)) {
                queryClient.invalidateQueries({ queryKey: ['futuresOrders'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    if (loading && orders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                    <SkeletonTable rows={5} columns={8} />
                </CardContent>
            </Card>
        )
    }

    return (
        <ErrorBoundary name="Futures Order History">
            <Card>
                <CardHeader>
                    <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Time</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Symbol</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Type</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Side</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Price</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Amount</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Filled</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                            No recent orders
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle whitespace-nowrap">
                                                {new Date(order.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-4 align-middle font-medium">{order.product_symbol}</td>
                                            <td className="p-4 align-middle uppercase">{order.order_type}</td>
                                            <td className={`p-4 align-middle uppercase ${order.side === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                                                {order.side}
                                            </td>
                                            <td className="p-4 align-middle">{Number(order.price).toFixed(2)}</td>
                                            <td className="p-4 align-middle">{Number(order.quantity).toFixed(4)}</td>
                                            <td className="p-4 align-middle">{Number(order.filled_quantity).toFixed(4)}</td>
                                            <td className="p-4 align-middle capitalize">{order.status}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </ErrorBoundary>
    )
}
