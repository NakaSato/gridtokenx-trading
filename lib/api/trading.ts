import { apiRequest, apiRequestText, ApiResponse } from './core'
import type {
    PriceAlert,
    RecurringOrder,
    CreateRecurringOrderRequest
} from '../../types/features'
import type {
    ActiveOrderMetersResponse,
    ApiOrder,
    ListOrdersResponse,
    OrderBookResponse,
    SubmitOrderResponse,
    TradeHistory,
} from '../../types/trading'

// Mirrors trading-api rest.rs ClearingEpochResponse — decimals stringified.
export interface ClearingEpoch {
    epoch_id: string
    epoch_number: number
    start_time: string
    end_time: string
    status: string
    clearing_price: string | null
    total_volume: string | null
    total_orders: number | null
    matched_orders: number | null
}

export class TradingApi {
    constructor(private getToken: () => string | undefined) { }

    async createOrder(orderData: any): Promise<ApiResponse<SubmitOrderResponse>> {
        // price_per_kwh is optional in rest.rs SubmitOrderRequest (omitted for
        // market-sell). Only stringify when present — String(undefined) would send
        // the literal "undefined" and 400 on Decimal::from_str.
        const rawPrice = orderData.price_per_kwh ?? orderData.price
        const payload: Record<string, unknown> = {
            side: orderData.side,
            order_type: orderData.order_type || 'limit',
            energy_amount_kwh: String(orderData.amount ?? orderData.energy_amount_kwh),
            // zone_id 0 ("Main Grid") is a valid zone, not "unset" — `|| 1` was
            // silently coercing it to zone 1, so every order at the default zone
            // was submitted to the wrong zone.
            zone_id: orderData.zone_id ?? 1,
        }
        if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
            payload.price_per_kwh = String(rawPrice)
        }
        if (orderData.meter_id !== undefined) payload.meter_id = orderData.meter_id
        // Serial (the grid map's node id space); trading-service resolves it to
        // meters.id. Sending a serial as meter_id violates the FK and 500s.
        if (orderData.meter_serial !== undefined) payload.meter_serial = orderData.meter_serial
        if (orderData.custodial_sign !== undefined) payload.custodial_sign = orderData.custodial_sign
        if (orderData.time_in_force !== undefined) payload.time_in_force = orderData.time_in_force
        if (orderData.market_segment !== undefined) payload.market_segment = orderData.market_segment
        return apiRequest<SubmitOrderResponse>('/api/v1/orders', {
            method: 'POST',
            body: payload,
            token: this.getToken(),
        })
    }

    async getMarketStats(): Promise<ApiResponse<import('../../types/trading').MarketStatsResponse>> {
        return apiRequest<import('../../types/trading').MarketStatsResponse>('/api/v1/stats', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getOrders(filters?: { status?: string; limit?: number; offset?: number }) {
        const params = new URLSearchParams(filters as any)
        return apiRequest<ListOrdersResponse>(`/api/v1/orders?${params.toString()}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getOrder(orderId: string): Promise<ApiResponse<ApiOrder>> {
        return apiRequest<ApiOrder>(`/api/v1/orders/${orderId}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    /**
     * Meters that currently have resting (pending/active/partially-filled)
     * orders, market-wide. Auth-gated — without a token the map can't tell which
     * meters are trading and should fall back to showing all of them.
     */
    async getActiveOrderMeters(): Promise<ApiResponse<ActiveOrderMetersResponse>> {
        return apiRequest<ActiveOrderMetersResponse>('/api/v1/markets/active-order-meters', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    /**
     * Public, unauthenticated variant of {@link getActiveOrderMeters} for the
     * grid map — same order-presence data, no token, so logged-out viewers can
     * hide non-trading meters. Backed by GET /api/v1/public/active-order-meters.
     */
    async getPublicActiveOrderMeters(): Promise<ApiResponse<ActiveOrderMetersResponse>> {
        return apiRequest<ActiveOrderMetersResponse>('/api/v1/public/active-order-meters', {
            method: 'GET',
        })
    }

    async getOrderBook(zoneId: number = 1) {
        return apiRequest<OrderBookResponse>(`/api/v1/zones/${zoneId}/book`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getMarketData() {
        return apiRequest('/api/v1/stats', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getTrades(filters?: { limit?: number; offset?: number }) {
        const params = new URLSearchParams(filters as any)
        return apiRequest<import('../../types/trading').TradeHistory>(
            `/api/v1/trades?${params.toString()}`,
            { method: 'GET', token: this.getToken() }
        )
    }

    async cancelOrder(orderId: string) {
        return apiRequest(`/api/v1/orders/${orderId}`, {
            method: 'DELETE',
            token: this.getToken(),
        })
    }

    async createP2POrder(orderData: {
        side: 'buy' | 'sell'
        amount: string
        price_per_kwh: string
        zone_id?: number
        signature?: string
        timestamp?: number
    }) {
        return apiRequest<{ id: string }>('/api/v1/orders', {
            method: 'POST',
            body: {
                side: orderData.side,
                // trading-api/src/rest.rs CreateOrderRequest expects energy_amount_kwh
                // (Decimal::from_str on this exact field name) — `energy_amount` alone
                // 400s as "missing field `energy_amount_kwh`" and every order placed
                // through this method (the live OrderForm.tsx Buy/Sell flow) failed.
                energy_amount_kwh: orderData.amount,
                price_per_kwh: orderData.price_per_kwh,
                order_type: 'limit',
                zone_id: orderData.zone_id,
                signature: orderData.signature,
                timestamp: orderData.timestamp
            },
            token: this.getToken(),
        })
    }

    async getP2POrderBook() {
        return apiRequest<{ asks: any[]; bids: any[] }>('/api/v1/markets/orderbook', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getMyP2POrders() {
        return apiRequest<any[]>('/api/v1/orders', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getMatchingStatus() {
        return apiRequest<{
            pending_buy_orders: number
            pending_sell_orders: number
            pending_matches: number
            buy_price_range: { min: number; max: number }
            sell_price_range: { min: number; max: number }
            can_match: boolean
            match_reason: string
        }>('/api/v1/markets/matching-status', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getSettlementStats() {
        return apiRequest<{
            pending_count: number
            processing_count: number
            confirmed_count: number
            failed_count: number
            total_settled_value: number
        }>('/api/v1/markets/settlement-stats', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    // Real quote: rest.rs create_quote computes cost from the request (energy,
    // agreed_price, zones) using configured wheeling/loss. When agreed_price is
    // omitted it prices at the real market VWAP; if the market has never traded
    // it returns 400 (no price to quote) rather than inventing one.
    async calculateP2PCost(request: {
        buyer_zone_id: number
        seller_zone_id: number
        energy_amount: number | string
        agreed_price?: number | string
    }) {
        return apiRequest<{
            quote_id: string
            expires_at: string
            breakdown: {
                energy_cost: string
                wheeling_charge: string
                loss_cost: string
                total_cost: string
            }
            grid_metrics: {
                effective_energy_kwh: string
                loss_factor: string
                zone_distance_km: string
                is_grid_compliant: boolean
            }
        }>('/api/v1/quotes', {
            method: 'POST',
            body: {
                buyer_zone_id: request.buyer_zone_id,
                seller_zone_id: request.seller_zone_id,
                energy_amount_kwh: String(request.energy_amount),
                agreed_price: String(request.agreed_price || '0.00')
            },
            token: this.getToken(),
        })
    }

    async getP2PMarketPrices() {
        return apiRequest<{
            base_price_thb_kwh: number
            grid_import_price_thb_kwh: number
            grid_export_price_thb_kwh: number
            loss_allocation_model: string
            wheeling_charges: Record<string, number>
            loss_factors: Record<string, number>
        }>('/api/v1/markets/p2p/market-prices', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    /**
     * Real trade-derived market price (THB/kWh): VWAP + last/high/low + volume
     * over a trailing window, computed from completed settlements. When
     * `trade_count` is 0 there is no price yet — every price field is "0".
     */
    async getMarketPrice(windowHours = 24) {
        return apiRequest<{
            vwap: string
            last_price: string
            high: string
            low: string
            volume_kwh: string
            trade_count: number
            window_hours: number
            as_of: string
        }>(`/api/v1/markets/price?window_hours=${windowHours}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getMarketConfig() {
        return apiRequest<{
            base_price_thb_kwh: number
            grid_import_price_thb_kwh: number
            grid_export_price_thb_kwh: number
            transaction_fee_bps: number
            min_price_per_kwh: number
            max_price_per_kwh: number
        }>('/api/v1/markets/config', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getTradeHistory(filters?: { limit?: number; offset?: number }) {
        const params = new URLSearchParams()
        if (filters?.limit) params.set('limit', String(filters.limit))
        if (filters?.offset) params.set('offset', String(filters.offset))
        // Amounts are stringified Decimals in rest.rs TradeRecordResponse, not
        // floats — TradeHistory reflects that. Parse with parseFloat at use sites.
        return apiRequest<TradeHistory>(`/api/v1/trades?${params.toString()}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async createPriceAlert(data: {
        symbol: string
        target_price: string
        condition: 'above' | 'below'
    }): Promise<ApiResponse<PriceAlert>> {
        return apiRequest<PriceAlert>('/api/v1/price-alerts', {
            method: 'POST',
            body: data,
            token: this.getToken(),
        })
    }

    async listPriceAlerts(): Promise<ApiResponse<PriceAlert[]>> {
        return apiRequest<PriceAlert[]>('/api/v1/price-alerts', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async deletePriceAlert(id: string): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>(`/api/v1/price-alerts/${id}`, {
            method: 'DELETE',
            token: this.getToken(),
        })
    }

    async createRecurringOrder(data: any): Promise<ApiResponse<any>> {
        const payload = { ...data }
        // Map legacy field names to API model
        if (payload.amount && !payload.energy_amount) {
            payload.energy_amount = payload.amount
            delete payload.amount
        }
        if (payload.frequency && !payload.interval_type) {
            payload.interval_type = payload.frequency
            delete payload.frequency
        }
        // Remove fields not in API model
        delete payload.symbol
        delete payload.start_at
        delete payload.end_at
        return apiRequest<any>('/api/v1/orders/recurring', {
            method: 'POST',
            body: payload,
            token: this.getToken(),
        })
    }

    async listRecurringOrders(): Promise<ApiResponse<RecurringOrder[]>> {
        return apiRequest<RecurringOrder[]>('/api/v1/orders/recurring', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getRecurringOrder(id: string): Promise<ApiResponse<RecurringOrder>> {
        return apiRequest<RecurringOrder>(`/api/v1/orders/recurring/${id}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async cancelRecurringOrder(id: string): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>(`/api/v1/orders/recurring/${id}`, {
            method: 'DELETE',
            token: this.getToken(),
        })
    }

    async pauseRecurringOrder(id: string): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>(`/api/v1/orders/recurring/${id}/pause`, {
            method: 'POST',
            token: this.getToken(),
        })
    }

    async resumeRecurringOrder(id: string): Promise<ApiResponse<{ success: boolean }>> {
        return apiRequest<{ success: boolean }>(`/api/v1/orders/recurring/${id}/resume`, {
            method: 'POST',
            token: this.getToken(),
        })
    }

    // Server supports csv (default, text/csv attachment) and ?format=json only —
    // no pdf. CSV comes back as raw text, so it must bypass the JSON parser.
    async exportTradingHistory(format: 'csv' | 'json' = 'csv') {
        if (format === 'json') {
            return apiRequest<any[]>('/api/v1/trades/export?format=json', {
                method: 'GET',
                token: this.getToken(),
            })
        }
        return apiRequestText('/api/v1/trades/export', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    // Recent uniform-price (Interval) clearing results, newest first.
    // limit clamped server-side to 1..=100 (default 20).
    async getClearingEpochs(limit?: number): Promise<ApiResponse<ClearingEpoch[]>> {
        const qs = limit ? `?limit=${limit}` : ''
        return apiRequest<ClearingEpoch[]>(`/api/v1/markets/clearing-epochs${qs}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }
}
