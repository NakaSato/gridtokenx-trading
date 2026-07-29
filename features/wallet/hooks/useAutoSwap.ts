'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/features/auth/provider'
import { queryKeys } from '@/lib/query/keys'
import type { SubmitOrderResponse } from '@/types/trading'

export type SwapDirection = 'thbc-to-grx' | 'grx-to-thbc'

/** Wallet swaps carry no grid-map context; zone 1 is the platform default. */
const SWAP_ZONE_ID = 1

/** Matching-engine minimum order size (kWh) — see OrderForm.tsx. */
export const MIN_SWAP_KWH = 0.1

export interface AutoSwapParams {
  direction: SwapDirection
  /** Energy leg of the swap: kWh bought (thbc-to-grx) or sold (grx-to-thbc). */
  energyKwh: number
  /**
   * Live best bid (THBC/kWh). Required for sells: the matcher rejects market
   * sells, so the sell goes in as a limit at the best bid — which crosses the
   * book immediately, i.e. behaves as the swap.
   */
  bestBid: number | null
}

/**
 * "Auto swap" = a P2P energy-market order the CDA engine matches for you.
 * THBC→GRX is a market buy (fills against the resting asks); GRX→THBC is a
 * best-bid limit sell. Settlement then moves GRX and THBC on-chain — there is
 * no separate swap engine.
 */
export function useAutoSwap() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<SubmitOrderResponse, Error, AutoSwapParams>({
    mutationFn: async ({ direction, energyKwh, bestBid }) => {
      if (!token) throw new Error('Please log in to swap')
      if (!Number.isFinite(energyKwh) || energyKwh < MIN_SWAP_KWH) {
        throw new Error(`Minimum swap size is ${MIN_SWAP_KWH} kWh`)
      }
      const apiClient = createApiClient(token)

      let response
      if (direction === 'thbc-to-grx') {
        response = await apiClient.createOrder({
          side: 'buy',
          order_type: 'market',
          amount: energyKwh.toFixed(6),
          zone_id: SWAP_ZONE_ID,
        })
      } else {
        if (bestBid === null) {
          throw new Error(
            'No buyers in the book right now — an instant sell cannot fill'
          )
        }
        response = await apiClient.createOrder({
          side: 'sell',
          order_type: 'limit',
          amount: energyKwh.toFixed(6),
          price_per_kwh: String(bestBid),
          zone_id: SWAP_ZONE_ID,
        })
      }

      if (response.error) throw new Error(response.error)
      if (!response.data) throw new Error('Order response contained no data')
      return response.data
    },
    onSuccess: () => {
      // Balances move when the trade settles, not on submit — but refetching
      // now catches fast matches, and the polling intervals catch the rest.
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.p2p.all() })
      queryClient.invalidateQueries({ queryKey: ['orderbook'] })
      queryClient.invalidateQueries({ queryKey: ['p2p-orders'] })
    },
  })
}
