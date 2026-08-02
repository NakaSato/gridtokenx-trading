/**
 * useSellEligibility: mirrors the server's sell-side meter gate so the order
 * form can explain the block before submit. The behaviour that matters is which
 * way it fails — a meters-endpoint hiccup must NOT lock a legitimate seller out
 * of a form the backend would have accepted.
 */
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useSellEligibility } from '../hooks/useSellEligibility'
import type { MeterResponse } from '@/types/meter'

const mockGetMyMeters = jest.fn()
let mockToken: string | null = 'test-jwt'

jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({ token: mockToken }),
}))

jest.mock('@/lib/api-client', () => ({
  createApiClient: () => ({
    getMyMeters: (...args: unknown[]) => mockGetMyMeters(...args),
  }),
}))

function meter(is_verified: boolean, id = 'm1'): MeterResponse {
  return {
    id,
    serial_number: `SN-${id}`,
    meter_type: 'smart_meter',
    location: 'Bangkok',
    is_verified,
    wallet_address: 'W1',
  }
}

function renderEligibility() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useSellEligibility(), { wrapper })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockToken = 'test-jwt'
})

it('allows selling when the user owns a verified meter', async () => {
  mockGetMyMeters.mockResolvedValue({ data: [meter(false, 'a'), meter(true, 'b')] })
  const { result } = renderEligibility()

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.hasVerifiedMeter).toBe(true)
  expect(result.current.canSell).toBe(true)
  expect(result.current.hasUnverifiedMetersOnly).toBe(false)
})

it('blocks selling when every meter the user owns is unverified', async () => {
  mockGetMyMeters.mockResolvedValue({ data: [meter(false, 'a'), meter(false, 'b')] })
  const { result } = renderEligibility()

  await waitFor(() => expect(result.current.canSell).toBe(false))
  // Distinguishes "verify the meter you have" from "register a meter" — the two
  // need different instructions, so the notice keys on this.
  expect(result.current.hasUnverifiedMetersOnly).toBe(true)
  expect(result.current.hasNoMeters).toBe(false)
})

it('blocks selling and reports the no-meter case when the user owns none', async () => {
  mockGetMyMeters.mockResolvedValue({ data: [] })
  const { result } = renderEligibility()

  await waitFor(() => expect(result.current.canSell).toBe(false))
  expect(result.current.hasNoMeters).toBe(true)
  expect(result.current.hasUnverifiedMetersOnly).toBe(false)
})

it('fails OPEN when the meters lookup errors', async () => {
  // A wrongly-allowed submit surfaces the server's real 403; a wrongly-blocked
  // one leaves the user stuck with no recourse. So an unreadable answer must
  // never render as "you cannot sell".
  mockGetMyMeters.mockResolvedValue({ error: 'meter-service unreachable', status: 503 })
  const { result } = renderEligibility()

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.canSell).toBe(true)
  expect(result.current.hasNoMeters).toBe(false)
  expect(result.current.hasUnverifiedMetersOnly).toBe(false)
})

it('fails OPEN while the answer is still loading', async () => {
  mockGetMyMeters.mockReturnValue(new Promise(() => {})) // never resolves
  const { result } = renderEligibility()

  expect(result.current.canSell).toBe(true)
  expect(result.current.hasNoMeters).toBe(false)
})

it('does not block a logged-out visitor', () => {
  mockToken = null
  const { result } = renderEligibility()

  expect(mockGetMyMeters).not.toHaveBeenCalled()
  expect(result.current.canSell).toBe(true)
})
