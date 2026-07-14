'use client'

import React from 'react'
import { Separator } from '@/components/ui/separator'

interface OrderSummaryProps {
  amount: string
  priceType: 'market' | 'limit'
  /** THB/kWh actually used for the total — typed price for limit, best opposing quote for market. */
  effectivePrice: number
  /** Final total in THB: energy cost + wheeling charge + loss, precomputed by the caller. */
  total: number
  wheelingCharge?: number
  lossCost?: number
  lossFactor?: number
}

export function OrderSummary({
  amount,
  priceType,
  effectivePrice,
  total,
  wheelingCharge = 0,
  lossCost = 0,
  lossFactor = 0,
}: OrderSummaryProps) {
  const hasFees = wheelingCharge > 0 || lossCost > 0

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">Amount</span>
        <span className="font-mono font-semibold">{amount || '0'} kWh</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">Price</span>
        <span className="font-mono font-semibold">
          {priceType === 'market'
            ? effectivePrice > 0
              ? `~฿${effectivePrice.toFixed(2)}/kWh (est.)`
              : 'Market (no quotes yet)'
            : `฿${effectivePrice.toFixed(2)}/kWh`}
        </span>
      </div>
      {hasFees && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Wheeling Charge</span>
            <span className="font-mono font-semibold">฿{wheelingCharge.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">
              Loss ({(lossFactor * 100).toFixed(1)}%)
            </span>
            <span className="font-mono font-semibold text-destructive/80">
              ฿{lossCost.toFixed(2)}
            </span>
          </div>
        </>
      )}
      <Separator className="my-2" />
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-foreground">Total</span>
        <span className="font-mono text-2xl font-bold text-foreground">
          ฿{total.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
