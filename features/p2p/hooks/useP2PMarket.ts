'use client'

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api/useApiClient'
import { queryKeys } from '@/lib/query/keys'
import { useSequencedChannel } from '@/lib/ws/useSequencedChannel'

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
    // JWT-gated upstream: without a token this 401s (x3, via QueryProvider's
    // retry: 2) instead of degrading. Wait for login rather than poll for a
    // rejection.
    enabled: !!token,
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
  const queryClient = useQueryClient()
  const bookKey = useMemo(() => [...queryKeys.p2p.all(), 'order-book'], [])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: bookKey,
    queryFn: async () => {
      const res = await client.getP2POrderBook()
      if (res.error) throw new Error(res.error)
      return res.data ?? null
    },
    // JWT-gated upstream — see useMarketConfig. Critical here: the poll below
    // would otherwise re-issue the 401 burst forever while logged out.
    enabled: !!token,
    // Was 10s. The book is now pushed over /ws/trading, so this is a safety net
    // for a gateway outage rather than the primary path — without it a dead
    // socket would freeze the spread instead of degrading to the old behaviour.
    refetchInterval: 60_000,
  })

  // No zone filter: this book is market-wide, and subscribing to a single zone
  // would silently drop the others' orders from the spread.
  useSequencedChannel({
    messageTypes: ['order_created', 'order_update', 'order_matched'],
    snapshotKey: bookKey,
    enabled: !!token,
    // Idempotent by construction: refetching a snapshot twice yields the same
    // book, so a duplicated frame costs a request and changes nothing. That is
    // what makes the outbox race (Postgres ahead of Kafka) harmless here.
    onFrame: () => {
      void queryClient.invalidateQueries({ queryKey: bookKey })
    },
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
    // JWT-gated upstream — see useMarketConfig.
    enabled: !!token,
    staleTime: 60_000,
  })

  return {
    marketPrices: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}
