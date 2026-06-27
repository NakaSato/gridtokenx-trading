export interface Position {
  index: string
  token: string
  logo: string
  symbol: string
  type: string
  strikePrice: number
  expiry: string
  size: number
  pnl: number
  greeks: {
    delta: number
    gamma: number
    theta: number
    vega: number
  }
}

import { format } from 'date-fns'
import type { ApiOrder } from '@/types/trading'

export interface Order {
  index: string
  token: string
  logo: string
  symbol: string
  type: string
  transaction: string
  // null when there is no user-set price to display — market orders (they fill
  // at the resting ask) and malformed/non-numeric prices. The renderer shows
  // "Market" rather than a misleading "$0.0000".
  limitPrice: number | null
  strikePrice: number
  expiry: string
  orderDate: string
  size: number
}

/// Single source of truth for projecting a trading-service `ApiOrder` into the
/// UI `Order`. Used by both the Positions table and the portfolio Orders tab so
/// the two lists can't diverge.
export function mapApiOrderToOrder(order: ApiOrder): Order {
  // Market orders carry no real price (price_per_kwh is null — the backend
  // stores a synthetic ceiling/cap bid, not the fill price). Guard non-numeric
  // strings too so a bad value renders as "Market" rather than "$NaN".
  const parsed = order.price_per_kwh != null ? parseFloat(order.price_per_kwh) : NaN
  return {
    index: order.id,
    token: 'GRID',
    logo: '/images/grid.png',
    symbol: 'GRX',
    type: order.order_type === 'market' ? 'Market' : 'Limit',
    transaction: order.side.toLowerCase(),
    limitPrice: Number.isNaN(parsed) ? null : parsed,
    strikePrice: 0,
    expiry: 'N/A',
    orderDate: format(new Date(order.created_at), 'MM/dd/yyyy'),
    size: parseFloat(order.energy_amount_kwh),
  }
}

export const positions: Position[] = [
  {
    index: "1",
    token: 'Bitcoin',
    logo: '/images/bitcoin.png',
    symbol: 'BTC',
    type: 'Call',
    strikePrice: 150,
    expiry: '1/5/2025',
    size: 28,
    pnl: 120,
    greeks: {
      delta: 0.9132,
      gamma: 0.0723,
      theta: -0.3587,
      vega: 0.0321,
    },
  },
  {
    index: "1",
    token: 'Bitcoin',
    logo: '/images/bitcoin.png',
    symbol: 'BTC',
    type: 'Call',
    strikePrice: 150,
    expiry: '1/5/2025',
    size: 28,
    pnl: 120,
    greeks: {
      delta: 0.9132,
      gamma: 0.0723,
      theta: -0.3587,
      vega: 0.0321,
    },
  },
  {
    index: "1",
    token: 'Bitcoin',
    logo: '/images/bitcoin.png',
    symbol: 'BTC',
    type: 'Call',
    strikePrice: 150,
    expiry: '1/5/2025',
    size: 28,
    pnl: 120,
    greeks: {
      delta: 0.9132,
      gamma: 0.0723,
      theta: -0.3587,
      vega: 0.0321,
    },
  },
  {
    index: "1",
    token: 'Bitcoin',
    logo: '/images/bitcoin.png',
    symbol: 'BTC',
    type: 'Call',
    strikePrice: 150,
    expiry: '1/5/2025',
    size: 28,
    pnl: 120,
    greeks: {
      delta: 0.9132,
      gamma: 0.0723,
      theta: -0.3587,
      vega: 0.0321,
    },
  },
]

export const orders: Order[] = [
  {
    index: "1",
    token: 'Solana',
    logo: '/images/solana.png',
    symbol: 'SOL',
    type: 'Call',
    transaction: 'buy',
    limitPrice: 128,
    strikePrice: 150,
    expiry: '1/5/2025',
    orderDate: '1/4/2025',
    size: 500,
  },
  {
    index: "2",
    token: 'Solana',
    logo: '/images/solana.png',
    symbol: 'SOL',
    type: 'Call',
    transaction: 'buy',
    limitPrice: 140,
    strikePrice: 150,
    expiry: '1/5/2025',
    orderDate: '1/4/2025',
    size: 500,
  },
  {
    index: "3",
    token: 'Solana',
    logo: '/images/solana.png',
    symbol: 'SOL',
    type: 'Call',
    transaction: 'buy',
    limitPrice: 137,
    strikePrice: 150,
    expiry: '1/5/2025',
    orderDate: '1/4/2025',
    size: 500,
  },
  {
    index: "4",
    token: 'Bitcoin',
    logo: '/images/.png',
    symbol: 'BTC',
    type: 'Call',
    transaction: 'buy',
    limitPrice: 105000,
    strikePrice: 150000,
    expiry: '1/5/2025',
    orderDate: '1/4/2025',
    size: 500,
  },
  {
    index: "5",
    token: 'Bitcoin',
    logo: '/images/bitcoin.png',
    symbol: 'BTC',
    type: 'Call',
    transaction: 'buy',
    limitPrice: 95000,
    strikePrice: 150000,
    expiry: '1/5/2025',
    orderDate: '1/4/2025',
    size: 500,
  },
]
