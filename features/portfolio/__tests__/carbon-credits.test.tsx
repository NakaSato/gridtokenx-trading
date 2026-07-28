import { render, screen } from '@testing-library/react'
import { CarbonCredits } from '@/features/portfolio/components/carbon-credits'

jest.mock('@/contexts/AuthProvider', () => ({
    useAuth: () => ({ token: 'test-token', isAuthenticated: true }),
}))

const mockGetCarbonBalance = jest.fn()
const mockGetCarbonHistory = jest.fn()

jest.mock('@/lib/api-client', () => ({
    createApiClient: () => ({
        getCarbonBalance: mockGetCarbonBalance,
        getCarbonHistory: mockGetCarbonHistory,
    }),
}))

/**
 * Mirrors `GET /api/v1/carbon/balance` exactly as the handler builds it
 * (trading-api/src/rest.rs:1141) — four fields, decimal strings, no CO2.
 * If the backend shape drifts, these fixtures are what should be updated first.
 */
const balanceResponse = (overrides: Record<string, unknown> = {}) => ({
    data: {
        total_credits: '10.0',
        available_credits: '6.0',
        retired_credits: '0.0',
        last_updated: '2026-07-15T00:00:00Z',
        ...overrides,
    },
})

const renderCard = async () => {
    render(<CarbonCredits />)
    await screen.findByText('CO2 Impact')
}

const transferButton = () => screen.getByRole('button', { name: 'Transfer Credits' })

beforeEach(() => {
    jest.clearAllMocks()
    mockGetCarbonHistory.mockResolvedValue({ data: [] })
})

describe('CarbonCredits', () => {
    it('derives CO2 impact from total credits at 0.4 kg each', async () => {
        mockGetCarbonBalance.mockResolvedValue(balanceResponse({ total_credits: '10.0' }))
        await renderCard()

        expect(screen.getByText('4.00 kg')).toBeInTheDocument()
    })

    it('reads active credits from the wire field `available_credits`', async () => {
        mockGetCarbonBalance.mockResolvedValue(balanceResponse({ available_credits: '6.0' }))
        await renderCard()

        // Regression: this card read a non-existent `active_credits` and so
        // rendered 0.00 for every user regardless of their real balance.
        expect(screen.getByText('6.0')).toBeInTheDocument()
    })

    it('enables transfer when credits are available', async () => {
        mockGetCarbonBalance.mockResolvedValue(balanceResponse({ available_credits: '6.0' }))
        await renderCard()

        expect(transferButton()).toBeEnabled()
    })

    it('disables transfer at a zero balance', async () => {
        mockGetCarbonBalance.mockResolvedValue(balanceResponse({ available_credits: '0.0' }))
        await renderCard()

        expect(transferButton()).toBeDisabled()
    })

    it('fails closed when the balance field is missing entirely', async () => {
        // The endpoint is untyped (`serde_json::Value`), so a field rename
        // backend-side lands here as undefined rather than a type error.
        mockGetCarbonBalance.mockResolvedValue(balanceResponse({ available_credits: undefined }))
        await renderCard()

        // Regression: parseFloat(undefined) -> NaN, and `NaN <= 0` is false,
        // which left the transfer button enabled on an unknown balance.
        expect(transferButton()).toBeDisabled()
    })

    it('renders without crashing when the response carries no balance', async () => {
        mockGetCarbonBalance.mockResolvedValue({ data: null })
        await renderCard()

        // Regression: `balance.kg_co2_equivalent.toFixed(2)` threw a TypeError
        // because the guard tested the object, not the field.
        expect(screen.getByText('0.00 kg')).toBeInTheDocument()
        expect(transferButton()).toBeDisabled()
    })

    it('renders CO2 as zero when total_credits is unparseable', async () => {
        mockGetCarbonBalance.mockResolvedValue(balanceResponse({ total_credits: 'n/a' }))
        await renderCard()

        expect(screen.getByText('0.00 kg')).toBeInTheDocument()
    })
})
