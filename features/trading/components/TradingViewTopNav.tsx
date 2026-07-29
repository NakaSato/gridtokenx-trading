'use client'

import Image from 'next/image'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { PythIcon } from '@/components/shared/icons'
import { formatPrice } from '@/lib/formatter'
import { memo, useState } from 'react'
import MarketDetails from '@/features/trading/components/MarketDetails'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface TradingViewTopNavProps {
  symbol: string | null
  pythSymbol: string
  logo: string
  /** From usePythPrice (spot) or the selected product (futures). */
  priceData: { price: number | null }
  /** Pages pass different subsets — every stat renders only when its field exists. */
  marketData: {
    high24h?: number | null
    low24h?: number | null
    volume24h?: number | null
    change24h?: number | null
  }
  priceLoading: boolean
  marketLoading: boolean
  type: string
}

/**
 * "Crypto.GRX/THB" (a Pyth feed id) → "GRX/THB". The raw id used to leak into
 * the header with a hardcoded "/USDC" glued on, rendering
 * "Crypto.GRX/THB/USDC".
 */
function displayPair(symbol: string | null): string {
  if (!symbol) return '—'
  return symbol.replace(/^Crypto\./, '')
}

/** pyth.network wants "crypto-grx-usd", not the raw "Crypto.GRX/USD" id. */
function pythFeedUrl(pythSymbol: string): string {
  const slug = pythSymbol.toLowerCase().replace(/[./]/g, '-')
  return `https://pyth.network/price-feeds/${slug}`
}

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

