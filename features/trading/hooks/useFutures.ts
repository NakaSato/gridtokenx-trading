'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/provider'
import { useApiClient } from '@/lib/api/useApiClient'
import { useProfile } from '@/features/portfolio/hooks/usePortfolio'
import { queryKeys } from '@/lib/query/keys'
import type { FuturesProduct, FuturesPosition, OrderBook } from '@/types/futures'

/** The book moves fastest and is what a trader actually watches. */
const ORDER_BOOK_POLL_MS = 2_000
/** Product marks and position PnL. */
const MARKET_POLL_MS = 5_000

/**
 * Futures market + account data.
 *
 * Replaces two hand-rolled `setInterval` loops in `app/futures/page.tsx`. Those
 * also carried a bug: the market callback closed over `selectedProduct`, so
 * every product switch tore down and restarted the 5s timer. Splitting the
 * fetches by cache key means selecting a product only affects the book query.
 *
 * Products are public; positions need a session. They are separate queries so
 * an anonymous visitor still gets live marks instead of one combined fetch that
 * has to branch on the token.
 */
export function useFuturesProducts() {
  const { token } = useAuth()
  const client = useApiClient(token ?? undefined)

  return useQuery<FuturesProduct[]>({
    queryKey: queryKeys.futures.products(),
    queryFn: async () => {
      const res = await client.getFuturesProducts()
      if (res.error) throw new Error(res.error)
      return res.data ?? []
    },
    refetchInterval: MARKET_POLL_MS,
  })
}

export function useFuturesPositions() {
  const { token } = useAuth()
  const client = useApiClient(token ?? undefined)
  const { data: profile } = useProfile()

  return useQuery<FuturesPosition[]>({
    queryKey: queryKeys.futures.positions(profile?.id),
    queryFn: async () => {
      const res = await client.getFuturesPositions()
      if (res.error) throw new Error(res.error)
      return res.data ?? []
    },
    enabled: !!token,
    refetchInterval: MARKET_POLL_MS,
  })
}

export function useFuturesOrderBook(productId?: string) {
  const { token } = useAuth()
  const client = useApiClient(token ?? undefined)

  return useQuery<OrderBook | null>({
    queryKey: queryKeys.futures.orderBook(productId ?? ''),
    queryFn: async () => {
      if (!productId) return null
      const res = await client.getFuturesOrderBook(productId)
      if (res.error) throw new Error(res.error)
      return res.data ?? null
    },
    enabled: !!productId,
    refetchInterval: ORDER_BOOK_POLL_MS,
    // Keep the previous book on screen while the newly selected one loads,
    // rather than blanking the panel on every switch.
    placeholderData: (prev) => prev,
  })
}
