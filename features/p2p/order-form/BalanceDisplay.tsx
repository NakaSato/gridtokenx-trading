'use client'
import React from 'react'
import { Wallet2 } from 'lucide-react'
import {
  BALANCE_UNAVAILABLE_HINT,
  formatBalance,
} from '@/features/wallet/lib/balance-display'
import { Spinner } from '@/components/ui/spinner'

interface BalanceDisplayProps {
  token: string | null
  /** `null` means "could not read" — rendered as "—", never as 0. */
  balance: number | null
  balanceLoading: boolean
}

export function BalanceDisplay({
  token,
  balance,
  balanceLoading,
}: BalanceDisplayProps) {
  if (!token) return null

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Wallet2 className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Available Balance
        </span>
      </div>
      <div
        className="flex items-center gap-2"
        title={
          !balanceLoading && balance === null
            ? BALANCE_UNAVAILABLE_HINT
            : undefined
        }
      >
        <span className="font-mono text-base font-semibold text-foreground">
          {balanceLoading ? (
            <span className="inline-flex items-center gap-1">
              <Spinner className="h-3.5 w-3.5" />
              ...
            </span>
          ) : (
            formatBalance(balance)
          )}
        </span>
        <span className="text-sm font-medium text-muted-foreground">GRX</span>
      </div>
    </div>
  )
}
