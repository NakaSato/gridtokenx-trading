'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/provider'
import { createApiClient } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Timeframe = '24h' | '7d' | '30d'

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
]

interface Stats {
  pnl: number
  pnlPercent: number
  volumeKwh: number
  tradeCount: number
  avgPrice: number
}

function StatTile({
  label,
  loading,
  children,
  className,
}: {
  label: string
  loading: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-3 py-2', className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-1 h-6 w-20" />
      ) : (
        <div className="mt-0.5 text-base font-semibold text-foreground sm:text-lg">{children}</div>
      )}
    </div>
  )
}

export function PortfolioStatsRow() {
  const { token, isAuthenticated } = useAuth()
  const [timeframe, setTimeframe] = useState<Timeframe>('30d')
  const apiClient = createApiClient(token || '')

  const { data, isLoading } = useQuery<Stats>({
    queryKey: ['portfolio-stats', token, timeframe],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')

      const [analyticsResponse, tradesResponse] = await Promise.all([
        apiClient.getUserAnalytics({ timeframe }),
        apiClient.getTrades({ limit: 100 }),
      ])
      const analytics = analyticsResponse.data
      const trades = tradesResponse.data?.trades || []

      const cutoff = new Date()
      if (timeframe === '24h') cutoff.setHours(cutoff.getHours() - 24)
      else if (timeframe === '7d') cutoff.setDate(cutoff.getDate() - 7)
      else cutoff.setDate(cutoff.getDate() - 30)

      let totalBuyValue = 0
      let totalSellValue = 0
      trades.forEach((trade: any) => {
        const tradeDate = new Date(trade.executed_at || trade.created_at)
        if (tradeDate < cutoff) return
        const value = parseFloat(trade.total_value || trade.price || '0')
        if (trade.role === 'buyer' || trade.side === 'buy') totalBuyValue += value
        else totalSellValue += value
      })

      const pnl = totalSellValue - totalBuyValue
      return {
        pnl,
        pnlPercent: totalBuyValue > 0 ? (pnl / totalBuyValue) * 100 : 0,
        volumeKwh: analytics?.overall?.total_volume_kwh ?? 0,
        tradeCount: analytics?.overall?.trade_count ?? 0,
        avgPrice: analytics?.overall?.avg_price ?? 0,
      }
    },
    enabled: !!token && isAuthenticated,
    staleTime: 30000,
    refetchInterval: 60000,
  })

  const formatCompact = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
    return value.toFixed(2)
  }

  if (!isAuthenticated) {
    return (
      <Card className="rounded-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p className="font-medium">Performance</p>
          <p className="text-sm">Sign in to view your trading stats</p>
        </CardContent>
      </Card>
    )
  }

  const stats = data ?? { pnl: 0, pnlPercent: 0, volumeKwh: 0, tradeCount: 0, avgPrice: 0 }
  const isProfitable = stats.pnl >= 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Performance
        </h2>
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
          <TabsList className="h-7">
            {TIMEFRAMES.map((tf) => (
              <TabsTrigger key={tf.value} value={tf.value} className="px-2 text-xs">
                {tf.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y rounded-sm border sm:grid-cols-4 sm:divide-y-0">
        <StatTile label="P&L" loading={isLoading}>
          <span
            className={`inline-flex flex-wrap items-center gap-x-1 ${isProfitable ? 'text-green-500' : 'text-red-500'}`}
          >
            <span className="inline-flex items-center whitespace-nowrap">
              {`${isProfitable ? '+' : '-'}฿${Math.abs(stats.pnl).toFixed(2)}`}
              {isProfitable ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
            </span>
            <span className="text-xs font-normal whitespace-nowrap">
              ({stats.pnlPercent >= 0 ? '+' : ''}
              {stats.pnlPercent.toFixed(2)}%)
            </span>
          </span>
        </StatTile>

        <StatTile label="Volume" loading={isLoading}>
          {formatCompact(stats.volumeKwh)} <span className="text-xs font-normal">kWh</span>
        </StatTile>

        <StatTile label="Trades" loading={isLoading}>
          {stats.tradeCount}
        </StatTile>

        <StatTile label="Avg price" loading={isLoading}>
          ฿{stats.avgPrice.toFixed(2)} <span className="text-xs font-normal">/kWh</span>
        </StatTile>
      </div>
    </div>
  )
}
