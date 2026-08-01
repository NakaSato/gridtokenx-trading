'use client'

import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/provider'
import { useApiClient } from '@/lib/api/useApiClient'
import { useProfile } from '@/features/portfolio/hooks/usePortfolio'
import { useTransactionUpdates } from '@/features/trading/hooks/useTransactionUpdates'
import { useWebSocketMessage } from '@/lib/ws/useWebSocket'
import { queryKeys } from '@/lib/query/keys'
import type { TransactionStatusUpdate } from '@/types/ws'
import type { UserTransaction } from '@/types/transactions'

const PAGE_LIMIT = 50
/** Backstop only — the socket covers both new rows and status changes. */
const POLL_MS = 30_000

/**
 * The signed-in user's transaction list, kept current from two directions.
 *
 * **Status changes on rows already on screen** arrive as
 * `transaction_status_update` and are patched straight into the cache. The
 * patch matches on `tx.id === update.operation_id`, which makes re-applying a
 * frame a no-op — the same idempotence argument as `lib/ws/useSequencedChannel.ts`,
 * and the reason a concurrent refetch can't fight with it.
 *
 * **Rows that don't exist yet** cannot be patched in: the WS payload carries a
 * status, not a transaction. A settlement therefore invalidates the query so the
 * new row is fetched. This is what the previous one-shot `useEffect` never did —
 * a fresh trade stayed invisible until the user reloaded the page.
 */
export function useWalletActivity() {
  const { token } = useAuth()
  const client = useApiClient(token ?? undefined)
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()

  // Keyed per user: the endpoint is token-scoped, so an unkeyed cache would
  // serve one account's transactions to the next one signed in. Memoized
  // because the WS handlers close over it and useWebSocketMessage re-subscribes
  // when its handler identity changes — a fresh array every render would redial
  // the listener every render.
  const queryKey = useMemo(
    () => queryKeys.wallet.activity(profile?.id),
    [profile?.id]
  )

  const query = useQuery<UserTransaction[]>({
    queryKey,
    queryFn: async () => {
      const res = await client.getUserTransactions({ limit: PAGE_LIMIT })
      if (res.error) throw new Error(res.error)
      return res.data ?? []
    },
    enabled: !!token,
    refetchInterval: POLL_MS,
  })

  const patchStatus = useCallback(
    (update: TransactionStatusUpdate) => {
      queryClient.setQueryData<UserTransaction[]>(queryKey, (prev) =>
        prev?.map((tx) =>
          tx.id === update.operation_id
            ? { ...tx, status: update.new_status, signature: update.signature }
            : tx
        )
      )
    },
    [queryClient, queryKey]
  )

  const { latestUpdate } = useTransactionUpdates({
    showToasts: false,
    onUpdate: patchStatus,
  })

  // Stable identity: useWebSocketMessage re-subscribes when the handler
  // changes, so an inline closure would redial the listener every render.
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  useWebSocketMessage(
    'trades',
    'settlement_complete',
    invalidate,
    token ?? undefined
  )
  useWebSocketMessage(
    'trades',
    'trade_executed',
    invalidate,
    token ?? undefined
  )

  return {
    transactions: query.data ?? [],
    // isLoading is first-load only, so a background refetch never swaps the
    // populated list back to a spinner.
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    /** Most recent WS status change — drives the row highlight. */
    latestUpdate,
  }
}
