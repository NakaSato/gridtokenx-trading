'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { P2P_CONFIG } from '@/lib/constants'

const MIN_KWH = P2P_CONFIG.minOrderKwh
const MAX_KWH = P2P_CONFIG.maxOrderKwh

interface AmountInputProps {
  amount: string
  setAmount: (amount: string) => void
  // Retained for API compatibility with OrderForm; quick pills are now a
  // percentage of the fixed MAX order size, not of balance.
  balance?: number | null
}

export function AmountInput({
  amount,
  setAmount,
}: AmountInputProps) {
  const numericAmount = parseFloat(amount)
  const hasValue = amount.trim() !== ''
  const isInvalid = hasValue && (Number.isNaN(numericAmount) || numericAmount < MIN_KWH || numericAmount > MAX_KWH)

  const handleQuickAmount = (percent: number) => {
    // Percentage of the max order size (MAX_KWH), e.g. 25% of 5 kWh = 1.25.
    setAmount(((MAX_KWH * percent) / 100).toFixed(2))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">
          Amount
        </Label>
        <span className="text-xs text-muted-foreground">
          Range: {MIN_KWH}–{MAX_KWH} kWh
        </span>
      </div>
      <div className="relative">
        <Input
          data-testid="order-amount-input"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={MIN_KWH}
          max={MAX_KWH}
          step="0.01"
          aria-invalid={isInvalid}
          className={cn(
            "h-14 appearance-none rounded-xl border border-muted bg-secondary pr-14 text-right font-mono text-xl font-bold transition-colors duration-200",
            "placeholder:text-muted-foreground",
            "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
            isInvalid
              ? "text-destructive border-destructive focus-visible:ring-destructive/50 focus-visible:border-destructive"
              : hasValue
                ? "text-primary border-primary"
                : "text-foreground"
          )}
        />
        <span className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold transition-colors duration-200",
          isInvalid ? "text-destructive/70" : hasValue ? "text-primary/70" : "text-muted-foreground"
        )}>
          kWh
        </span>
      </div>
      {isInvalid && (
        <p role="alert" className="text-xs font-medium text-destructive">
          Amount must be between {MIN_KWH} and {MAX_KWH} kWh
        </p>
      )}
      {/* Quick Amount Pills - Design System */}
      <div className="flex gap-2">
        {P2P_CONFIG.quickAmountPercentages.map((percent) => (
          <Button
            key={percent}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickAmount(percent)}
            className="h-8 flex-1 rounded-lg border-border bg-transparent text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {percent}%
          </Button>
        ))}
      </div>
    </div>
  )
}
