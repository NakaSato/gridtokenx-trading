'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import type { UserTransaction } from '@/types/transactions'
import { Badge } from './ui/badge'
import { Loader2 } from 'lucide-react'

interface TransactionHistoryProps {
  limit?: number
  useMockData?: boolean // Set to true to use mock data instead of API
}

// Mock data for testing when API is not available
const MOCK_TRANSACTIONS: UserTransaction[] = [
  {
    transaction_type: 'EnergyTrade',
    operation_id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    status: 'confirmed',
    signature: '5j7s8K9mN2pQ3rT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ0',
    attempts: 1,
    last_error: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    submitted_at: new Date(Date.now() - 3500000).toISOString(),
    confirmed_at: new Date(Date.now() - 3000000).toISOString(),
    settled_at: null,
  },
  {
    transaction_type: 'TokenMint',
    operation_id: '550e8400-e29b-41d4-a716-446655440002',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    status: 'failed',
    signature: null,
    attempts: 3,
    last_error: 'Insufficient funds',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    submitted_at: new Date(Date.now() - 7100000).toISOString(),
    confirmed_at: null,
    settled_at: null,
  },
  {
    transaction_type: 'Stake',
    operation_id: '550e8400-e29b-41d4-a716-446655440003',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    status: 'pending',
    signature: null,
    attempts: 1,
    last_error: null,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    submitted_at: null,
    confirmed_at: null,
    settled_at: null,
  },
]

const getTransactionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'EnergyTrade': 'TRADE ENERGY',
    'TokenMint': 'MINT GRIDX',
    'TokenBurn': 'BURN GRIDX',
    'Stake': 'STAKE GRIDX',
    'Unstake': 'UNSTAKE GRIDX',
    'Reward': 'REWARD',
  }
  return labels[type] || type.toUpperCase()
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'confirmed': 'bg-green-500/10 text-green-500 border-green-500/20',
    'settled': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'processing': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'submitted': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    'failed': 'bg-red-500/10 text-red-500 border-red-500/20',
  }
  return colors[status] || 'bg-secondary text-secondary-foreground'
}

export default function TransactionHistory({
  limit = 50,
  useMockData = false,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<UserTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    const fetchTransactions = async () => {
      // Use mock data if enabled
      if (useMockData) {
        setLoading(true)
        setTimeout(() => {
          setTransactions(MOCK_TRANSACTIONS)
          setLoading(false)
        }, 500) // Simulate network delay
        return
      }

      if (!token) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const apiClient = createApiClient(token)
        const response = await apiClient.getUserTransactions({ limit })

        if (response.error) {
          setError(response.error)
        } else if (response.data) {
          setTransactions(response.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [token, limit, useMockData])

  return (
    <div className="flex h-full flex-col rounded-lg border bg-secondary/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-primary">
        Transaction History
        {useMockData && (
          <span className="ml-2 text-xs font-normal text-yellow-500">(Mock Data)</span>
        )}
      </h3>
      
      <div className="flex-1 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="space-y-2">
            <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-1 text-center text-xs text-red-500">
              {error}
            </div>
          </div>
        ) : !token && !useMockData ? (
          <div className="py-4 text-center text-xs text-secondary-foreground">
            Please connect your wallet to view transactions
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-4 text-center text-xs text-secondary-foreground">
            No transactions yet
          </div>
        ) : (
          transactions.map((txn, index) => (
            <div
              key={txn.operation_id}
              className={cn(
                'border-b border-secondary pb-3 last:border-b-0',
                index === 0 && 'animate-pulse'
              )}
            >
              <div className="mb-2 flex items-start justify-between">
                <span className="text-xs font-medium">
                  {getTransactionTypeLabel(txn.transaction_type)}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-semibold uppercase',
                    getStatusColor(txn.status)
                  )}
                >
                  {txn.status}
                </Badge>
              </div>

              {txn.signature && (
                <div className="mb-1 text-xs text-secondary-foreground">
                  <span className="font-medium">Signature:</span>{' '}
                  <span className="font-mono">
                    {txn.signature.slice(0, 8)}...{txn.signature.slice(-8)}
                  </span>
                </div>
              )}

              {txn.last_error && (
                <div className="mb-1 text-xs text-red-500">
                  Error: {txn.last_error}
                </div>
              )}

              {txn.attempts > 1 && (
                <div className="mb-1 text-xs text-secondary-foreground">
                  Attempts: {txn.attempts}
                </div>
              )}

              <div className="text-xs text-secondary-foreground">
                {format(new Date(txn.created_at), 'MMM d, h:mm a')}
                {txn.confirmed_at && (
                  <span className="ml-2 text-green-500">
                    • Confirmed {format(new Date(txn.confirmed_at), 'h:mm a')}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
