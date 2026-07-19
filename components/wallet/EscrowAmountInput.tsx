'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const QUICK_PERCENTAGES = [25, 50, 75, 100]

interface EscrowAmountInputProps {
  amount: string
  setAmount: (amount: string) => void
  /** Balance the quick pills and max validation are computed against. */
  max: number | null
  /** Mint decimals — quick-pill values are rounded to this precision. */
  decimals: number
  label?: string
  unit?: string
}

export function EscrowAmountInput({
  amount,
  setAmount,
  max,
  decimals,
  label = 'Amount',
  unit = 'GRX',
}: EscrowAmountInputProps) {
  const numericAmount = parseFloat(amount)
  const hasValue = amount.trim() !== ''
  const exceedsMax = max !== null && !Number.isNaN(numericAmount) && numericAmount > max
  const isInvalid = hasValue && (Number.isNaN(numericAmount) || numericAmount <= 0 || exceedsMax)

  const handleQuickAmount = (percent: number) => {
    if (max === null) return
    const value = (max * percent) / 100
    setAmount(value.toFixed(Math.min(decimals, 6)))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {max !== null && (
          <span className="text-xs text-muted-foreground">
            Max: {max.toLocaleString(undefined, { maximumFractionDigits: 6 })} {unit}
          </span>
        )}
      </div>
      <div className="relative">
        <Input
          data-testid="escrow-amount-input"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={0}
          step="0.000001"
          aria-invalid={isInvalid}
          className={cn(
            'h-14 appearance-none rounded-xl border border-muted bg-secondary pr-14 text-right font-mono text-xl font-bold transition-colors duration-200',
            'placeholder:text-muted-foreground',
            'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary',
            isInvalid
              ? 'text-destructive border-destructive focus-visible:ring-destructive/50 focus-visible:border-destructive'
              : hasValue
                ? 'text-primary border-primary'
                : 'text-foreground'
          )}
        />
        <span
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold transition-colors duration-200',
            isInvalid ? 'text-destructive/70' : hasValue ? 'text-primary/70' : 'text-muted-foreground'
          )}
        >
          {unit}
        </span>
      </div>
      {isInvalid && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {exceedsMax
            ? `Amount exceeds available ${max?.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${unit}`
            : 'Enter an amount greater than zero'}
        </p>
      )}
      <div className="flex gap-2">
        {QUICK_PERCENTAGES.map((percent) => (
          <Button
            key={percent}
            type="button"
            variant="outline"
            size="sm"
            disabled={max === null || max <= 0}
            onClick={() => handleQuickAmount(percent)}
            className="h-8 flex-1 rounded-lg border-border bg-transparent text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {percent === 100 ? 'Max' : `${percent}%`}
          </Button>
        ))}
      </div>
    </div>
  )
}
