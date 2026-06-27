import { mapApiOrderToOrder } from '@/lib/data/Positions'
import type { ApiOrder } from '@/types/trading'

function apiOrder(overrides: Partial<ApiOrder> = {}): ApiOrder {
  return {
    id: 'order-1',
    zone_id: 1,
    side: 'BUY',
    order_type: 'limit',
    status: 'active',
    energy_amount_kwh: '10',
    price_per_kwh: '4.5',
    filled_amount_kwh: '0',
    created_at: '2026-06-27T00:00:00Z',
    ...overrides,
  }
}

describe('mapApiOrderToOrder', () => {
  it('maps a limit order to a numeric limitPrice and type "Limit"', () => {
    const o = mapApiOrderToOrder(apiOrder({ order_type: 'limit', price_per_kwh: '4.5' }))
    expect(o.type).toBe('Limit')
    expect(o.limitPrice).toBe(4.5)
    expect(o.transaction).toBe('buy') // side lowercased
  })

  // Regression: a market order has price_per_kwh = null (the backend stores a
  // synthetic ceiling bid, not a real price). limitPrice must be null so the UI
  // shows "Market", NOT 0 (which rendered as a misleading "$0.0000").
  it('maps a market order (null price) to limitPrice null and type "Market"', () => {
    const o = mapApiOrderToOrder(apiOrder({ order_type: 'market', price_per_kwh: null }))
    expect(o.type).toBe('Market')
    expect(o.limitPrice).toBeNull()
  })

  // A non-null but non-numeric price must not leak NaN into the UI ("$NaN").
  it('maps a non-numeric price to limitPrice null', () => {
    const o = mapApiOrderToOrder(apiOrder({ order_type: 'limit', price_per_kwh: '' }))
    expect(o.limitPrice).toBeNull()
  })

  it('lowercases the side for a sell', () => {
    const o = mapApiOrderToOrder(apiOrder({ side: 'SELL' }))
    expect(o.transaction).toBe('sell')
  })
})
