'use client'

import { ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { defaultApiClient } from '@/lib/api-client'
import { Skeleton } from '../ui/skeleton'

interface PortfolioStats {
  pnl: number
  pnlPercent: number
  volume: number
}

export function PortfolioCard() {
  const { user } = useAuth()
  const { publicKey } = useWallet()
  const [selectedTimeframe, setSelectedTimeframe] = useState('30D')
  const [selectedAssets, setSelectedAssets] = useState('All Assets')
  const [stats, setStats] = useState<PortfolioStats>({ pnl: 0, pnlPercent: 0, volume: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const walletAddress = user?.wallet_address || publicKey?.toString()

      if (!walletAddress) {
        setLoading(false)
        return
      }

      try {
        // Fetch trades to calculate PnL
        const tradesResponse = await defaultApiClient.getTrades({ limit: 100 })

        if (tradesResponse.data?.trades) {
          const trades = tradesResponse.data.trades

          // Calculate volume
          const totalVolume = trades.reduce((sum: number, trade: any) => {
            return sum + parseFloat(trade.total_value || trade.price || '0')
          }, 0)

          // Calculate PnL (mock - based on buy/sell difference)
          let totalBuyValue = 0
          let totalSellValue = 0

          trades.forEach((trade: any) => {
            const value = parseFloat(trade.total_value || trade.price || '0')
            if (trade.role === 'buyer' || trade.side === 'buy') {
              totalBuyValue += value
            } else {
              totalSellValue += value
            }
          })

          const pnl = totalSellValue - totalBuyValue
          const pnlPercent = totalBuyValue > 0 ? (pnl / totalBuyValue) * 100 : 0

          setStats({
            pnl,
            pnlPercent,
            volume: totalVolume,
          })
        }
      } catch (error) {
        console.error('Failed to fetch portfolio stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.wallet_address, publicKey, selectedTimeframe])

  const formatCurrency = (value: number): string => {
    const prefix = value >= 0 ? '+$' : '-$'
    return `${prefix}${Math.abs(value).toFixed(2)}`
  }

  const isProfitable = stats.pnl >= 0

  return (
    <Card className="col-span-3 h-full w-full rounded-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Select value={selectedAssets} onValueChange={setSelectedAssets}>
              <SelectTrigger asChild>
                <Button variant="outline" className="bg-transparent text-sm">
                  <SelectValue />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Assets">All Assets</SelectItem>
                <SelectItem value="Energy Tokens">Energy Tokens</SelectItem>
                <SelectItem value="SOL Only">SOL Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedTimeframe}
              onValueChange={setSelectedTimeframe}
            >
              <SelectTrigger asChild>
                <Button variant="outline" className="bg-transparent text-sm">
                  <SelectValue />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24H">24H</SelectItem>
                <SelectItem value="7D">7D</SelectItem>
                <SelectItem value="30D">30D</SelectItem>
                <SelectItem value="ALL">ALL TIME</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {/* PNL */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">P&L</span>
            {loading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <div className="flex items-center gap-1">
                <span className={`font-medium ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(stats.pnl)}
                </span>
                {isProfitable ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                  ({stats.pnlPercent >= 0 ? '+' : ''}{stats.pnlPercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          {/* Volume */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Volume</span>
            {loading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <span className="font-medium">${stats.volume.toFixed(2)}</span>
            )}
          </div>

          {/* Trade Count */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Trades</span>
            {loading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <span className="font-medium">--</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
