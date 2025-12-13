'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { OrderBook } from '@/types/futures'

export default function OrderBookComponent() {
    const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
    const [product, setProduct] = useState<any>(null)

    useEffect(() => {
        const init = async () => {
            const { data: products } = await defaultApiClient.getFuturesProducts()
            if (products && products.length > 0) {
                setProduct(products[0])
                loadOrderBook(products[0].id)
            }
        }
        init()
    }, [])

    useEffect(() => {
        if (!product) return

        const interval = setInterval(() => {
            loadOrderBook(product.id)
        }, 5000)

        return () => clearInterval(interval)
    }, [product])

    const loadOrderBook = async (productId: string) => {
        const { data } = await defaultApiClient.getFuturesOrderBook(productId)
        if (data) {
            setOrderBook(data)
        }
    }

    const renderRows = (entries: any[], type: 'bid' | 'ask') => {
        return entries.map((entry, i) => (
            <div key={i} className="flex justify-between text-xs py-1">
                <span className={type === 'bid' ? 'text-green-500' : 'text-red-500'}>
                    {parseFloat(entry.price).toFixed(2)}
                </span>
                <span className="text-muted-foreground">{parseFloat(entry.quantity).toFixed(4)}</span>
                <span className="text-muted-foreground hidden sm:block">
                    {(parseFloat(entry.price) * parseFloat(entry.quantity)).toFixed(2)}
                </span>
            </div>
        ))
    }

    return (
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
    )
}
