import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'

/**
 * Hook for fetching wallet balance
 */
export function useWalletBalance() {
    const { token } = useAuth()
    const apiClient = createApiClient(token || '')

    return useQuery({
        queryKey: ['wallet-balance', token],
        queryFn: async () => {
            if (!token) throw new Error('Authentication required')
            const response = await apiClient.getBalance()
            if (response.error) throw new Error(response.error)
            return response.data || { token_balance: 0 }
        },
        enabled: !!token,
        refetchInterval: 10000, // Balance refreshes more frequently
    })
}
