import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAutoSwap } from '@/features/wallet/hooks/useAutoSwap'

const mockCreateOrder = jest.fn()
jest.mock('@/lib/api-client', () => ({
  createApiClient: () => ({
    createOrder: (payload: unknown) => mockCreateOrder(payload),
  }),
}))

let mockToken: string | null = 'jwt'
jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({ token: mockToken }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useAutoSwap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockToken = 'jwt'
    mockCreateOrder.mockResolvedValue({
      data: { id: 'order-1', status: 'pending', created_at: 'now' },
    })
  })

  it('maps THBC→GRX to a market buy denominated in kWh', async () => {
    const { result } = renderHook(() => useAutoSwap(), { wrapper })
    await result.current.mutateAsync({
      direction: 'thbc-to-grx',
      energyKwh: 25,
      bestBid: 3.9,
    })
    expect(mockCreateOrder).toHaveBeenCalledWith({
      side: 'buy',
      order_type: 'market',
      amount: '25.000000',
      zone_id: 1,
    })
  })

  it('maps GRX→THBC to a limit sell at the best bid (matcher rejects market sells)', async () => {
    const { result } = renderHook(() => useAutoSwap(), { wrapper })
    await result.current.mutateAsync({
      direction: 'grx-to-thbc',
      energyKwh: 10,
      bestBid: 3.9,
    })
    expect(mockCreateOrder).toHaveBeenCalledWith({
      side: 'sell',
      order_type: 'limit',
      amount: '10.000000',
      price_per_kwh: '3.9',
      zone_id: 1,
    })
  })

  it('refuses a sell with no best bid instead of sending an unpriceable order', async () => {
    const { result } = renderHook(() => useAutoSwap(), { wrapper })
    await expect(
      result.current.mutateAsync({
        direction: 'grx-to-thbc',
        energyKwh: 10,
        bestBid: null,
      })
    ).rejects.toThrow('No buyers in the book')
    expect(mockCreateOrder).not.toHaveBeenCalled()
  })

  it('enforces the 0.1 kWh engine minimum client-side', async () => {
    const { result } = renderHook(() => useAutoSwap(), { wrapper })
    await expect(
      result.current.mutateAsync({
        direction: 'thbc-to-grx',
        energyKwh: 0.05,
        bestBid: null,
      })
    ).rejects.toThrow('Minimum swap size')
    expect(mockCreateOrder).not.toHaveBeenCalled()
  })

  it('surfaces API errors as rejections', async () => {
    mockCreateOrder.mockResolvedValueOnce({ error: 'Insufficient balance' })
    const { result } = renderHook(() => useAutoSwap(), { wrapper })
    await expect(
      result.current.mutateAsync({
        direction: 'thbc-to-grx',
        energyKwh: 25,
        bestBid: null,
      })
    ).rejects.toThrow('Insufficient balance')
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('requires a session token', async () => {
    mockToken = null
    const { result } = renderHook(() => useAutoSwap(), { wrapper })
    await expect(
      result.current.mutateAsync({
        direction: 'thbc-to-grx',
        energyKwh: 25,
        bestBid: null,
      })
    ).rejects.toThrow('Please log in')
    expect(mockCreateOrder).not.toHaveBeenCalled()
  })
})
