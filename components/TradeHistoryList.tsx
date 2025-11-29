'use client'

import { useEffect, useState } from 'react'
import { defaultApiClient } from '@/lib/api-client'
import { TradeRecord } from '@/types/trading'
import { useAuth } from '@/contexts/AuthProvider'

export function TradeHistoryList() {
  const { user } = useAuth()
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchTrades = async () => {
      try {
        const response = await defaultApiClient.getTrades({ limit: 20 })
        if (response.error) {
          setError(response.error)
        } else if (response.data) {
          setTrades(response.data.trades)
        }
      } catch (err) {
        setError('Failed to fetch trade history')
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()
  }, [user])

  if (loading) return <div>Loading trade history...</div>
  if (error) return <div className="text-red-500">Error: {error}</div>
  if (trades.length === 0) return <div>No trades found.</div>

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Role</th>
            <th className="px-6 py-3">Quantity</th>
            <th className="px-6 py-3">Price</th>
            <th className="px-6 py-3">Total</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              className="border-b bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              <td className="px-6 py-4">
                {new Date(trade.executed_at).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    trade.role === 'buyer'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {trade.role.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4">{trade.quantity}</td>
              <td className="px-6 py-4">{trade.price}</td>
              <td className="px-6 py-4">{trade.total_value}</td>
              <td className="px-6 py-4">{trade.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
