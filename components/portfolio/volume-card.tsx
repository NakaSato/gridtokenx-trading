'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent } from '../ui/card'
import { TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { defaultApiClient } from '@/lib/api-client'
import { Skeleton } from '../ui/skeleton'

export function VolumeCard() {
  const { user } = useAuth()
  const [volume, setVolume] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVolume = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Try to get user's trading volume from analytics API
        const response = await defaultApiClient.getUserAnalytics({ timeframe: '7d' })
        if (response.data && response.data.overall) {
          setVolume(response.data.overall.total_volume_kwh)
        }
      } catch (error) {
        console.error('Failed to fetch volume:', error)
        setVolume(0)
      } finally {
        setLoading(false)
      }
    }

    fetchVolume()
  }, [user])

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  return (
    <Card className="w-full rounded-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-medium text-muted-foreground">7 Day Volume</h1>
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <div className="text-3xl font-bold text-foreground">{formatValue(volume)} kWh</div>
        )}
      </CardContent>
    </Card>
  )
}
