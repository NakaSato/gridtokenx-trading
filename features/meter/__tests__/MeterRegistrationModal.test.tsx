/**
 * MeterRegistrationModal: the debounced search must match the *entered* serial
 * against the public meter feed (regression: it previously previewed
 * `meters[0]` whenever any public meter existed), and registration must send
 * only the serial_number and surface success/failure without closing the
 * dialog on error.
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { MeterRegistrationModal } from '../components/MeterRegistrationModal'
import toast from 'react-hot-toast'

const mockGetPublicMeters = jest.fn()
const mockRegisterMeter = jest.fn()

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/features/auth/provider', () => ({
  useAuth: () => ({ token: 'test-jwt' }),
}))

jest.mock('@/lib/api-client', () => ({
  createApiClient: () => ({
    getPublicMeters: (...args: unknown[]) => mockGetPublicMeters(...args),
    registerMeter: (...args: unknown[]) => mockRegisterMeter(...args),
  }),
}))

const publicMeters = [
  {
    meter_id: 'GRID-SM-001',
    location: 'Bangkok Rooftop',
    meter_type: 'solar',
    is_verified: true,
    current_generation: 5.5,
    current_consumption: 1.25,
  },
  {
    meter_id: 'GRID-SM-002',
    location: 'Chiang Mai Farm',
    meter_type: 'wind',
    is_verified: false,
  },
]

function renderModal(props: Partial<React.ComponentProps<typeof MeterRegistrationModal>> = {}) {
  const onClose = jest.fn()
  const onSuccess = jest.fn()
  render(
    <MeterRegistrationModal
      isOpen
      onClose={onClose}
      onSuccess={onSuccess}
      {...props}
    />
  )
  return { onClose, onSuccess }
}

async function typeSerial(serial: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/meter id/i), serial)
  return user
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetPublicMeters.mockResolvedValue({ data: publicMeters })
})

describe('MeterRegistrationModal search preview', () => {
  it('shows the meter matching the entered serial, not just any meter', async () => {
    renderModal()
    await typeSerial('GRID-SM-002')

    await waitFor(() =>
      expect(screen.getByText(/live meter found/i)).toBeInTheDocument()
    )
    expect(screen.getByText('Chiang Mai Farm')).toBeInTheDocument()
    expect(screen.getByText(/wind/i)).toBeInTheDocument()
    // GRID-SM-002 is unverified — no badge
    expect(screen.queryByText(/verified/i)).not.toBeInTheDocument()
  })

  it('shows verified badge and live readings for a verified meter', async () => {
    renderModal()
    await typeSerial('grid-sm-001') // case-insensitive match

    await waitFor(() =>
      expect(screen.getByText(/live meter found/i)).toBeInTheDocument()
    )
    expect(screen.getByText('Bangkok Rooftop')).toBeInTheDocument()
    expect(screen.getByText(/verified/i)).toBeInTheDocument()
    expect(screen.getByText(/5\.50 kWh/)).toBeInTheDocument()
    expect(screen.getByText(/1\.25 kWh/)).toBeInTheDocument()
  })

  it('shows the no-match notice but keeps registration enabled', async () => {
    renderModal()
    await typeSerial('UNKNOWN-999')

    await waitFor(() =>
      expect(screen.getByText(/no live meter matches this id/i)).toBeInTheDocument()
    )
    expect(screen.queryByText(/live meter found/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^register$/i })).toBeEnabled()
  })

  it('does not search for inputs shorter than 3 characters', async () => {
    renderModal()
    await typeSerial('GR')

    // Debounce window is 500ms — give it time to (not) fire
    await new Promise((r) => setTimeout(r, 700))
    expect(mockGetPublicMeters).not.toHaveBeenCalled()
  })
})

describe('MeterRegistrationModal registration', () => {
  it('registers with only the serial_number and closes on success', async () => {
    mockRegisterMeter.mockResolvedValue({
      data: { success: true, message: 'Meter registered' },
    })
    const { onClose, onSuccess } = renderModal()

    const user = await typeSerial('GRID-SM-001')
    await user.click(screen.getByRole('button', { name: /^register$/i }))

    await waitFor(() => expect(mockRegisterMeter).toHaveBeenCalledTimes(1))
    expect(mockRegisterMeter).toHaveBeenCalledWith({ serial_number: 'GRID-SM-001' })
    expect(toast.success).toHaveBeenCalledWith('Meter registered')
    expect(onSuccess).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('surfaces an API error and keeps the dialog open', async () => {
    mockRegisterMeter.mockResolvedValue({ error: 'Meter already registered' })
    const { onClose } = renderModal()

    const user = await typeSerial('GRID-SM-001')
    await user.click(screen.getByRole('button', { name: /^register$/i }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Meter already registered')
    )
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText(/register smart meter/i)).toBeInTheDocument()
  })
})
