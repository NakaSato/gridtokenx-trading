'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
    Zap,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    Database,
    BookOpen,
} from 'lucide-react'
import { useP2PActivity } from '@/features/p2p/hooks/useP2PActivity'

/**
 * Compact, landscape-oriented P2P activity view for the trading positions
 * panel (a short, wide strip). The portfolio page keeps the full stacked-card
 * view (P2PStatus); both share the useP2PActivity data hook.
 */
const P2PActivityPanel = React.memo(function P2PActivityPanel() {
    const { matchingStatus, settlementStats, userStats, recentMatches, lastUpdated } =
        useP2PActivity()

    const confirmed = settlementStats?.confirmed_count || 0
    const pending = settlementStats?.pending_count || 0
    const failed = settlementStats?.failed_count || 0
    const settleTotal = confirmed + pending + failed
    const confirmedPct = settleTotal ? (confirmed / settleTotal) * 100 : 0
    const pendingPct = settleTotal ? (pending / settleTotal) * 100 : 0

    return (
        <div className="flex h-full min-h-0 flex-col divide-y divide-border animate-in fade-in duration-500 md:flex-row md:divide-x md:divide-y-0">
            {/* Matching Engine */}
            <section className="flex flex-col gap-2 p-3 md:w-[30%] md:min-w-[220px]">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        <Zap className="h-3 w-3 text-primary" /> Matching Engine
                    </span>
                    <Badge
                        variant="outline"
                        className={cn(
                            'h-4 rounded-md border-0 px-1.5 text-[9px] font-normal',
                            matchingStatus?.can_match
                                ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20'
                        )}
                    >
                        {/* "Idle" not "Paused" — reflects whether the book crosses, not engine health */}
                        {matchingStatus?.can_match ? 'Active' : 'Idle'}
                    </Badge>
                </div>

                {/* Buy ⇄ Sell flow */}
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            'flex flex-1 items-center justify-between rounded-md border px-2 py-1.5',
                            (matchingStatus?.pending_buy_orders ?? 0) > 0
                                ? 'border-emerald-500/30 bg-emerald-500/10'
                                : 'border-border bg-muted/30'
                        )}
                    >
                        <span className="flex items-center gap-1 text-[9px] font-medium uppercase text-muted-foreground">
                            <TrendingUp className="h-3 w-3 text-emerald-500" /> Buy
                        </span>
                        <span
                            className={cn(
                                'font-mono text-sm font-bold lining-nums',
                                (matchingStatus?.pending_buy_orders ?? 0) > 0
                                    ? 'text-emerald-600'
                                    : 'text-muted-foreground'
                            )}
                        >
                            {matchingStatus?.pending_buy_orders || 0}
                        </span>
                    </div>

                    <div className="flex flex-col items-center">
                        <ArrowRightLeft className="h-3 w-3 text-primary" />
                        <span className="text-[9px] text-muted-foreground">
                            {matchingStatus?.pending_matches || 0}
                        </span>
                    </div>

                    <div
                        className={cn(
                            'flex flex-1 items-center justify-between rounded-md border px-2 py-1.5',
                            (matchingStatus?.pending_sell_orders ?? 0) > 0
                                ? 'border-destructive/30 bg-destructive/10'
                                : 'border-border bg-muted/30'
                        )}
                    >
                        <span className="flex items-center gap-1 text-[9px] font-medium uppercase text-muted-foreground">
                            <TrendingDown className="h-3 w-3 text-destructive" /> Sell
                        </span>
                        <span
                            className={cn(
                                'font-mono text-sm font-bold lining-nums',
                                (matchingStatus?.pending_sell_orders ?? 0) > 0
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                            )}
                        >
                            {matchingStatus?.pending_sell_orders || 0}
                        </span>
                    </div>
                </div>

                {/* Spread */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Spread</span>
                    <span className="font-mono text-foreground">
                        ฿{matchingStatus?.buy_price_range?.min?.toFixed(2) || '0.00'} – ฿
                        {matchingStatus?.sell_price_range?.max?.toFixed(2) || '0.00'}
                    </span>
                </div>

                {!matchingStatus?.can_match && matchingStatus?.match_reason && (
                    <p
                        className="truncate text-[9px] leading-tight text-amber-600 dark:text-amber-400"
                        title={matchingStatus.match_reason}
                    >
                        <AlertCircle className="mr-1 inline h-2.5 w-2.5 align-[-1px]" />
                        {matchingStatus.match_reason}
                    </p>
                )}
            </section>

            {/* Settlements */}
            <section className="flex flex-col gap-2 p-3 md:w-[26%] md:min-w-[200px]">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        <Database className="h-3 w-3 text-blue-500" /> Settlements 24h
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                        ฿
                        {(settlementStats?.total_settled_value ?? 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                </div>

                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="absolute left-0 top-0 h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${confirmedPct}%` }}
                    />
                    <div
                        className="absolute top-0 h-full bg-amber-500 transition-all duration-500"
                        style={{ left: `${confirmedPct}%`, width: `${pendingPct}%` }}
                    />
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex items-center justify-center gap-1 rounded-md border border-emerald-500/10 bg-emerald-500/5 px-1 py-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span className="font-mono text-xs font-semibold text-emerald-600">
                            {confirmed}
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 rounded-md border border-amber-500/10 bg-amber-500/5 px-1 py-1">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span className="font-mono text-xs font-semibold text-amber-600">
                            {pending}
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 rounded-md border border-destructive/10 bg-destructive/5 px-1 py-1">
                        <AlertCircle className="h-3 w-3 text-destructive" />
                        <span className="font-mono text-xs font-semibold text-destructive">
                            {failed}
                        </span>
                    </div>
                </div>
            </section>

            {/* Recent matches + my orders */}
            <section className="flex min-h-0 flex-1 flex-col p-3">
                <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        Recent Matches
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        My Orders
                        <span className="font-mono font-semibold text-foreground">
                            {userStats?.active_orders || 0}
                        </span>
                    </span>
                </div>

                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                    {recentMatches.length === 0 ? (
                        <p className="py-3 text-center text-[10px] text-muted-foreground">
                            No matches yet — live matches appear here as orders cross.
                        </p>
                    ) : (
                        recentMatches.map((m) => (
                            <div
                                key={m.id}
                                className="flex items-center justify-between rounded bg-muted/30 px-2 py-1 text-xs duration-300 animate-in fade-in slide-in-from-top-1"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Zap className="h-3 w-3 text-amber-500" />
                                    <span className="font-mono font-medium text-foreground">
                                        {m.energy.toFixed(2)} kWh
                                    </span>
                                    <span className="text-muted-foreground">@</span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                        ฿{m.price.toFixed(2)}
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                    {m.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                <span className="mt-1 text-right font-mono text-[9px] text-muted-foreground/50">
                    Updated {lastUpdated.toLocaleTimeString()}
                </span>
            </section>
        </div>
    )
})

export default P2PActivityPanel
