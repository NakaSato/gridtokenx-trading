'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api/useApiClient'
import { queryKeys } from '@/lib/query/keys'

/**
 * P2P market reference data. These replace the hand-rolled hooks in the old
 * hooks/useApi.ts, whose useApiRequest never ran an initial fetch — market
 * config and market prices stayed null forever, silently disabling the order
 * form's min/max price validation and zeroing wheeling charges.
 */

/** Exchange-level order constraints (min/max price, size limits). */
export function useMarketConfig(token?: string) {
  const client = useApiClient(token)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKeys.p2p.all(), 'market-config'],
    queryFn: async () => {
      const res = await client.getMarketConfig()
      if (res.error) throw new Error(res.error)
      return res.data ?? null
    },
    staleTime: 5 * 60_000,
  })

  return {
    marketConfig: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}

/**
 * Best bid / best ask of the live P2P book — the real spread. Used to warn
 * when a limit order is priced outside it and to estimate a market order's
 * fill price (market orders carry no price of their own).
 */
export function useP2PBestPrices(token?: string) {
  const client = useApiClient(token)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKeys.p2p.all(), 'order-book'],
    queryFn: async () => {
      const res = await client.getP2POrderBook()
      if (res.error) throw new Error(res.error)
      return res.data ?? null
    },
    // The book moves continuously; the order form used to drive this with its
    // own setInterval.
    refetchInterval: 10_000,
  })

  const bestBid = useMemo(() => {
    const bids: any[] = (data as any)?.bids || []
    const prices = bids
      .map((b) => Number(b.price_per_kwh ?? b.price ?? 0))
      .filter((p) => p > 0)
    return prices.length ? Math.max(...prices) : null
  }, [data])

  const bestAsk = useMemo(() => {
    const asks: any[] = (data as any)?.asks || []
    const prices = asks
      .map((a) => Number(a.price_per_kwh ?? a.price ?? 0))
      .filter((p) => p > 0)
    return prices.length ? Math.min(...prices) : null
  }, [data])

  return {
    bestBid,
    bestAsk,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}

/**
 * Per-zone wheeling charges + loss factors, backed by
 * /api/v1/markets/p2p/market-prices — a real endpoint, unlike the mocked
 * /api/v1/quotes (see STUB WARNING in lib/api/trading.ts calculateP2PCost).
 */
export function useP2PMarketPrices(token?: string) {
  const client = useApiClient(token)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKeys.p2p.all(), 'market-prices'],
    queryFn: async () => {
      const res = await client.getP2PMarketPrices()
      if (res.error) throw new Error(res.error)
      return res.data ?? null
    },
    staleTime: 60_000,
  })

  return {
    marketPrices: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}
