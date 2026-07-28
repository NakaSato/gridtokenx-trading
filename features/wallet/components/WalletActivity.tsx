'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Loader2, Copy, RefreshCw } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/features/auth/provider'
import { useTransactionUpdates } from '@/hooks/useTransactionUpdates'
import type { UserTransaction } from '@/types/transactions'
import toast from 'react-hot-toast'

/**
 * Human-readable label for a transaction type. Backend currently emits
 * 'trading' for every settlement row; the richer types are kept for
 * forward-compat with other feeds.
 */
function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    trading: 'Energy Trade',
    EnergyTrade: 'Energy Trade',
    TokenMint: 'Token Mint',
    TokenBurn: 'Token Burn',
    Stake: 'Stake',
    Unstake: 'Unstake',
    Reward: 'Reward',
  }
  return labels[type] || type
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-500/10 text-green-500 border-green-500/20',
    settled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    submitted: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  }
  return colors[status] || 'bg-secondary text-secondary-foreground'
}

function getTransactionIcon(type: string): string {
  const icons: Record<string, string> = {
    trading: '⚡',
    EnergyTrade: '⚡',
    TokenMint: '🪙',
    TokenBurn: '🔥',
    Stake: '📥',
    Unstake: '📤',
    Reward: '🎁',
  }
  return icons[type] || '📋'
}

export default function WalletActivity() {
  const { token } = useAuth()
  const [transactions, setTransactions] = useState<UserTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real-time updates: best-effort merge of the WS status feed into the list.
  // Keyed on the settlement id (WS `operation_id` ↔ REST `id`); a mismatch is a
  // harmless no-op. Signature is runtime-only and only ever set here.
  const { latestUpdate } = useTransactionUpdates({
    showToasts: false,
    onUpdate: (update) => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === update.operation_id
            ? { ...tx, status: update.new_status, signature: update.signature }
            : tx
        )
      )
    },
  })

  const fetchTransactions = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const apiClient = createApiClient(token)
      const response = await apiClient.getUserTransactions({ limit: 50 })

      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        // Backend returns a bare array of TransactionData.
        setTransactions(response.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const truncateId = (id: string) => `${id.slice(0, 8)}...${id.slice(-4)}`

  return (
    <div className="flex h-[calc(100vh-280px)] flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-primary pb-2">
        <span className="text-sm font-medium">Activity</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={fetchTransactions}
          disabled={loading}
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Transaction List */}
      <ScrollArea className="flex-grow pr-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="space-y-2">
            <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-500">
              {error}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={fetchTransactions}
            >
              Retry
            </Button>
          </div>
        ) : !token ? (
          <div className="py-4 text-center text-xs text-secondary-foreground">
            Please connect your wallet to view activity
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-4 text-center text-xs text-secondary-foreground">
            No transactions found
          </div>
        ) : (
          <div className="flex w-full flex-col space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className={cn(
                  'rounded-md border border-secondary bg-secondary/30 p-3 transition-colors hover:bg-secondary/50',
                  latestUpdate?.operation_id === tx.id && 'ring-1 ring-primary'
                )}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTransactionIcon(tx.transaction_type)}</span>
                    <span className="text-sm font-medium">
                      {getTransactionTypeLabel(tx.transaction_type)}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] font-semibold uppercase', getStatusColor(tx.status))}
                  >
                    {tx.status}
                  </Badge>
                </div>

                {/* Transaction Details */}
                <div className="space-y-1 text-xs text-secondary-foreground">
                  <div className="flex items-center justify-between">
                    <span>ID:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{truncateId(tx.id)}</span>
                      <button
                        onClick={() => copyToClipboard(tx.id)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {tx.signature && (
                    <div className="flex items-center justify-between">
                      <span>Signature:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{truncateId(tx.signature)}</span>
                        <button
                          onClick={() => copyToClipboard(tx.signature!)}
                          className="text-primary hover:text-primary/80"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span>Amount:</span>
                    <span className="font-medium text-foreground">
                      {parseFloat(tx.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}{' '}
                      {tx.asset}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span>{format(new Date(tx.timestamp), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
