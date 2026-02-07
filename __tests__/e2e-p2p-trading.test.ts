/**
 * E2E Integration Test: Smart Meter Reading → Token Minting → P2P Trade → Settlement
 * 
 * Tests the complete flow:
 * 1. Meter reading submission → API gateway → token minting
 * 2. Seller creates sell order (with escrowed tokens)
 * 3. Buyer creates buy order (with locked funds)
 * 4. Matching engine matches orders → settlement
 * 5. Token transfer: seller → buyer
 * 
 * Uses mocked fetch to simulate the API gateway responses.
 */

import { createApiClient, ApiClient } from '@/lib/api-client'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('E2E: Smart Meter → Token Minting → P2P Trade → Settlement', () => {
    const SELLER_TOKEN = 'seller-jwt-token'
    const BUYER_TOKEN = 'buyer-jwt-token'
    const SELLER_WALLET = '2Xyfzwzq7vATKYYT2SPjERVbQESq8F4PXo1WNmo1Ba29'
    const BUYER_WALLET = '5FHwkrdxntdK24hgQU8qgBjn35Y1jmol5CFg5SU4Jurj'
    
    let sellerClient: ApiClient
    let buyerClient: ApiClient

    beforeEach(() => {
        mockFetch.mockClear()
        sellerClient = createApiClient(SELLER_TOKEN)
        buyerClient = createApiClient(BUYER_TOKEN)
    })

    // ========================================================================
    // PHASE 1: Smart Meter Reading → Token Minting
    // ========================================================================
    describe('Phase 1: Meter Reading & Token Minting', () => {
        it('should submit a meter reading with full telemetry and receive minted tokens', async () => {
            // Mock: API gateway accepts reading and mints tokens
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                text: async () => JSON.stringify({
                    message: 'Reading submitted and tokens minted',
                    reading_id: 'rd-001',
                    transaction_signature: '5xK9mQR...solana-tx-sig',
                    kwh_amount: 3.5,
                    tokens_minted: 3500, // 3.5 kWh × 1000 Wh/kWh
                    wallet_address: SELLER_WALLET,
                }),
            })

            const result = await sellerClient.submitMeterData({
                meter_serial: 'SM-001-UUID',
                kwh_amount: 3.5,
                wallet_address: SELLER_WALLET,
                reading_timestamp: new Date().toISOString(),
            })

            expect(result.status).toBe(201)
            expect(result.data).toBeDefined()

            // Verify the fetch was called with correct structure
            const [url, options] = mockFetch.mock.calls[0]
            expect(url).toContain('/api/v1/meters/SM-001-UUID/readings')
            expect(options.method).toBe('POST')
            expect(options.headers.Authorization).toBe(`Bearer ${SELLER_TOKEN}`)

            const body = JSON.parse(options.body)
            expect(body.kwh).toBe(3.5)
            expect(body.wallet_address).toBe(SELLER_WALLET)
        })

        it('should handle zero-surplus readings gracefully', async () => {
            // A pure consumer meter has no surplus — should still be accepted
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({
                    message: 'Reading stored (no tokens minted — zero surplus)',
                    reading_id: 'rd-002',
                    tokens_minted: 0,
                }),
            })

            const result = await sellerClient.submitMeterData({
                meter_serial: 'SM-002-UUID',
                kwh_amount: 0,
                wallet_address: SELLER_WALLET,
                reading_timestamp: new Date().toISOString(),
            })

            expect(result.status).toBe(200)
        })
    })

    // ========================================================================
    // PHASE 2: Seller Creates Sell Order
    // ========================================================================
    describe('Phase 2: Seller Creates Sell Order', () => {
        it('should create a sell order with zone and price, escrow tokens', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                text: async () => JSON.stringify({
                    id: 'order-sell-001',
                    side: 'sell',
                    energy_amount: '5.00',
                    price_per_kwh: '4.50',
                    status: 'pending',
                    zone_id: 1,
                    escrow_locked: true,
                }),
            })

            const result = await sellerClient.createP2POrder({
                side: 'sell',
                amount: '5.00',
                price_per_kwh: '4.50',
                zone_id: 1,
            })

            expect(result.status).toBe(201)
            expect(result.data?.id).toBe('order-sell-001')

            // Verify the payload structure matches what the backend expects
            const body = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(body.side).toBe('sell')
            expect(body.energy_amount).toBe('5.00')
            expect(body.price_per_kwh).toBe('4.50')
            expect(body.order_type).toBe('limit')
            expect(body.zone_id).toBe(1)
        })
    })

    // ========================================================================
    // PHASE 3: Buyer Creates Buy Order
    // ========================================================================
    describe('Phase 3: Buyer Creates Buy Order', () => {
        it('should create a buy order with max price and different zone', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                text: async () => JSON.stringify({
                    id: 'order-buy-001',
                    side: 'buy',
                    energy_amount: '5.00',
                    price_per_kwh: '5.00',
                    status: 'pending',
                    zone_id: 2,
                    funds_locked: true,
                }),
            })

            const result = await buyerClient.createP2POrder({
                side: 'buy',
                amount: '5.00',
                price_per_kwh: '5.00',
                zone_id: 2,
            })

            expect(result.status).toBe(201)
            expect(result.data?.id).toBe('order-buy-001')

            const body = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(body.side).toBe('buy')
            expect(body.zone_id).toBe(2)
        })

        it('should reject buy order with insufficient balance', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                text: async () => JSON.stringify({
                    error: 'Insufficient balance to lock funds for buy order',
                }),
            })

            const result = await buyerClient.createP2POrder({
                side: 'buy',
                amount: '10000.00',
                price_per_kwh: '5.00',
                zone_id: 1,
            })

            expect(result.error).toContain('Insufficient balance')
            expect(result.status).toBe(400)
        })
    })

    // ========================================================================
    // PHASE 4: Matching Engine Matches Orders
    // ========================================================================
    describe('Phase 4: Order Matching', () => {
        it('should report matching status with active buy and sell orders', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({
                    can_match: true,
                    match_reason: 'Overlapping price ranges detected',
                    pending_buy_orders: 3,
                    pending_sell_orders: 5,
                    pending_matches: 0,
                    buy_price_range: { min: 4.0, max: 5.5 },
                    sell_price_range: { min: 3.5, max: 5.0 },
                }),
            })

            const result = await sellerClient.getMatchingStatus()

            expect(result.status).toBe(200)
            expect(result.data?.can_match).toBe(true)
            expect(result.data?.pending_buy_orders).toBe(3)
            expect(result.data?.pending_sell_orders).toBe(5)
        })

        it('should calculate P2P cost with wheeling and losses for cross-zone trade', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({
                    energy_cost: 22.50,         // 5 kWh × 4.50 THB
                    wheeling_charge: 1.25,      // Cross-zone transmission fee
                    loss_cost: 0.45,            // Transmission line losses
                    total_cost: 24.20,          // energy + wheeling + loss
                    effective_energy: 4.90,     // 5 kWh - 2% loss
                    loss_factor: 0.02,          // 2% loss between zones
                    loss_allocation: 'seller',
                    zone_distance_km: 2.5,
                    buyer_zone: 2,
                    seller_zone: 1,
                    is_grid_compliant: true,
                }),
            })

            const result = await buyerClient.calculateP2PCost({
                buyer_zone_id: 2,
                seller_zone_id: 1,
                energy_amount: 5.0,
                agreed_price: 4.50,
            })

            expect(result.status).toBe(200)
            expect(result.data?.effective_energy).toBeLessThan(5.0)  // Losses reduce effective energy
            expect(result.data?.wheeling_charge).toBeGreaterThan(0) // Cross-zone fee
            expect(result.data?.is_grid_compliant).toBe(true)
        })
    })

    // ========================================================================
    // PHASE 5: Settlement — Token Transfer from Seller to Buyer
    // ========================================================================
    describe('Phase 5: Settlement & Token Transfer', () => {
        it('should report settlement stats after successful match', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({
                    confirmed_count: 1,
                    pending_count: 0,
                    processing_count: 0,
                    failed_count: 0,
                    total_settled_value: 24.20,
                }),
            })

            const result = await sellerClient.getSettlementStats()

            expect(result.status).toBe(200)
            expect(result.data?.confirmed_count).toBe(1)
            expect(result.data?.total_settled_value).toBeGreaterThan(0)
        })

        it('should show completed trade in trade history', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({
                    trades: [{
                        id: 'trade-001',
                        buyer_id: 'user-buyer',
                        seller_id: 'user-seller',
                        energy_amount: 5.0,
                        price_per_kwh: 4.50,
                        total_value: 22.50,
                        fee_amount: 0.45,        // 2% platform fee
                        wheeling_charge: 1.25,
                        effective_energy: 4.90,   // After 2% grid loss
                        status: 'completed',
                        transaction_hash: '5xK9mQR...solana-settlement-tx',
                        created_at: new Date().toISOString(),
                    }],
                    total: 1,
                }),
            })

            const result = await buyerClient.getTradeHistory({ limit: 10 })

            expect(result.status).toBe(200)
            const trade = result.data?.trades[0]
            expect(trade).toBeDefined()
            expect(trade?.status).toBe('completed')
            expect(trade?.transaction_hash).toBeDefined()
            // Buyer receives effective_energy (after losses)
            expect(trade?.effective_energy).toBe(4.90)
            // Seller receives total_value - fee
            expect((trade?.total_value ?? 0) - (trade?.fee_amount ?? 0)).toBe(22.05)
        })

        it('should verify buyer balance increased after settlement', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({
                    wallet_address: BUYER_WALLET,
                    token_balance: 4.90,  // Received effective_energy
                    sol_balance: 0.5,
                }),
            })

            const result = await buyerClient.getBalance(BUYER_WALLET)

            expect(result.status).toBe(200)
            expect(result.data?.token_balance).toBe(4.90)
        })

        it('should verify seller balance shows net earnings', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({
                    wallet_address: SELLER_WALLET,
                    token_balance: 0,     // Tokens transferred to buyer
                    sol_balance: 0.5,
                    earnings: 22.05,      // Total - platform fee
                }),
            })

            const result = await sellerClient.getBalance(SELLER_WALLET)

            expect(result.status).toBe(200)
            expect(result.data?.token_balance).toBe(0) // Sold all tokens
        })
    })

    // ========================================================================
    // Full E2E Flow
    // ========================================================================
    describe('Full E2E Flow (sequential)', () => {
        it('should complete the entire flow: reading → mint → sell → buy → match → settle', async () => {
            // Step 1: Meter reading + token minting
            mockFetch.mockResolvedValueOnce({
                ok: true, status: 201,
                text: async () => JSON.stringify({
                    reading_id: 'rd-e2e',
                    tokens_minted: 5000,
                    transaction_signature: 'tx-mint-001',
                }),
            })

            const mintResult = await sellerClient.submitMeterData({
                meter_serial: 'SM-E2E',
                kwh_amount: 5.0,
                wallet_address: SELLER_WALLET,
                reading_timestamp: new Date().toISOString(),
            })
            expect(mintResult.status).toBe(201)

            // Step 2: Seller creates sell order
            mockFetch.mockResolvedValueOnce({
                ok: true, status: 201,
                text: async () => JSON.stringify({ id: 'order-sell-e2e', status: 'pending' }),
            })

            const sellResult = await sellerClient.createP2POrder({
                side: 'sell', amount: '5.00', price_per_kwh: '4.50', zone_id: 1,
            })
            expect(sellResult.status).toBe(201)

            // Step 3: Buyer creates buy order
            mockFetch.mockResolvedValueOnce({
                ok: true, status: 201,
                text: async () => JSON.stringify({ id: 'order-buy-e2e', status: 'pending' }),
            })

            const buyResult = await buyerClient.createP2POrder({
                side: 'buy', amount: '5.00', price_per_kwh: '5.00', zone_id: 2,
            })
            expect(buyResult.status).toBe(201)

            // Step 4: Check that matching engine can match
            mockFetch.mockResolvedValueOnce({
                ok: true, status: 200,
                text: async () => JSON.stringify({
                    can_match: true,
                    pending_buy_orders: 1,
                    pending_sell_orders: 1,
                    pending_matches: 1,
                }),
            })

            const matchStatus = await sellerClient.getMatchingStatus()
            expect(matchStatus.data?.can_match).toBe(true)
            expect(matchStatus.data?.pending_matches).toBeGreaterThan(0)

            // Step 5: Settlement completes
            mockFetch.mockResolvedValueOnce({
                ok: true, status: 200,
                text: async () => JSON.stringify({
                    confirmed_count: 1,
                    pending_count: 0,
                    failed_count: 0,
                    total_settled_value: 22.50,
                }),
            })

            const settlement = await sellerClient.getSettlementStats()
            expect(settlement.data?.confirmed_count).toBe(1)

            // Step 6: Verify buyer received tokens
            mockFetch.mockResolvedValueOnce({
                ok: true, status: 200,
                text: async () => JSON.stringify({
                    wallet_address: BUYER_WALLET,
                    token_balance: 4.90, // effective_energy after 2% loss
                }),
            })

            const buyerBalance = await buyerClient.getBalance(BUYER_WALLET)
            expect(buyerBalance.data?.token_balance).toBe(4.90)

            // Verify total number of API calls matches the flow
            expect(mockFetch).toHaveBeenCalledTimes(6)
        })
    })
})
