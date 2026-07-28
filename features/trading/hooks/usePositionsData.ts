'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { createApiClient } from '@/lib/api-client'
import { mapApiOrderToOrder } from '@/lib/api/adapters'
import { queryKeys } from '@/lib/query/keys'
import { useAuth } from '@/contexts/AuthProvider'
import type { Order, Position } from '@/types/trading'
import type { ApiOrder, TradeRecord } from '@/types/trading'
import type { FuturesPosition as ApiFuturesPosition } from '@/types/futures'
import type { Transaction } from '@/types/wallet'

/**
 * The positions/orders/history triple, fetched once for every surface that
 * shows them. TradingPositions and the portfolio tabs each used to own a
 * private copy of these three fetches — one polling with setInterval, one on
 * TanStack — and the copies had drifted (see notes on the mappings below).
 */

// Freshly placed orders start 'pending' and only become 'active' once the
// matcher processes them (trading-api rest.rs submit_order), so a server-side
// status=active filter hides an order until that async promotion lands. Fetch
// everything and narrow here instead.
const OPEN_STATUSES = new Set(['pending', 'active', 'partially_filled'])

/** Refetch when the socket reports a state change for these domains. */
function useWsInvalidation(events: string[], queryKey: readonly unknown[]) {
  const queryClient = useQueryClient()
  useEffect(() => {
    const handleWsMessage = (event: Event) => {
      const message = (event as CustomEvent).detail
      if (events.includes(message?.type)) {
        queryClient.invalidateQueries({ queryKey })
      }
    }
    window.addEventListener('ws-message', handleWsMessage)
    return () => window.removeEventListener('ws-message', handleWsMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient])
}

export function usePositions() {
  const { token } = useAuth()

  const query = useQuery<Position[]>({
    queryKey: queryKeys.trading.positions(token ?? undefined),
    queryFn: async () => {
      const apiClient = createApiClient(token!)
      const response = await apiClient.getFuturesPositions()
      const rawData = (((response.data as { data?: unknown[] })?.data ||
        response.data ||
        []) as ApiFuturesPosition[])

      return rawData.map((pos) => ({
        index: pos.id,
        token: pos.product_symbol || 'Unknown',
        logo: '/images/solana.png',
        symbol: pos.product_symbol || 'GRX',
        // These come from the futures endpoint, so the side is Long/Short.
        // The portfolio copy said Call/Put, which made OpenPositions skip its
        // futures-specific rendering (it keys on type === 'Long' | 'Short').
        type: pos.side === 'long' ? 'Long' : 'Short',
        strikePrice: parseFloat(pos.entry_price),
        expiry: 'Perpetual',
        size: parseFloat(pos.quantity),
        pnl: parseFloat(pos.unrealized_pnl || '0'),
        greeks: { delta: 0, gamma: 0, theta: 0, vega: 0 },
      }))
    },
    enabled: !!token,
    refetchInterval: 60_000,
  })

  useWsInvalidation(
    ['TradeExecuted', 'OrderMatched', 'PositionClosed', 'PositionUpdated'],
    queryKeys.trading.positions(token ?? undefined)
  )

  return query
}

export function useOpenOrders() {
  const { token } = useAuth()

  const query = useQuery<Order[]>({
    queryKey: queryKeys.trading.openOrders(token ?? undefined),
    queryFn: async () => {
      const apiClient = createApiClient(token!)
      const response = await apiClient.getOrders({})
      const data = (((response.data as { data?: ApiOrder[] })?.data ||
        response.data ||
        []) as ApiOrder[])
      return data.filter((o) => OPEN_STATUSES.has(o.status)).map(mapApiOrderToOrder)
    },
    enabled: !!token,
    refetchInterval: 60_000,
  })

  useWsInvalidation(
    ['OrderCreated', 'OrderCancelled', 'OrderMatched', 'OrderUpdated'],
    queryKeys.trading.openOrders(token ?? undefined)
  )

  return query
}

export function useTradeHistory(limit = 50) {
  const { token } = useAuth()

  const query = useQuery<Transaction[]>({
    queryKey: [...queryKeys.trading.orderHistory(token ?? undefined), limit],
    queryFn: async () => {
      const apiClient = createApiClient(token!)
      const response = await apiClient.getTrades({ limit })
      const rawData = (((response.data as { trades?: unknown[] })?.trades ||
        response.data ||
        []) as TradeRecord[])

      return rawData.map((trade) => ({
        transactionID: trade.id,
        token: {
          name: 'GridToken',
          symbol: 'GRX',
          logo: '/images/grid.png',
        },
        transactionType: trade.role === 'buyer' ? 'Buy' : 'Sell',
        optionType: 'Spot',
        // price_per_kwh / energy_amount are the current field names; the
        // portfolio copy read only the legacy price/quantity and so rendered
        // NaN wherever the backend had moved on.
        strikePrice: parseFloat(trade.price_per_kwh ?? trade.price),
        quantity: parseFloat(trade.energy_amount ?? trade.quantity),
        totalValue: parseFloat(trade.total_value),
        wheelingCharge:
          trade.wheeling_charge != null
            ? parseFloat(trade.wheeling_charge)
            : undefined,
        lossCost:
          trade.loss_cost != null ? parseFloat(trade.loss_cost) : undefined,
        effectiveEnergy:
          trade.effective_energy != null
            ? parseFloat(trade.effective_energy)
            : undefined,
        buyerZoneId: trade.buyer_zone_id,
        sellerZoneId: trade.seller_zone_id,
        expiry: format(new Date(trade.executed_at), 'dd MMM, yyy HH:mm:ss'),
      })) as Transaction[]
    },
    enabled: !!token,
    refetchInterval: 60_000,
  })

  useWsInvalidation(
    ['TradeExecuted', 'OrderMatched'],
    queryKeys.trading.orderHistory(token ?? undefined)
  )

  return query
}

export function useCancelOrder() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const apiClient = createApiClient(token!)
      const res = await apiClient.cancelOrder(orderId)
      if (res.error) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      toast.success('Order canceled successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.trading.all() })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to cancel order')
    },
  })
}
