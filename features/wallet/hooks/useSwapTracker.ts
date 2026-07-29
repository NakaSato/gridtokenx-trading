'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/features/auth/provider'
import type { ApiOrder, TradeRecord } from '@/types/trading'

/**
 * Lifecycle of a placed swap order, as observable from the frontend:
 *
 *   matching  — order resting, the CDA engine hasn't matched it yet
 *   settling  — matched (order filled / trade row exists), on-chain
 *               settlement worker hasn't confirmed yet
 *   settled   — the trade row reached completed/confirmed with a tx hash
 *   unfilled  — order cancelled/expired without any fill (e.g. market IOC
 *               remainder with no counterparty)
 *   timeout   — still not settled after TRACK_TIMEOUT_MS; polling stops
 *
 * There is no settlement WS frame (SettlementProcessed is never routed to
 * sockets — trading-api/src/websocket.rs routable()), so REST polling is the
 * only confirmation signal available to the browser.
 */
export type SwapStage =
  | 'idle'
  | 'matching'
  | 'settling'
  | 'settled'
  | 'unfilled'
  | 'timeout'

const POLL_MS = 3000
const TRACK_TIMEOUT_MS = 180_000

/** Trade statuses that mean the settlement landed on-chain. */
const SETTLED_TRADE_STATUSES = ['completed', 'confirmed', 'settled']
/** Order statuses that mean the engine matched (fully or partially). */
const FILLED_ORDER_STATUSES = ['partially_filled', 'filled']
/** Order statuses that mean the order will never fill further. */
const TERMINAL_ORDER_STATUSES = ['cancelled', 'expired']

export interface SwapTracking {
  stage: SwapStage
  /** Settlement tx signature, once settled. */
  txHash: string | null
  /** The trade row backing the swap, once matched. */
  trade: TradeRecord | null
}

export function useSwapTracker(orderId: string | null): SwapTracking {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  // Keyed by order id, so switching to a new order implicitly resets it —
  // no synchronous setState-in-effect needed.
  const [timedOutId, setTimedOutId] = useState<string | null>(null)
  const timedOut = orderId !== null && timedOutId === orderId

  useEffect(() => {
    if (!orderId) return
    const timer = setTimeout(() => setTimedOutId(orderId), TRACK_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [orderId])

  const { data: order } = useQuery<ApiOrder>({
    queryKey: ['swap-track-order', orderId, token],
    queryFn: async () => {
      const response = await createApiClient(token!).getOrder(orderId!)
      if (response.error) throw new Error(response.error)
      if (!response.data) throw new Error('Order response contained no data')
      return response.data
    },
    enabled: !!token && !!orderId && !timedOut,
    // Stop polling once the order can't change further — from there the
    // trades query (below) carries the settlement signal.
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status &&
        (FILLED_ORDER_STATUSES.includes(status) ||
          TERMINAL_ORDER_STATUSES.includes(status))
        ? false
        : POLL_MS
    },
  })

  const orderFilled = !!order && FILLED_ORDER_STATUSES.includes(order.status)
  const orderTerminal =
    !!order && TERMINAL_ORDER_STATUSES.includes(order.status)
  const orderHasFill = !!order && parseFloat(order.filled_amount_kwh) > 0

  // The trade row carries settlement status + tx hash; it only exists after a
  // match, so don't poll /trades until the order shows one (or went terminal
  // with a partial fill — the IOC-remainder case).
  const { data: trades } = useQuery<TradeRecord[]>({
    queryKey: ['swap-track-trades', orderId, token],
    queryFn: async () => {
      const response = await createApiClient(token!).getTrades({ limit: 20 })
      if (response.error) throw new Error(response.error)
      return response.data?.trades ?? []
    },
    enabled:
      !!token &&
      !!orderId &&
      !timedOut &&
      (orderFilled || (orderTerminal && orderHasFill)),
    // Stop polling once the swap's own trade has settled.
    refetchInterval: (query) => {
      const matched = query.state.data?.find(
        (t) => t.buy_order_id === orderId || t.sell_order_id === orderId
      )
      return matched && SETTLED_TRADE_STATUSES.includes(matched.status)
        ? false
        : POLL_MS
    },
  })

  const trade =
    trades?.find(
      (t) => t.buy_order_id === orderId || t.sell_order_id === orderId
    ) ?? null
  const tradeSettled =
    !!trade && SETTLED_TRADE_STATUSES.includes(trade.status)

  let stage: SwapStage
  if (!orderId) {
    stage = 'idle'
  } else if (tradeSettled) {
    // Settled latches — a timeout firing on the same tick must not demote it.
    stage = 'settled'
  } else if (orderTerminal && !orderHasFill && !trade) {
    stage = 'unfilled'
  } else if (timedOut) {
    stage = 'timeout'
  } else if (orderFilled || trade || (orderTerminal && orderHasFill)) {
    stage = 'settling'
  } else {
    stage = 'matching'
  }

  // Settlement moved real tokens — refresh every balance view once.
  const settledNotified = useRef<string | null>(null)
  useEffect(() => {
    if (stage !== 'settled' || !orderId) return
    if (settledNotified.current === orderId) return
    settledNotified.current = orderId
    queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
    queryClient.invalidateQueries({ queryKey: ['escrow-balance'] })
  }, [stage, orderId, queryClient])

  return {
    stage,
    txHash: tradeSettled ? (trade?.transaction_hash ?? null) : null,
    trade,
  }
}
