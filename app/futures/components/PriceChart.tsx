'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts'
import { defaultApiClient } from '@/lib/api-client'
import { Candle } from '@/types/futures'

// Mock data generator
// Removed

export default function PriceChart() {
    const [data, setData] = useState<any[]>([])
    const [product, setProduct] = useState<any>(null)

    useEffect(() => {
        const init = async () => {
            // Get first product
            const { data: products } = await defaultApiClient.getFuturesProducts()
            if (products && products.length > 0) {
                setProduct(products[0])
                loadCandles(products[0].id)
            }
        }
        init()
    }, [])

    useEffect(() => {
        if (!product) return

        const interval = setInterval(() => {
            loadCandles(product.id)
        }, 5000)

        return () => clearInterval(interval)
    }, [product])

    const loadCandles = async (productId: string) => {
        const { data: candles } = await defaultApiClient.getFuturesCandles(productId, '1m')
        if (candles) {
            // Transform for recharts
            const chartData = candles.map(c => ({
                time: c.time,
                price: parseFloat(c.close), // Use close price for simple area chart
                volume: parseFloat(c.volume)
            }))
            setData(chartData)
        }
    }

    return (
        <Card className="h-[400px] w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-normal">
                    {product ? `${product.symbol} Futures` : 'Loading...'}
                </CardTitle>
                <div className="text-2xl font-bold">
                    ${data[data.length - 1]?.price?.toFixed(2) || '0.00'}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis
                                dataKey="time"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={['auto', 'auto']}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '8px'
                                }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorPrice)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