export default memo(function TradingViewTopNav({
  symbol,
  pythSymbol,
  logo,
  priceData,
  marketData,
  priceLoading,
  marketLoading,
  type,
}: TradingViewTopNavProps) {
  const router = useRouter()

  const pair = displayPair(symbol)
  const isFutures = type === 'futures'
  const change = marketData.change24h
  const changeKnown = typeof change === 'number' && !Number.isNaN(change)
  const changeUp = changeKnown && change >= 0

  // Direction of the last price tick, so the big number reads like a ticker
  // instead of a static label. Falls back to the 24h-change sign before the
  // second tick arrives. Guarded setState-during-render is the React-documented
  // way to derive state from the previous render without an effect.
  const [prevPrice, setPrevPrice] = useState<number | null>(null)
  const [tick, setTick] = useState<'up' | 'down' | null>(null)
  if (priceData.price != null && priceData.price !== prevPrice) {
    if (prevPrice != null) setTick(priceData.price > prevPrice ? 'up' : 'down')
    setPrevPrice(priceData.price)
  }
  const priceTone = tick ?? (changeKnown ? (changeUp ? 'up' : 'down') : null)

  // Where the live price sits inside the 24h range, for the range meter.
  const { high24h, low24h } = marketData
  const rangeKnown =
    typeof high24h === 'number' &&
    typeof low24h === 'number' &&
    high24h > low24h &&
    typeof priceData.price === 'number'
  const rangePct = rangeKnown
    ? Math.min(
        100,
        Math.max(0, ((priceData.price! - low24h!) / (high24h! - low24h!)) * 100)
      )
    : 0

  return (
    <div className="w-full rounded-lg border border-border/60 bg-background/60 backdrop-blur-md">
      {/* Primary row: identity · live price · desktop stats · market switcher */}
      <div className="flex items-center gap-3 px-3 py-2 lg:gap-4 lg:px-4">
        {/* Instrument identity */}
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full shadow-sm ring-1 ring-border/60 lg:h-10 lg:w-10">
            <Image src={logo} alt={pair} fill className="object-cover" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-base font-bold tracking-tight text-foreground lg:text-lg">
                {pair}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'h-5 px-1.5 py-0 text-[10px] font-semibold tracking-wide',
                  isFutures
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                    : 'border-border/50 bg-secondary/30 text-muted-foreground'
                )}
              >
                {isFutures ? 'PERP' : 'SPOT'}
              </Badge>
            </div>
            <a
              href={pythFeedUrl(pythSymbol)}
              target="_blank"
              rel="noreferrer"
              title="View this feed on pyth.network"
              className="flex w-fit items-center gap-1.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <div className="h-3.5 w-3.5">
                <PythIcon />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                Pyth Oracle
              </span>
            </a>
          </div>
        </div>

        <div className="h-9 w-px shrink-0 bg-border/50" />

        {/* Live price + 24h change */}
        <div className="flex shrink-0 flex-col gap-0.5">
          {priceLoading && priceData.price == null ? (
            <Skeleton className="h-7 w-28 rounded bg-secondary/50" />
          ) : (
            <span
              className={cn(
                'font-mono text-xl font-bold tracking-tight transition-colors duration-300 lg:text-2xl',
                priceTone === 'up' && 'text-green-500',
                priceTone === 'down' && 'text-red-500',
                priceTone == null && 'text-foreground'
              )}
            >
              {priceData.price != null ? formatPrice(priceData.price) : 'N/A'}
            </span>
          )}
          {/* 24h change — rendered only when the feed provides it. A fixed
              "+2.45%" used to live here regardless of the market. */}
          {changeKnown && (
            <span
              aria-label="24h change"
              className={cn(
                'inline-flex w-fit items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                changeUp
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
              )}
            >
              {changeUp ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {changeUp ? '+' : ''}
              {change.toFixed(2)}%
            </span>
          )}
        </div>

        {/* Desktop stats. Each renders only when its data exists. */}
        <div className="no-scrollbar hidden flex-1 items-center gap-6 overflow-x-auto pl-2 lg:flex xl:gap-8">
          {high24h != null && (
            <StatItem
              label="24h High"
              value={formatPrice(high24h)}
              loading={marketLoading}
            />
          )}
          {low24h != null && (
            <StatItem
              label="24h Low"
              value={formatPrice(low24h)}
              loading={marketLoading}
            />
          )}
          {marketData.volume24h != null && (
            <StatItem
              label="24h Volume"
              value={compactNumber.format(marketData.volume24h)}
              loading={marketLoading}
            />
          )}

          {isFutures && (
            <>
              <div className="hidden h-8 w-px bg-border/50 xl:block" />
              <StatItem
                label="Funding / 8h"
                value="0.0042%"
                loading={false}
                subValue="03:22:10"
              />
              <StatItem label="Open Interest" value="$12.5M" loading={false} />
            </>
          )}

          {/* Range meter: where the live price sits between the 24h extremes.
              Replaces a hardcoded L60/S40 sentiment bar that had no data source. */}
          {rangeKnown && (
            <>
              <div className="hidden h-8 w-px bg-border/50 xl:block" />
              <div
                className="flex min-w-[110px] flex-col gap-1.5"
                role="meter"
                aria-label="Position of the live price within the 24h range"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(rangePct)}
              >
                <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>24h Range</span>
                  <span className="tabular-nums text-foreground">
                    {rangePct.toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-1.5 w-full rounded-full bg-secondary">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500/60 via-amber-500/60 to-green-500/60"
                    style={{ width: `${rangePct}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-foreground"
                    style={{ left: `calc(${rangePct}% - 1px)` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Market switcher */}
        <div
          className="ml-auto hidden shrink-0 items-center rounded-md border border-border/60 bg-secondary/30 p-0.5 lg:flex"
          role="group"
          aria-label="Market type"
        >
          <MarketTab
            active={!isFutures}
            onClick={() => isFutures && router.push('/')}
          >
            Spot
          </MarketTab>
          <MarketTab
            active={isFutures}
            onClick={() => !isFutures && router.push('/futures')}
          >
            Futures
          </MarketTab>
        </div>
      </div>

      {/* Mobile: scrollable stats strip + full details dialog */}
      <div className="flex items-center justify-between gap-3 border-t border-border/40 px-3 py-2 lg:hidden">
        <div className="no-scrollbar flex items-center gap-5 overflow-x-auto">
          {high24h != null && (
            <StatItem
              label="24h High"
              value={formatPrice(high24h)}
              loading={marketLoading}
            />
          )}
          {low24h != null && (
            <StatItem
              label="24h Low"
              value={formatPrice(low24h)}
              loading={marketLoading}
            />
          )}
          {marketData.volume24h != null && (
            <StatItem
              label="24h Volume"
              value={compactNumber.format(marketData.volume24h)}
              loading={marketLoading}
            />
          )}
        </div>
        <MarketDetails
          logo={logo}
          symbol={pair}
          tokenPrice={priceData.price ?? 0}
          high={marketData.high24h ?? 0}
          low={marketData.low24h ?? 0}
        />
      </div>
    </div>
  )
})

function MarketTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

function StatItem({
  label,
  value,
  loading,
  subValue,
}: {
  label: string
  value: string
  loading: boolean
  subValue?: string
}) {
  return (
    <div className="flex shrink-0 flex-col">
      <span className="mb-0.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        {loading ? (
          <Skeleton className="inline-block h-4 w-14 rounded bg-secondary/50" />
        ) : (
          <span className="whitespace-nowrap font-mono text-sm font-medium tabular-nums text-foreground">
            {value}
          </span>
        )}
        {subValue && !loading && (
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {subValue}
          </span>
        )}
      </div>
    </div>
  )
}
