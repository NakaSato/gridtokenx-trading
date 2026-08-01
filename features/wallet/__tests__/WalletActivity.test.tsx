import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import WalletActivity from '@/features/wallet/components/WalletActivity'

jest.mock('@/features/auth/provider', () => ({
    useAuth: () => ({ token: 'test-token', user: null }),
}))
jest.mock('@/features/portfolio/hooks/usePortfolio', () => ({
    useProfile: () => ({ data: { id: 'user-1' } }),
}))

// The realtime WS feed is inert in these tests — the REST fetch is what we
// assert. Its behaviour is covered in useWalletActivity.test.tsx.
jest.mock('@/features/trading/hooks/useTransactionUpdates', () => ({
    useTransactionUpdates: () => ({ latestUpdate: null }),
}))
jest.mock('@/lib/ws/useWebSocket', () => ({
    useWebSocketMessage: () => ({ connected: false, latestMessage: null }),
}))

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: { success: jest.fn(), error: jest.fn() },
}))

const mockGetUserTransactions = jest.fn()

jest.mock('@/lib/api/useApiClient', () => ({
    useApiClient: () => ({
        getUserTransactions: (...args: unknown[]) => mockGetUserTransactions(...args),
    }),
}))

/**
 * Mirrors trading-service `TransactionData` (trading-core/src/models.rs:648):
 * GET /api/v1/transactions returns a bare ARRAY of these — no wrapper object.
 */
type TxFixture = {
    id: string
    transaction_type: string
    amount: string
    asset: string
    status: string
    timestamp: string
    reference_id: string | null
}

const tx = (overrides: Partial<TxFixture> = {}): TxFixture => ({
    id: 'abcdef12-3456-7890-abcd-ef1234567890',
    transaction_type: 'trading',
    amount: '45.00',
    asset: 'GRID',
    status: 'confirmed',
    timestamp: new Date('2026-07-19T10:00:00Z').toISOString(),
    reference_id: null,
    ...overrides,
})

const renderPanel = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return render(
        <QueryClientProvider client={queryClient}>
            <WalletActivity />
        </QueryClientProvider>
    )
}

beforeEach(() => {
    jest.clearAllMocks()
})

describe('WalletActivity — bare TransactionData array contract', () => {
    it('renders rows from a bare array (regression: prior {transactions} wrapper left it empty)', async () => {
        mockGetUserTransactions.mockResolvedValue({ data: [tx()] })

        renderPanel()

        // Row economics come straight off the array element.
        expect(await screen.findByText('Energy Trade')).toBeInTheDocument()
        // Badge is CSS-uppercased; the DOM text stays lowercase.
        expect(screen.getByText('confirmed')).toBeInTheDocument()
        expect(screen.getByText(/45\.00 GRID/)).toBeInTheDocument()
        expect(screen.queryByText('No transactions found')).not.toBeInTheDocument()
    })

    it('shows the empty state for an empty array', async () => {
        mockGetUserTransactions.mockResolvedValue({ data: [] })

        renderPanel()

        expect(await screen.findByText('No transactions found')).toBeInTheDocument()
    })

    it('surfaces an API error with a retry control', async () => {
        mockGetUserTransactions.mockResolvedValue({ error: 'Database error' })

        renderPanel()

        expect(await screen.findByText('Database error')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })
})
