'use client'

import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export default function OrderBookComponent() {
    const queryClient = useQueryClient()

    // Fetch products to get the first one for the order book
    const { data: products = [] } = useQuery({
        queryKey: ['futuresProducts'],
        queryFn: async () => {
            const { data } = await defaultApiClient.getFuturesProducts()
            return data || []
        }
    })

    const productId = products?.[0]?.id

    const { data: orderBook } = useQuery({
        queryKey: ['futuresOrderBook', productId],
        queryFn: async () => {
            if (!productId) return null
            const { data } = await defaultApiClient.getFuturesOrderBook(productId)
            return data || null
        },
        enabled: !!productId,
        refetchInterval: 5000,
    })

    // WebSocket real-time updates
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const refreshEvents = ['OrderSnapshot', 'OrderUpdate', 'OrderCreated', 'OrderMatched']

            if (refreshEvents.includes(message.type)) {
                console.log('⚡ Futures OrderBook real-time update:', message.type)
                queryClient.invalidateQueries({ queryKey: ['futuresOrderBook'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    return (
        <ErrorBoundary name="Futures Order Book">
            <Card className="h-full">
                <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Order Book</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 text-xs font-semibold text-muted-foreground mb-2">
                        <span>Price (USD)</span>
                        <span className="text-right">Size</span>
                        <span className="text-right hidden sm:block">Total</span>
                    </div>

                    <div className="space-y-0.5">
                        {orderBook?.asks.slice().reverse().map((ask, i) => (
                            <div key={i} className="grid grid-cols-3 text-xs py-0.5 hover:bg-muted/50 cursor-pointer">
                                <span className="text-red-500">{parseFloat(ask.price).toFixed(2)}</span>
                                <span className="text-right">{parseFloat(ask.quantity).toFixed(4)}</span>
                                <span className="text-right hidden sm:block">{(parseFloat(ask.price) * parseFloat(ask.quantity)).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="py-2 border-y text-center font-bold text-lg">
                        {orderBook?.asks[0] && orderBook?.bids[0] ?
                            ((parseFloat(orderBook.asks[orderBook.asks.length - 1].price) + parseFloat(orderBook.bids[0].price)) / 2).toFixed(2)
                            : '---'
                        }
                    </div>

                    <div className="space-y-0.5">
                        {orderBook?.bids.map((bid, i) => (
                            <div key={i} className="grid grid-cols-3 text-xs py-0.5 hover:bg-muted/50 cursor-pointer">
                                <span className="text-green-500">{parseFloat(bid.price).toFixed(2)}</span>
                                <span className="text-right">{parseFloat(bid.quantity).toFixed(4)}</span>
                                <span className="text-right hidden sm:block">{(parseFloat(bid.price) * parseFloat(bid.quantity)).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </ErrorBoundary>
    )
}
