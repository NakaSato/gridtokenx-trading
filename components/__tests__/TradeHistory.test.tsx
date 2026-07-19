import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TradeHistory from '../TradeHistory'

jest.mock('@/contexts/AuthProvider', () => ({
    useAuth: () => ({ token: 'test-token' }),
}))

jest.mock('@/contexts/SocketContext', () => ({
    useSocket: () => ({ socket: null }),
}))

const mockGetTrades = jest.fn()

jest.mock('@/lib/api-client', () => ({
    defaultApiClient: {
        setToken: jest.fn(),
        getTrades: (...args: unknown[]) => mockGetTrades(...args),
    },
}))

/**
 * Field names and the `permanently_failed` literal mirror the backend's
 * TradeRecordResponse (trading-api/src/rest.rs:1646) — a trade row is a
 * settlement row, so status/retry_count/error_message come straight off
 * SettlementStatus (trading-core/src/models.rs:395).
 */
type TradeFixture = {
    id: string
    quantity: string
    price: string
    total_value: string
    role: 'buyer' | 'seller'
    counterparty_id: string
    executed_at: string
    status: string
    retry_count?: number
    error_message?: string | null
    buyer_zone_id?: number
    seller_zone_id?: number
}

const baseTrade: TradeFixture = {
    id: 'abcdef12-3456-7890-abcd-ef1234567890',
    quantity: '10',
    price: '4.50',
    total_value: '45.00',
    role: 'buyer',
    counterparty_id: 'counterparty-1',
    executed_at: new Date().toISOString(),
    status: 'completed',
}

const trade = (overrides: Partial<TradeFixture> = {}): TradeFixture => ({
    ...baseTrade,
    ...overrides,
})

const renderWithTrades = async (trades: TradeFixture[]) => {
    mockGetTrades.mockResolvedValue({ data: { trades } })
    render(<TradeHistory />)
    // Clears the loading skeleton once the first fetch resolves.
    await screen.findByText('Market Activity')
}

const DIAGNOSTICS_LABEL = 'Settlement permanently failed — show diagnostics'

beforeEach(() => {
    jest.clearAllMocks()
})

describe('TradeHistory — permanently_failed settlements', () => {
    it('replaces the status badge with a diagnostics control', async () => {
        await renderWithTrades([trade({ status: 'permanently_failed' })])

        expect(screen.getByLabelText(DIAGNOSTICS_LABEL)).toBeInTheDocument()
        // The badge is suppressed entirely — the icon stands in for the state.
        expect(screen.queryByText('PERMANENTLY_FAILED')).not.toBeInTheDocument()
    })

    it('badges only in-flight/failed states and shows no diagnostics for non-terminal states', async () => {
        await renderWithTrades([
            trade({ id: 'trade-completed', status: 'completed' }),
            trade({ id: 'trade-pending', status: 'pending' }),
            trade({ id: 'trade-failed', status: 'failed' }),
        ])

        // Success settles silently — the row itself is the confirmation, no badge.
        expect(screen.queryByText('COMPLETED')).not.toBeInTheDocument()
        expect(screen.getByText('PENDING')).toBeInTheDocument()
        // Retryable `failed` is distinct from terminal `permanently_failed`:
        // it still renders as a badge, not as a diagnostics icon.
        expect(screen.getByText('FAILED')).toBeInTheDocument()
        expect(screen.queryByLabelText(DIAGNOSTICS_LABEL)).not.toBeInTheDocument()
    })

    it('surfaces the worker error message and retry count on hover', async () => {
        const user = userEvent.setup()
        await renderWithTrades([
            trade({
                status: 'permanently_failed',
                retry_count: 3,
                error_message: 'chain bridge rejected: insufficient escrow',
            }),
        ])

        await user.hover(screen.getByLabelText(DIAGNOSTICS_LABEL))

        const tooltip = await screen.findByRole('tooltip')
        expect(
            within(tooltip).getByText('chain bridge rejected: insufficient escrow'),
        ).toBeInTheDocument()
        // Trade id is truncated to the first 8 chars for the diagnostics line.
        expect(within(tooltip).getByText('Retries: 3 · Trade abcdef12')).toBeInTheDocument()
    })

    it('falls back when the worker recorded no error message', async () => {
        const user = userEvent.setup()
        await renderWithTrades([
            trade({ status: 'permanently_failed', retry_count: 5, error_message: null }),
        ])

        await user.hover(screen.getByLabelText(DIAGNOSTICS_LABEL))

        const tooltip = await screen.findByRole('tooltip')
        expect(within(tooltip).getByText('No error message recorded.')).toBeInTheDocument()
    })

    it('defaults a missing retry_count to zero', async () => {
        const user = userEvent.setup()
        await renderWithTrades([trade({ status: 'permanently_failed' })])

        await user.hover(screen.getByLabelText(DIAGNOSTICS_LABEL))

        const tooltip = await screen.findByRole('tooltip')
        expect(within(tooltip).getByText(/Retries: 0/)).toBeInTheDocument()
    })

    it('renders the rest of the row normally for a failed settlement', async () => {
        await renderWithTrades([
            trade({
                status: 'permanently_failed',
                quantity: '12.5',
                price: '4.20',
                total_value: '52.50',
                role: 'seller',
            }),
        ])

        // A terminal failure must not blank out the trade's economics.
        expect(screen.getByText('12.50')).toBeInTheDocument()
        expect(screen.getByText('@4.20')).toBeInTheDocument()
        expect(screen.getByText('SELL')).toBeInTheDocument()
        expect(screen.getByText(/52\.50/)).toBeInTheDocument()
    })

    it('marks only the failed row when statuses are mixed', async () => {
        await renderWithTrades([
            trade({ id: 'ok-trade-1111-2222-3333-444444444444', status: 'confirmed' }),
            trade({ id: 'bad-trade-1111-2222-3333-44444444444', status: 'permanently_failed' }),
        ])

        expect(screen.getAllByLabelText(DIAGNOSTICS_LABEL)).toHaveLength(1)
        // The confirmed row settles silently — no status badge, just the row.
        expect(screen.queryByText('CONFIRMED')).not.toBeInTheDocument()
    })
})
