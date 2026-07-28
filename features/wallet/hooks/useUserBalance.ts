'use client'

import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api/useApiClient'
import { queryKeys } from '@/lib/query/keys'

/**
 * Token + SOL balance for a wallet. Replaces the hooks/useApi.ts version,
 * which never issued an initial request — the sidebar's balance panel could
 * not populate.
 */
export function useUserBalance(token?: string, walletAddress?: string) {
  const client = useApiClient(token)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.wallet.balance(walletAddress),
    queryFn: async () => {
      const res = await client.getBalance(walletAddress)
      if (res.error) throw new Error(res.error)
      return res.data ?? null
    },
    // Requires the address too: getBalance now rejects a missing one rather
    // than answering with a fabricated zero balance.
    enabled: !!token && !!walletAddress,
    staleTime: 30_000,
  })

  return {
    balance: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}
