'use client'

import React, { useEffect } from 'react'
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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Skeleton } from '@/components/ui/skeleton'

export default function PriceChart() {
    const queryClient = useQueryClient()

    // Fetch products to get the first one for the chart
    const { data: products = [] } = useQuery({
        queryKey: ['futuresProducts'],
        queryFn: async () => {
            const { data } = await defaultApiClient.getFuturesProducts()
            return data || []
        }
    })

    const product = products?.[0]
    const productId = product?.id

    const { data: chartData = [] } = useQuery({
        queryKey: ['futuresCandles', productId],
        queryFn: async () => {
            if (!productId) return []
            const { data: candles } = await defaultApiClient.getFuturesCandles(productId, '1m')
            if (!candles) return []

            return candles.map(c => ({
                time: c.time,
                price: parseFloat(c.close),
                volume: parseFloat(c.volume)
            }))
        },
        enabled: !!productId,
        refetchInterval: 15000,
    })

    // WebSocket real-time updates
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const refreshEvents = ['TradeExecuted', 'OrderMatched', 'PriceUpdated']

            if (refreshEvents.includes(message.type)) {
                queryClient.invalidateQueries({ queryKey: ['futuresCandles'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    return (
        <ErrorBoundary name="Futures Price Chart">
            <Card className="h-[400px] w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-normal">
                        {!product ? <Skeleton className="h-6 w-32" /> : `${product.symbol} Futures`}
                    </CardTitle>
                    <div className="text-2xl font-bold">
                        {chartData.length === 0 ? <Skeleton className="h-8 w-24" /> : `$${chartData[chartData.length - 1]?.price?.toFixed(2)}`}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        {chartData.length === 0 ? (
                            <Skeleton className="h-full w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
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
                        )}
                    </div>
                </CardContent>
            </Card>
        </ErrorBoundary>
    )
}
