'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { defaultApiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query/keys'
import { useAuth } from '@/features/auth/provider'
import { useSequencedChannel } from '@/lib/ws/useSequencedChannel'
import { History, TrendingUp, BarChart3, AlertOctagon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { TradeRecord } from '@/types/trading'

// Compact relative time: "39m", "2h", "3d", "5mo", "1y"
function shortTimeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo`
  return `${Math.floor(mo / 12)}y`
}

/** Terminal settlement state: the worker exhausted its retries and parked the row. */
const PERMANENTLY_FAILED = 'permanently_failed'

/** One header for every state, so the title doesn't restyle itself when data lands. */
function PanelHeader({ tradeCount }: { tradeCount?: number }) {
  return (
    <CardHeader className="border-b border-border/40 px-4 py-3">
      <CardTitle className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-primary" />
          Recent Trades
        </span>
        {tradeCount != null && tradeCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/40 px-2 py-0.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            <span className="text-[10px] font-medium tabular-nums tracking-widest text-foreground">
              {tradeCount}
            </span>
          </span>
        )}
      </CardTitle>
    </CardHeader>
  )
}

const TradeHistory = React.memo(function TradeHistory() {
  const { token } = useAuth()

  const queryClient = useQueryClient()
  const historyKey = React.useMemo(() => queryKeys.trading.tradeHistory(), [])

  const { data: trades = [], isLoading } = useQuery({
    queryKey: historyKey,
    queryFn: async (): Promise<TradeRecord[]> => {
      defaultApiClient.setToken(token!)
      const response = await defaultApiClient.getTrades({ limit: 20 })
      return response.data?.trades ?? []
    },
    enabled: !!token,
    // Was 10s. Matches now push over /ws/trading; this is the outage fallback.
    refetchInterval: 60_000,
  })

  // Settled trades now arrive over /ws/trading — a match is a trade. Market-wide,
  // so no zone filter. Refetching is idempotent, so a duplicate frame (the
  // outbox race puts Postgres ahead of Kafka) costs a request and nothing else.
  useSequencedChannel({
    messageTypes: ['order_matched'],
    snapshotKey: historyKey,
    enabled: !!token,
    onFrame: () => {
      void queryClient.invalidateQueries({ queryKey: historyKey })
    },
  })

  const loading = !!token && isLoading

  if (loading) {
    return (
      <Card className="flex h-full flex-col border-0 shadow-none">
        <PanelHeader />
        <CardContent className="space-y-px p-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-1.5 rounded-sm bg-secondary/30 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24 rounded bg-secondary" />
                <Skeleton className="h-3.5 w-16 rounded bg-secondary" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-2.5 w-20 rounded bg-secondary" />
                <Skeleton className="h-2.5 w-8 rounded bg-secondary" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Stats over the visible window (last 20 trades), computed once.
  const totalVolume = trades.reduce((acc, t) => acc + parseFloat(t.quantity), 0)
  const vwap =
    trades.reduce(
      (acc, t) => acc + parseFloat(t.price) * parseFloat(t.quantity),
      0
    ) / totalVolume || 0

  return (
    <Card className="flex h-full flex-col border-0 shadow-none">
      <PanelHeader tradeCount={trades.length} />

      {/* Window stats — the label says what the number covers: these are
                over the listed trades, not a 24h aggregate. */}
      <div className="grid grid-cols-2 divide-x divide-border/30 border-b border-border/40 bg-accent/20">
        <div className="space-y-0.5 px-4 py-2.5">
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            <TrendingUp className="h-2.5 w-2.5 text-primary" /> VWAP
          </p>
          <p className="font-mono text-sm font-semibold tabular-nums">
            ฿{vwap.toFixed(2)}
          </p>
        </div>
        <div className="space-y-0.5 px-4 py-2.5 text-right">
          <p className="flex items-center justify-end gap-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            <BarChart3 className="h-2.5 w-2.5 text-purple-500" /> Volume
          </p>
          <p className="font-mono text-sm font-semibold tabular-nums">
            {totalVolume.toFixed(1)}{' '}
            <span className="text-[10px] font-normal uppercase text-muted-foreground">
              kWh
            </span>
          </p>
        </div>
      </div>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12 text-muted-foreground">
            <div className="rounded-full bg-accent/50 p-3">
              <TrendingUp className="h-6 w-6 opacity-50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No trades yet
              </p>
              <p className="text-xs opacity-70">Market is quiet</p>
            </div>
          </div>
        ) : (
          <TooltipProvider delayDuration={150}>
            <div className="divide-y divide-border/30">
              {trades.map((trade) => {
                const isBuyer = trade.role === 'buyer'
                const fees =
                  (parseFloat(trade.wheeling_charge || '0') || 0) +
                  (parseFloat(trade.loss_cost || '0') || 0)
                const isPermanentlyFailed = trade.status === PERMANENTLY_FAILED
                const isSuccess =
                  trade.status === 'confirmed' || trade.status === 'completed'
                const hasZones =
                  trade.buyer_zone_id !== undefined &&
                  trade.seller_zone_id !== undefined

                return (
                  <div
                    key={trade.id}
                    className="group relative px-3 py-2 transition-colors hover:bg-accent/30"
                  >
                    {/* Side accent: green = bought, red = sold */}
                    <span
                      aria-hidden
                      className={cn(
                        'absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full',
                        isBuyer ? 'bg-green-500/70' : 'bg-red-500/70'
                      )}
                    />

                    {/* Line 1 — what traded, and for how much */}
                    <div className="flex items-center justify-between gap-2 pl-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'h-4 shrink-0 border-opacity-40 px-1.5 py-0 font-mono text-[9px] font-bold tracking-tight',
                            isBuyer
                              ? 'border-green-500 bg-green-500/10 text-green-500'
                              : 'border-red-500 bg-red-500/10 text-red-500'
                          )}
                        >
                          {isBuyer ? 'BUY' : 'SELL'}
                        </Badge>
                        <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-foreground">
                          {parseFloat(trade.quantity).toFixed(2)}
                          <span className="ml-0.5 text-[9px] text-muted-foreground">
                            kWh
                          </span>
                        </span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 font-mono text-sm font-medium tabular-nums',
                          isBuyer ? 'text-red-500' : 'text-green-500'
                        )}
                      >
                        {isBuyer ? '-' : '+'}
                        {parseFloat(trade.total_value).toFixed(2)}
                        <span className="ml-0.5 text-[10px] text-muted-foreground">
                          THBC
                        </span>
                      </span>
                    </div>

                    {/* Line 2 — pricing detail, routing, state, age */}
                    <div className="mt-1 flex items-center justify-between gap-2 pl-2">
                      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                          @{parseFloat(trade.price).toFixed(2)}
                        </span>
                        {fees > 0 && (
                          <span className="shrink-0 text-[9px] tabular-nums text-muted-foreground opacity-70">
                            +{fees.toFixed(2)} fees
                          </span>
                        )}
                        {hasZones && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'h-4 shrink-0 px-1.5 py-0 text-[9px] font-normal tracking-tight',
                              trade.buyer_zone_id === trade.seller_zone_id
                                ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                                : 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
                            )}
                          >
                            {trade.buyer_zone_id === trade.seller_zone_id
                              ? 'LOCAL'
                              : 'X-ZONE'}
                          </Badge>
                        )}

                        {/* Status badge — only for in-flight or non-terminal
                                                    failure states. Success needs no badge (the row itself
                                                    means the trade settled); terminal failure collapses
                                                    to the diagnostics icon. */}
                        {!isPermanentlyFailed && !isSuccess && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'h-4 shrink-0 border-opacity-40 px-1.5 py-0 text-[9px] font-normal tracking-tight',
                              trade.status === 'failed'
                                ? 'border-destructive bg-destructive/10 text-destructive'
                                : 'border-amber-500 bg-amber-500/10 text-amber-500'
                            )}
                          >
                            {trade.status.toUpperCase()}
                          </Badge>
                        )}

                        {/* Terminal failures collapse to one icon; it carries both
                                                    the state and the settlement worker's diagnostics on
                                                    hover. */}
                        {isPermanentlyFailed && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label="Settlement permanently failed — show diagnostics"
                                className="shrink-0 rounded-sm text-destructive hover:text-destructive/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
                              >
                                <AlertOctagon className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="start"
                              className="max-w-xs space-y-1 border border-destructive/40 bg-popover text-popover-foreground"
                            >
                              <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">
                                Settlement permanently failed
                              </p>
                              <p className="break-words font-mono text-[11px] leading-snug">
                                {trade.error_message ||
                                  'No error message recorded.'}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Retries: {trade.retry_count ?? 0} · Trade{' '}
                                {trade.id.slice(0, 8)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </span>

                      <span className="shrink-0 whitespace-nowrap text-[10px] tabular-nums text-muted-foreground">
                        {shortTimeAgo(new Date(trade.executed_at))} ago
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
})

export default TradeHistory
