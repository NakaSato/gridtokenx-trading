'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AlertTriangle, TrendingUp } from 'lucide-react'

interface PriceInputProps {
  price: string
  setPrice: (price: string) => void
  priceType: 'market' | 'limit'
  setPriceType: (type: 'market' | 'limit') => void
  /** Highest resting buy price, from the live order book. Null while unknown/empty. */
  bestBid?: number | null
  /** Lowest resting sell price, from the live order book. Null while unknown/empty. */
  bestAsk?: number | null
  /** Set when the typed limit price won't cross the spread and will rest unfilled. */
  fillWarning?: string | null
}

export function PriceInput({
  price,
  setPrice,
  priceType,
  setPriceType,
  bestBid = null,
  bestAsk = null,
  fillWarning = null,
}: PriceInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">
          Price per kWh
        </Label>
        {priceType === 'market' && (
          <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600">
            Market Price
          </span>
        )}
      </div>
      <div className="relative">
        <Input
          data-testid="order-price-input"
          type="number"
          placeholder="4.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min="0.01"
          step="0.01"
          disabled={priceType === 'market'}
          className={cn(
            "h-14 appearance-none rounded-xl border border-muted bg-secondary pr-16 text-right font-mono text-xl font-bold transition-colors duration-200",
            "placeholder:text-muted-foreground",
            "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
            priceType === 'market' && "cursor-not-allowed bg-muted text-muted-foreground",
            price && priceType !== 'market'
              ? "text-primary border-primary"
              : "text-foreground"
          )}
        />
        <span className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold transition-colors duration-200",
          price && priceType !== 'market' ? "text-primary/70" : "text-muted-foreground"
        )}>
          THB
        </span>
      </div>

      {/* Market/Limit Toggle */}
      <div className="flex items-center gap-1 bg-muted/80 rounded-xl p-1 border border-border/50">
        <button
          type="button"
          onClick={() => setPriceType('market')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex-1',
            priceType === 'market'
              ? 'bg-background text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => setPriceType('limit')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex-1',
            priceType === 'limit'
              ? 'bg-background text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Limit
        </button>
      </div>
      {priceType === 'limit' && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {bestBid !== null && bestAsk !== null
            ? `Spread: ${bestBid.toFixed(2)} - ${bestAsk.toFixed(2)} THB`
            : 'Spread: no active quotes yet'}
        </p>
      )}
      {fillWarning && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{fillWarning}</span>
        </p>
      )}
    </div>
  )
}
