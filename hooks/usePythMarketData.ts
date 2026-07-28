'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PRICE_FEEDS } from '@/lib/data/price-feed'
import { queryKeys } from '@/lib/query/keys'

// OHLC history comes from Pyth's TradingView shim directly — unlike spot price
// (usePythPrice), there is no BFF route for candles.
const API_ENDPOINT = 'https://benchmarks.pyth.network/v1/shims/tradingview'
const POLLING_INTERVAL = 180_000
const STALE_TIME = 30_000

interface MarketDataState {
  high24h: number | null
  low24h: number | null
  lastUpdated: number | null
  change24h: number | null
  historicalPrices: number[]
}

interface UsePythMarketDataResult {
  marketData: MarketDataState
  loading: boolean
  error: string | null
}

const initialMarketState: MarketDataState = {
  high24h: null,
  low24h: null,
  lastUpdated: null,
  change24h: null,
  historicalPrices: [],
}

/**
 * 24h high/low/change plus a 30-day close series for volatility.
 *
 * Previously hand-rolled: useState + setInterval + a module-level Map cache +
 * a request counter. The query cache supersedes all of it — staleTime replaces
 * the Map, refetchInterval replaces the interval, and de-duplication across
 * mounts replaces the rate limiter.
 */
export function usePythMarketData(token: string): UsePythMarketDataResult {
  const feed = PRICE_FEEDS.find((f) => f.token === token)

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.pyth.history(token, 'D'),
    queryFn: async (): Promise<MarketDataState> => {
      const now = Date.now()
      const thirtyDaysAgo = Math.floor(now / 1000) - 30 * 24 * 60 * 60

      const response = await fetch(
        `${API_ENDPOINT}/history?symbol=${encodeURIComponent(token)}&from=${thirtyDaysAgo}&to=${Math.floor(now / 1000)}&resolution=D`
      )
      if (!response.ok) throw new Error('Failed to fetch market data')

      const raw = await response.json()
      if (!raw.h || !raw.l || !raw.c || raw.h.length === 0 || raw.l.length === 0) {
        throw new Error('No data available')
      }

      const high = Math.max(...raw.h.slice(-1).map((h: string) => parseFloat(h)))
      const low = Math.min(...raw.l.slice(-1).map((l: string) => parseFloat(l)))
      const currentPrice = parseFloat(raw.c[raw.c.length - 1])
      const previousPrice = parseFloat(raw.o[raw.o.length - 1])

      return {
        high24h: high,
        low24h: low,
        lastUpdated: now,
        change24h: ((currentPrice - previousPrice) / previousPrice) * 100,
        historicalPrices: raw.c.map((price: string) => parseFloat(price)),
      }
    },
    enabled: !!feed,
    refetchInterval: POLLING_INTERVAL,
    staleTime: STALE_TIME,
  })

  return useMemo(
    () => ({
      marketData: data ?? initialMarketState,
      loading: isLoading,
      error: error
        ? (error as Error).message
        : feed
          ? null
          : `Price feed not found for token: ${token}`,
    }),
    [data, isLoading, error, feed, token]
  )
}

export type { MarketDataState }
