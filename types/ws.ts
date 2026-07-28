/**
 * Realtime websocket payload shapes — one definition per wire message.
 *
 * These were previously declared twice (hooks/useTransactionUpdates.ts and
 * hooks/useNotificationToast.tsx) with drifting optionality. Anything that
 * consumes a channel imports from here.
 */

export interface TransactionStatusUpdate {
  operation_id: string
  transaction_type:
    | 'EnergyTrade'
    | 'TokenMint'
    | 'TokenBurn'
    | 'Stake'
    | 'Unstake'
    | 'Reward'
  old_status: string
  new_status: string
  signature: string | null
  error_message: string | null
  timestamp: string
}

/**
 * A P2P energy order-book level. Distinct from `OrderBookEntry` in
 * types/futures.ts, which is the futures book (price/quantity/total) — same
 * idea, different wire shape, so they intentionally keep separate names.
 */
export interface P2POrderBookEntry {
  price_per_kwh: number
  energy_amount: number
  username?: string
}

export interface OrderBookSnapshotUpdate {
  bids: P2POrderBookEntry[]
  asks: P2POrderBookEntry[]
  timestamp: string
}

export interface P2POrderUpdate {
  order_id: string
  user_id: string
  side: 'buy' | 'sell'
  // 'created' is emitted on order acceptance before it hits the book; the
  // toast pipeline skips it. It was missing from the union that
  // useTransactionUpdates declared, present in the one useNotificationToast
  // declared — the widened set is what the wire actually sends.
  status: 'created' | 'open' | 'partially_filled' | 'filled' | 'cancelled'
  original_amount: string
  filled_amount: string
  remaining_amount: string
  price_per_kwh: string
  timestamp: string
}

export interface SettlementComplete {
  settlement_id: string
  buyer_id: string
  seller_id: string
  energy_amount: string
  total_cost: string
  transaction_signature: string | null
  timestamp: string
}

export interface ConditionalOrderTriggered {
  order_id: string
  user_id: string
  trigger_type: 'StopLoss' | 'TakeProfit' | 'TrailingStop' | string
  side: 'buy' | 'sell' | string
  trigger_price: string
  market_price: string
  timestamp: string
}

export interface OrderFilled {
  order_id: string
  amount: number
  price: number
  side: 'buy' | 'sell'
}

export interface OrderMatched {
  match_id: string
  buy_order_id: string
  sell_order_id: string
  matched_amount: string
  match_price: string
}
