'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import {
    Zap,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Wallet,
    History,
    Battery,
    Sun,
    Moon,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'
import { Skeleton } from './ui/skeleton'
import { useUserStats, useEnergyReadings, useTradeHistory } from '@/hooks/useUserAnalytics'
import { TradeRecord } from '@/types/trading'

// Local interfaces removed in favor of centralized types

export default function UserAnalytics() {
    const { user } = useAuth()
    const {
        data: stats,
        isLoading: statsLoading,
        error: statsError
    } = useUserStats()

    const {
        data: energyHistory = [],
        isLoading: energyLoading
    } = useEnergyReadings(24)

    const {
        data: trades = [],
        isLoading: tradesLoading
    } = useTradeHistory(10)

    const loading = statsLoading || energyLoading || tradesLoading
    const error = statsError ? (statsError as Error).message : null

    if (!user) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h1 className="text-2xl font-bold">Not Logged In</h1>
                <p className="text-secondary-foreground">Please log in to view your analytics.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 px-4 py-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Analytics</h1>
                    <p className="text-secondary-foreground">Your personal energy and trading performance.</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 border-primary/50 text-primary px-3 py-1">
                    <BarChart3 className="h-4 w-4" />
                    Personal Dashboard
                </Badge>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-destructive flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Energy Produced"
                    value={stats ? `${stats.total_energy_produced.toFixed(2)} kWh` : '-'}
                    icon={<Sun className="h-4 w-4 text-yellow-500" />}
                    description="Total solar generation"
                    loading={loading}
                    trend="up"
                />
                <StatCard
                    title="Energy Consumed"
                    value={stats ? `${stats.total_energy_consumed.toFixed(2)} kWh` : '-'}
                    icon={<Moon className="h-4 w-4 text-blue-500" />}
                    description="Total consumption"
                    loading={loading}
                />
                <StatCard
                    title="Token Balance"
                    value={stats ? `${stats.token_balance.toFixed(2)} GRX` : '-'}
                    icon={<Wallet className="h-4 w-4 text-green-500" />}
                    description="Available tokens"
                    loading={loading}
                    trend={stats && stats.token_balance > 0 ? 'up' : undefined}
                />
                <StatCard
                    title="Net P&L"
                    value={stats ? `${stats.total_profit_loss >= 0 ? '+' : ''}${stats.total_profit_loss.toFixed(2)}` : '-'}
                    icon={stats && stats.total_profit_loss >= 0
                        ? <TrendingUp className="h-4 w-4 text-green-500" />
                        : <TrendingDown className="h-4 w-4 text-red-500" />
                    }
                    description="Trading profit/loss"
                    loading={loading}
                    trend={stats && stats.total_profit_loss >= 0 ? 'up' : 'down'}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Energy Overview */}
                <Card className="lg:col-span-4 bg-backgroundSecondary/50 border-secondary">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Battery className="h-5 w-5 text-primary" />
                            Energy Overview
                        </CardTitle>
                        <CardDescription>Your energy production and consumption balance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <EnergyBar
                                produced={stats?.total_energy_produced || 0}
                                consumed={stats?.total_energy_consumed || 0}
                            />
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-green-500">
                                        {stats?.total_energy_produced.toFixed(1) || 0}
                                    </p>
                                    <p className="text-xs text-secondary-foreground">Produced (kWh)</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-500">
                                        {stats?.total_energy_consumed.toFixed(1) || 0}
                                    </p>
                                    <p className="text-xs text-secondary-foreground">Consumed (kWh)</p>
                                </div>
                                <div>
                                    <p className={`text-2xl font-bold ${(stats?.net_energy || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                        {stats?.net_energy.toFixed(1) || 0}
                                    </p>
                                    <p className="text-xs text-secondary-foreground">Net (kWh)</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Trading Summary */}
                <Card className="lg:col-span-3 bg-backgroundSecondary/50 border-secondary">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Recent Trades
                        </CardTitle>
                        <CardDescription>Your latest trading activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {trades.length > 0 ? (trades as unknown as TradeRecord[]).slice(0, 5).map(trade => (
                            <TradeItem key={trade.id} trade={trade as unknown as TradeRecord} />
                        )) : (
                            <p className="text-sm text-secondary-foreground py-4 text-center">No trades yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Trading Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Total Orders"
                    value={stats?.total_orders?.toString() || '0'}
                    icon={<BarChart3 className="h-4 w-4 text-primary" />}
                    description="All-time orders placed"
                    loading={loading}
                />
                <StatCard
                    title="Successful Trades"
                    value={stats?.successful_trades?.toString() || '0'}
                    icon={<Zap className="h-4 w-4 text-green-500" />}
                    description="Completed settlements"
                    loading={loading}
                />
                <StatCard
                    title="Success Rate"
                    value={stats && stats.total_orders > 0
                        ? `${((stats.successful_trades / stats.total_orders) * 100).toFixed(0)}%`
                        : '-'}
                    icon={<TrendingUp className="h-4 w-4 text-primary" />}
                    description="Trade completion rate"
                    loading={loading}
                />
            </div>
        </div>
    )
}

// Stat Card Component
function StatCard({ title, value, icon, description, loading, trend }: {
    title: string
    value: string
    icon: React.ReactNode
    description: string
    loading: boolean
    trend?: 'up' | 'down'
}) {
    return (
        <Card className="bg-backgroundSecondary border-secondary overflow-hidden group hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-24 mb-1" />
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{value}</span>
                        {trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                        {trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                    </div>
                )}
                <p className="text-xs text-secondary-foreground">{description}</p>
            </CardContent>
            <div className="h-1 w-full bg-secondary">
                <div className="h-1 bg-primary w-1/3 group-hover:w-full transition-all duration-500" />
            </div>
        </Card>
    )
}

// Energy Balance Bar
function EnergyBar({ produced, consumed }: { produced: number; consumed: number }) {
    const total = produced + consumed || 1
    const producedPercent = (produced / total) * 100
    const consumedPercent = (consumed / total) * 100

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs text-secondary-foreground">
                <span>Production vs Consumption</span>
                <span>{produced > consumed ? 'Net Producer' : 'Net Consumer'}</span>
            </div>
            <div className="h-4 rounded-full bg-secondary flex overflow-hidden">
                <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${producedPercent}%` }}
                />
                <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${consumedPercent}%` }}
                />
            </div>
        </div>
    )
}

// Trade Item Component
function TradeItem({ trade }: { trade: TradeRecord }) {
    const isBuy = trade.role === 'buyer'
    return (
        <div className="flex items-center justify-between text-sm py-2 border-b border-secondary last:border-0">
            <div className="flex items-center gap-2">
                <Badge variant={isBuy ? 'default' : 'secondary'} className="text-xs">
                    {isBuy ? 'BUY' : 'SELL'}
                </Badge>
                <span className="font-medium">{parseFloat(trade.quantity).toFixed(2)} kWh</span>
            </div>
            <div className="text-right">
                <span className="font-mono text-xs">${parseFloat(trade.total_value).toFixed(2)}</span>
                <p className="text-[10px] text-secondary-foreground">
                    @ ${parseFloat(trade.price).toFixed(2)}/kWh
                </p>
            </div>
        </div>
    )
}
