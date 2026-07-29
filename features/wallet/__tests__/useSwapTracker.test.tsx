import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSwapTracker } from '@/features/wallet/hooks/useSwapTracker'
import type { ApiOrder, TradeRecord } from '@/types/trading'

const mockGetOrder = jest.fn()
const mockGetTrades = jest.fn()
jest.mock('@/lib/api-client', () => ({
  createApiClient: () => ({
    getOrder: (id: string) => mockGetOrder(id),
    getTrades: (f: unknown) => mockGetTrades(f),
  }),
}))

jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({ token: 'jwt' }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function order(status: string, filled = '0'): { data: ApiOrder } {
  return {
    data: {
      id: 'order-1',
      zone_id: 1,
      side: 'buy',
      order_type: 'market',
      status,
      energy_amount_kwh: '25',
      price_per_kwh: null,
      filled_amount_kwh: filled,
      created_at: 'now',
    },
  }
}

function trade(status: string, txHash?: string): TradeRecord {
  return {
    id: 'trade-1',
    role: 'buyer',
    quantity: '25',
    price: '4.00',
    total_value: '100',
    status,
    transaction_hash: txHash,
    buy_order_id: 'order-1',
    sell_order_id: 'other-order',
    executed_at: 'now',
    retry_count: 0,
  }
}

describe('useSwapTracker', () => {
  beforeEach(() => jest.clearAllMocks())

  it('is idle with no order to track and calls nothing', () => {
    const { result } = renderHook(() => useSwapTracker(null), { wrapper })
    expect(result.current.stage).toBe('idle')
    expect(mockGetOrder).not.toHaveBeenCalled()
    expect(mockGetTrades).not.toHaveBeenCalled()
  })

  it('reports matching while the order is resting, without polling trades', async () => {
    mockGetOrder.mockResolvedValue(order('pending'))
    const { result } = renderHook(() => useSwapTracker('order-1'), { wrapper })
    await waitFor(() => expect(result.current.stage).toBe('matching'))
    expect(mockGetOrder).toHaveBeenCalledWith('order-1')
    expect(mockGetTrades).not.toHaveBeenCalled()
  })

  it('reports settling once the order fills but the trade has not confirmed', async () => {
    mockGetOrder.mockResolvedValue(order('filled', '25'))
    mockGetTrades.mockResolvedValue({
      data: { trades: [trade('processing')], total_count: 1, total: 1 },
    })
    const { result } = renderHook(() => useSwapTracker('order-1'), { wrapper })
    await waitFor(() => expect(result.current.stage).toBe('settling'))
    expect(result.current.txHash).toBeNull()
  })

  it('reports settled with the tx hash once the trade confirms', async () => {
    mockGetOrder.mockResolvedValue(order('filled', '25'))
    mockGetTrades.mockResolvedValue({
      data: {
        trades: [trade('completed', 'sig'.padEnd(20, 'x'))],
        total_count: 1,
        total: 1,
      },
    })
    const { result } = renderHook(() => useSwapTracker('order-1'), { wrapper })
    await waitFor(() => expect(result.current.stage).toBe('settled'))
    expect(result.current.txHash).toBe('sig'.padEnd(20, 'x'))
  })

  it('reports settling for an IOC partial fill whose remainder was cancelled', async () => {
    mockGetOrder.mockResolvedValue(order('cancelled', '10'))
    mockGetTrades.mockResolvedValue({
      data: { trades: [trade('pending')], total_count: 1, total: 1 },
    })
    const { result } = renderHook(() => useSwapTracker('order-1'), { wrapper })
    await waitFor(() => expect(result.current.stage).toBe('settling'))
  })

  it('reports unfilled when the order is cancelled with zero fill', async () => {
    mockGetOrder.mockResolvedValue(order('cancelled', '0'))
    const { result } = renderHook(() => useSwapTracker('order-1'), { wrapper })
    await waitFor(() => expect(result.current.stage).toBe('unfilled'))
    expect(mockGetTrades).not.toHaveBeenCalled()
  })

  it('ignores trades belonging to other orders', async () => {
    mockGetOrder.mockResolvedValue(order('filled', '25'))
    mockGetTrades.mockResolvedValue({
      data: {
        trades: [
          {
            ...trade('completed', 'zzz'),
            buy_order_id: 'unrelated',
            sell_order_id: 'also-unrelated',
          },
        ],
        total_count: 1,
        total: 1,
      },
    })
    const { result } = renderHook(() => useSwapTracker('order-1'), { wrapper })
    await waitFor(() => expect(result.current.stage).toBe('settling'))
    expect(result.current.txHash).toBeNull()
  })
})
