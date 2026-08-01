import { render, screen } from '@testing-library/react'
import { CarbonCredits } from '@/features/portfolio/components/carbon-credits'

const mockUseCarbonCredits = jest.fn()

// The component is presentational now — fetching, polling and the WS refresh
// live in the hook, which has its own test (useCarbonCredits.test.tsx). These
// cases are about how a balance renders, so the hook is stubbed.
jest.mock('@/features/portfolio/hooks/useCarbonCredits', () => ({
    useCarbonCredits: () => mockUseCarbonCredits(),
}))

/**
 * Mirrors `GET /api/v1/carbon/balance` exactly as the handler builds it
 * (trading-api/src/rest.rs:1141) — four fields, decimal strings, no CO2.
 * If the backend shape drifts, these fixtures are what should be updated first.
 */
const balance = (overrides: Record<string, unknown> = {}) => ({
    total_credits: '10.0',
    available_credits: '6.0',
    retired_credits: '0.0',
    last_updated: '2026-07-15T00:00:00Z',
    ...overrides,
})

const givenBalance = (value: unknown) => {
    mockUseCarbonCredits.mockReturnValue({
        balance: value,
        history: [],
        isLoading: false,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
    })
}

const renderCard = async () => {
    render(<CarbonCredits />)
    await screen.findByText('CO2 Impact')
}

const transferButton = () => screen.getByRole('button', { name: 'Transfer Credits' })

beforeEach(() => {
    jest.clearAllMocks()
})

describe('CarbonCredits', () => {
    it('derives CO2 impact from total credits at 0.4 kg each', async () => {
        givenBalance(balance({ total_credits: '10.0' }))
        await renderCard()

        expect(screen.getByText('4.00 kg')).toBeInTheDocument()
    })

    it('reads active credits from the wire field `available_credits`', async () => {
        givenBalance(balance({ available_credits: '6.0' }))
        await renderCard()

        // Regression: this card read a non-existent `active_credits` and so
        // rendered 0.00 for every user regardless of their real balance.
        expect(screen.getByText('6.0')).toBeInTheDocument()
    })

    it('enables transfer when credits are available', async () => {
        givenBalance(balance({ available_credits: '6.0' }))
        await renderCard()

        expect(transferButton()).toBeEnabled()
    })

    it('disables transfer at a zero balance', async () => {
        givenBalance(balance({ available_credits: '0.0' }))
        await renderCard()

        expect(transferButton()).toBeDisabled()
    })

    it('fails closed when the balance field is missing entirely', async () => {
        // The endpoint is untyped (`serde_json::Value`), so a field rename
        // backend-side lands here as undefined rather than a type error.
        givenBalance(balance({ available_credits: undefined }))
        await renderCard()

        // Regression: parseFloat(undefined) -> NaN, and `NaN <= 0` is false,
        // which left the transfer button enabled on an unknown balance.
        expect(transferButton()).toBeDisabled()
    })

    it('renders without crashing when the response carries no balance', async () => {
        givenBalance(null)
        await renderCard()

        // Regression: `balance.kg_co2_equivalent.toFixed(2)` threw a TypeError
        // because the guard tested the object, not the field.
        expect(screen.getByText('0.00 kg')).toBeInTheDocument()
        expect(transferButton()).toBeDisabled()
    })

    it('renders CO2 as zero when total_credits is unparseable', async () => {
        givenBalance(balance({ total_credits: 'n/a' }))
        await renderCard()

        expect(screen.getByText('0.00 kg')).toBeInTheDocument()
    })
})
