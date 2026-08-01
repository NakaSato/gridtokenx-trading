'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/provider'
import { useApiClient } from '@/lib/api/useApiClient'
import { useProfile } from '@/features/portfolio/hooks/usePortfolio'
import { useWebSocketMessage } from '@/lib/ws/useWebSocket'
import { queryKeys } from '@/lib/query/keys'
import type { CarbonBalanceResponse, CarbonCredit } from '@/types/features'

/** Baseline poll. The socket handles the common case; this covers credits that
 *  accrue from something other than a settlement we're subscribed to. */
const POLL_MS = 60_000

/**
 * Carbon balance + earning history for the signed-in user.
 *
 * Both endpoints are token-scoped and take no owner parameter, so the cache is
 * keyed by the profile id — otherwise a second account signing in on the same
 * tab would read the first one's credits out of the cache.
 *
 * Credits accrue when energy trades settle, so `settlement_complete` on the
 * trades channel invalidates both queries: the balance moves within a second of
 * the settlement toast rather than up to a poll interval later.
 */
export function useCarbonCredits() {
  const { token, isAuthenticated } = useAuth()
  const client = useApiClient(token ?? undefined)
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()
  const ownerId = profile?.id

  const enabled = !!token && isAuthenticated

  const balanceQuery = useQuery<CarbonBalanceResponse | null>({
    queryKey: queryKeys.carbon.balance(ownerId),
    queryFn: async () => {
      const res = await client.getCarbonBalance()
      if (res.error) throw new Error(res.error)
      return res.data ?? null
    },
    enabled,
    staleTime: 30_000,
    refetchInterval: POLL_MS,
  })

  const historyQuery = useQuery<CarbonCredit[]>({
    queryKey: queryKeys.carbon.history(ownerId),
    queryFn: async () => {
      const res = await client.getCarbonHistory()
      if (res.error) throw new Error(res.error)
      return res.data ?? []
    },
    enabled,
    staleTime: 30_000,
    refetchInterval: POLL_MS,
  })

  // Stable identity: useWebSocketMessage re-subscribes whenever the handler
  // changes, so an inline closure would tear the listener down every render.
  const onSettlement = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.carbon.balance(ownerId),
    })
    queryClient.invalidateQueries({
      queryKey: queryKeys.carbon.history(ownerId),
    })
  }, [queryClient, ownerId])

  useWebSocketMessage(
    'trades',
    'settlement_complete',
    onSettlement,
    token ?? undefined
  )

  return {
    balance: balanceQuery.data ?? null,
    history: historyQuery.data ?? [],
    // Only the first load blocks the UI; background refetches must not flash
    // the page back to a spinner.
    isLoading: balanceQuery.isLoading || historyQuery.isLoading,
    isFetching: balanceQuery.isFetching || historyQuery.isFetching,
    error: balanceQuery.error ?? historyQuery.error ?? null,
    refetch: () => {
      balanceQuery.refetch()
      historyQuery.refetch()
    },
  }
}
