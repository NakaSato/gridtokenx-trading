'use client'

import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export interface Transaction {
  id: string
  type: 'BUY ENERGY' | 'SELL ENERGY' | 'TRADE ENERGY' | 'STAKE GRIDX'
  amount: string
  price: string
  pnl: number
  timestamp: Date
}

interface TransactionHistoryProps {
  transactions: Transaction[]
}

export default function TransactionHistory({
  transactions,
}: TransactionHistoryProps) {
  return (
    <div className="bg-secondary/50 flex h-full flex-col rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold text-primary">
        Energy Trading History
      </h3>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="py-4 text-center text-xs text-secondary-foreground">
            No transactions yet
          </div>
        ) : (
          transactions.map((txn, index) => (
            <div
              key={txn.id}
              className={cn(
                'border-b border-secondary pb-2 last:border-b-0',
                index === 0 && 'animate-pulse'
              )}
            >
              <div className="mb-1 flex items-start justify-between">
                <span className="text-xs font-medium">{txn.type}</span>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    txn.pnl > 0 ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {txn.pnl > 0 ? '+' : ''}
                  {txn.pnl} GRIDX
                </span>
              </div>
              <div className="mb-1 text-xs text-secondary-foreground">
                {txn.amount} • {txn.price}
              </div>
              <div className="text-xs text-secondary-foreground">
                {format(txn.timestamp, 'MMM d, h:mm a')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
