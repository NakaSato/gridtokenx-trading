'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent } from '../ui/card'
import { Zap, Award } from 'lucide-react'
import { useState, useEffect } from 'react'
import { defaultApiClient } from '@/lib/api-client'
import { Skeleton } from '../ui/skeleton'

export function PointsCard() {
  const { user } = useAuth()
  const { publicKey } = useWallet()
  const [points, setPoints] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPoints = async () => {
      const walletAddress = user?.wallet_address || publicKey?.toString()

      if (!walletAddress) {
        setLoading(false)
        return
      }

      try {
        // Get token balance - energy credits = token balance
        const response = await defaultApiClient.getBalance(walletAddress)
        if (response.data) {
          // Use token_balance_raw as energy credits/points
          const tokenBalance = response.data.token_balance_raw || 0
          setPoints(tokenBalance)
        }
      } catch (error) {
        console.error('Failed to fetch points:', error)
        setPoints(0)
      } finally {
        setLoading(false)
      }
    }

    fetchPoints()
  }, [user?.wallet_address, publicKey])

  const formatPoints = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`
    }
    return value.toFixed(0)
  }

  return (
    <Card className="w-full rounded-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-medium text-muted-foreground">Energy Credits</h1>
          </div>
          <Zap className="h-5 w-5 text-green-500" />
        </div>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">{formatPoints(points)}</span>
            <span className="text-sm text-muted-foreground">GRX</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
