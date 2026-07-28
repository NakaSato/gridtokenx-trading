import { format } from 'date-fns'
import type { ApiOrder, Order } from '@/types/trading'

/// Single source of truth for projecting a trading-service `ApiOrder` into the
/// UI `Order`. Used by both the Positions table and the portfolio Orders tab so
/// the two lists can't diverge.
export function mapApiOrderToOrder(order: ApiOrder): Order {
  // Market orders carry no real price (price_per_kwh is null — the backend
  // stores a synthetic ceiling/cap bid, not the fill price). Guard non-numeric
  // strings too so a bad value renders as "Market" rather than "$NaN".
  const parsed =
    order.price_per_kwh != null ? parseFloat(order.price_per_kwh) : NaN
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
    status: order.status,
  }
}
