import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/features/auth/provider'
import { useWallet } from '@solana/wallet-adapter-react'
import { useProfile } from '@/features/portfolio/hooks/usePortfolio'
import { queryKeys } from '@/lib/query/keys'
import { BALANCE_POLL_MS } from '@/features/wallet/lib/balance-poll'
import type { TokenBalance } from '@/types/auth'

/**
 * Standalone hook for fetching wallet balance.
 * Resolves wallet address from profile or Solana wallet adapter.
 */
export function useWalletBalance() {
  const { token } = useAuth()
  const { publicKey } = useWallet()
  const { data: profile } = useProfile()
  const apiClient = createApiClient(token || '')

  // The connected browser wallet is the source of truth for "your wallet" in a
  // non-custodial app — a user can have a different wallet plugged in than the
  // one stored as their DB profile.wallet_address, and showing the DB address's
  // balance instead is misleading (looks like "my wallet has 0" when the
  // connected one doesn't).
  // Normalized to undefined: profile.wallet_address is nullable, and a null in
  // the key would not match the undefined the other two balance hooks pass.
  const walletAddress = publicKey?.toString() || profile?.wallet_address || undefined

  return useQuery<TokenBalance>({
    // Shared with useUserBalance and usePortfolio's useWalletBalance. Was a
    // hand-written ['wallet-balance', token, address] key, which meant the same
    // balance sat in two cache entries and was polled twice.
    queryKey: queryKeys.wallet.balance(walletAddress),
    queryFn: async () => {
      if (!token) throw new Error('Authentication required')
      if (!walletAddress) throw new Error('Wallet address required')
      const response = await apiClient.getBalance(walletAddress)
      if (response.error) throw new Error(response.error)
      // `ApiResponse.data` is optional, so a 200 with no body would other-
      // wise resolve the query to `undefined` while the type promises a
      // TokenBalance — surfacing later as a render-time crash far from the
      // cause. Fail here instead. (Previously hidden by an `any` return.)
      if (!response.data) throw new Error('Balance response contained no data')
      return response.data
    },
    enabled: !!token && !!walletAddress,
    refetchInterval: BALANCE_POLL_MS,
  })
}
