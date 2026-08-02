/**
 * MeterList: an unverified meter must offer the Verify action and say what the
 * state costs the user (they cannot sell), and verifying must refresh BOTH the
 * dashboard query and the shared "my meters" slot the order form's sell gate
 * reads — otherwise the Sell tab stays blocked until the next poll.
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { MeterList } from '../components/MeterList'
import type { MeterResponse } from '@/types/meter'

const mockVerifyMeter = jest.fn()

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({ token: 'test-jwt' }),
}))

jest.mock('@/lib/api-client', () => ({
  createApiClient: () => ({
    verifyMeter: (...args: unknown[]) => mockVerifyMeter(...args),
  }),
}))

function meter(overrides: Partial<MeterResponse> = {}): MeterResponse {
  return {
    id: 'meter-1',
    serial_number: 'SN-1',
    meter_type: 'smart_meter',
    location: 'Bangkok',
    is_verified: false,
    wallet_address: 'Wallet111',
    ...overrides,
  }
}

function renderList(meters: MeterResponse[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const invalidate = jest.spyOn(client, 'invalidateQueries')
  render(
    <QueryClientProvider client={client}>
      <MeterList meters={meters} loading={false} />
    </QueryClientProvider>
  )
  return { invalidate }
}

beforeEach(() => jest.clearAllMocks())

it('tells an unverified meter it cannot sell, and offers the verify action', () => {
  renderList([meter()])

  expect(screen.getByText(/unverified · cannot sell/i)).toBeInTheDocument()
  expect(screen.getByTestId('verify-meter-SN-1')).toBeInTheDocument()
})

it('offers no verify action on an already-verified meter', () => {
  renderList([meter({ is_verified: true })])

  expect(screen.getByText(/verified · can sell/i)).toBeInTheDocument()
  expect(screen.queryByTestId('verify-meter-SN-1')).not.toBeInTheDocument()
})

it('verifies by serial and refreshes the sell gate’s query slot', async () => {
  mockVerifyMeter.mockResolvedValue({
    data: {
      success: true,
      already_verified: false,
      message: 'ok',
      attestation: { attested_readings: 3, window_hours: 720 },
    },
  })
  const { invalidate } = renderList([meter()])

  await userEvent.setup().click(screen.getByTestId('verify-meter-SN-1'))

  await waitFor(() => expect(mockVerifyMeter).toHaveBeenCalledWith('SN-1'))
  expect(toast.success).toHaveBeenCalledWith(
    expect.stringContaining('3 signed reading')
  )
  // Both slots: the dashboard's own query AND the one useSellEligibility reads.
  const keys = invalidate.mock.calls.map((c) => JSON.stringify(c[0]))
  expect(keys.some((k) => k.includes('smartMeter'))).toBe(true)
  expect(keys.some((k) => k.includes('mine'))).toBe(true)
})

it('surfaces the backend reason when there is no attested telemetry', async () => {
  // The 409 case: the meter has never reported, so it cannot be verified. The
  // message must reach the user — "verify failed" alone gives them no next step.
  mockVerifyMeter.mockResolvedValue({
    error: 'no signature-verified telemetry from meter SN-1 in the last 720h',
    status: 409,
  })
  renderList([meter()])

  await userEvent.setup().click(screen.getByTestId('verify-meter-SN-1'))

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('no signature-verified telemetry')
    )
  )
})
