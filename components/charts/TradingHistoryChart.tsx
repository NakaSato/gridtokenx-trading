'use client'

import { useEffect, useState } from 'react'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface TradeDataPoint {
    date: string
    volume: number
    value: number
    trades: number
}

interface TradingHistoryChartProps {
    className?: string
}

export function TradingHistoryChart({ className }: TradingHistoryChartProps) {
    const [data, setData] = useState<TradeDataPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [timeframe, setTimeframe] = useState('7d')
    const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral')

    const generateSampleData = (tf: string): TradeDataPoint[] => {
        const days = tf === '7d' ? 7 : tf === '30d' ? 30 : 24
        return Array.from({ length: days }, (_, i) => ({
            date: tf === '24h'
                ? `${i}:00`
                : new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                }),
            volume: Math.random() * 500 + 100,
            value: Math.random() * 10000 + 5000,
            trades: Math.floor(Math.random() * 20) + 5,
        }))
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // Generate sample data for demo (API integration ready)
                const chartData = generateSampleData(timeframe)
                setData(chartData)

                // Calculate trend
                if (chartData.length >= 2) {
                    const first = chartData[0].value
                    const last = chartData[chartData.length - 1].value
                    setTrend(last > first ? 'up' : last < first ? 'down' : 'neutral')
                }
            } catch (error) {
                console.error('Failed to fetch trading history:', error)
                setData(generateSampleData(timeframe))
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [timeframe])

    const totalVolume = data.reduce((sum, d) => sum + d.volume, 0)
    const totalValue = data.reduce((sum, d) => sum + d.value, 0) / data.length
    const totalTrades = data.reduce((sum, d) => sum + d.trades, 0)

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <div className="animate-pulse text-muted-foreground">Loading chart...</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Trading History
                        {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    </CardTitle>
                    <Tabs value={timeframe} onValueChange={setTimeframe}>
                        <TabsList className="h-8">
                            <TabsTrigger value="24h" className="text-xs">24H</TabsTrigger>
                            <TabsTrigger value="7d" className="text-xs">7D</TabsTrigger>
                            <TabsTrigger value="30d" className="text-xs">30D</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                        <p className="text-xs text-muted-foreground">Volume (kWh)</p>
                        <p className="text-lg font-bold text-primary">{totalVolume.toFixed(1)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Avg Value (฿)</p>
                        <p className="text-lg font-bold text-green-500">{totalValue.toFixed(0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Trades</p>
                        <p className="text-lg font-bold text-blue-500">{totalTrades}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.1)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: '#888' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#888' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    border: '1px solid rgba(0,212,170,0.3)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                                labelStyle={{ color: '#00d4aa' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="volume"
                                stroke="#00d4aa"
                                strokeWidth={2}
                                fill="url(#colorVolume)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
