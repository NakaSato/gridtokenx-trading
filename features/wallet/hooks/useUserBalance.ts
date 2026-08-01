'use client'

import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api/useApiClient'
import { queryKeys } from '@/lib/query/keys'
import { BALANCE_POLL_MS } from '@/features/wallet/lib/balance-poll'
import type { TokenBalance } from '@/types/auth'

/**
 * Token + SOL balance for a wallet. Replaces the hooks/useApi.ts version,
 * which never issued an initial request — the sidebar's balance panel could
 * not populate.
 *
 * Shares `queryKeys.wallet.balance` — and so one cache entry and one poll —
 * with `useWalletBalance` in this folder and its namesake in
 * `features/portfolio/hooks/usePortfolio.ts`. Keep the queryFn in step with
 * those two: on a shared key whichever hook mounts first defines the fetch, so
 * they have to be interchangeable.
 */
export function useUserBalance(token?: string, walletAddress?: string) {
  const client = useApiClient(token)

  const { data, isLoading, error, refetch } = useQuery<TokenBalance>({
    queryKey: queryKeys.wallet.balance(walletAddress),
    queryFn: async () => {
      const res = await client.getBalance(walletAddress)
      if (res.error) throw new Error(res.error)
      // Throw rather than cache null: the key is shared with hooks typed
      // non-nullable, and a bodyless 200 is a fault, not an empty wallet.
      if (!res.data) throw new Error('Balance response contained no data')
      return res.data
    },
    // Requires the address too: getBalance now rejects a missing one rather
    // than answering with a fabricated zero balance.
    enabled: !!token && !!walletAddress,
    staleTime: 5_000,
    // Without this the panel only refreshed on remount/focus, so a balance that
    // moved while the page sat open stayed wrong until the user reloaded.
    refetchInterval: BALANCE_POLL_MS,
  })

  return {
    balance: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}
