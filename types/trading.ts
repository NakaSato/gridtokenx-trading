export interface Bar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface ApiFuturesPosition {
    id: string;
    product_symbol: string;
    side: 'long' | 'short';
    entry_price: string;
    quantity: string;
    unrealized_pnl?: string;
}

export interface ApiOrder {
    id: string;
    zone_id: number;
    side: string;
    order_type: 'market' | 'limit';
    status: string;
    energy_amount_kwh: string;
    // null for market orders: the backend stores a synthetic ceiling/cap bid for
    // them, not a real price, so it omits it. Limit orders carry a real price.
    price_per_kwh: string | null;
    filled_amount_kwh: string;
    created_at: string;
}

/** rest.rs SubmitOrderRequest — decimals are stringified. */
export interface SubmitOrderRequest {
    side: 'buy' | 'sell';
    order_type: 'limit' | 'market';
    energy_amount_kwh: string;
    /** opt; required for limit + market-buy (slippage cap). Omit for market-sell. */
    price_per_kwh?: string;
    zone_id?: number;
    meter_id?: string;
    custodial_sign?: boolean;
    /** default 'gtc' */
    time_in_force?: 'gtc' | 'ioc' | 'fok';
    /** default 'realtime' */
    market_segment?: 'realtime' | 'interval';
}

/** rest.rs SubmitOrderResponse. */
export interface SubmitOrderResponse {
    id: string;
    status: string;
    created_at: string;
}

export interface Pagination {
    total: number;
    limit: number;
    offset: number;
}

/** rest.rs ListOrdersResponse — GET /orders. */
export interface ListOrdersResponse {
    data: ApiOrder[];
    pagination: Pagination;
}

/** [price, quantity] tuple as returned by the order book. */
export type PriceLevel = [string, string];

/** rest.rs OrderBookResponse — GET /zones/{id}/book. */
export interface OrderBookResponse {
    zone_id: number;
    last_update_id: number;
    asks: PriceLevel[];
    bids: PriceLevel[];
}

// rest.rs TradeRecordResponse — every amount is a stringified Decimal.
export interface TradeRecord {
    id: string;
    buyer_id?: string;
    seller_id?: string;
    counterparty_id?: string;
    role: "buyer" | "seller";
    quantity: string;
    energy_amount?: string;
    price: string;
    price_per_kwh?: string;
    total_value: string;
    fee_amount?: string;
    wheeling_charge?: string;
    loss_cost?: string;
    effective_energy?: string;
    status: string;
    transaction_hash?: string;
    buy_order_id?: string;
    sell_order_id?: string;
    buyer_zone_id?: number;
    seller_zone_id?: number;
    executed_at: string;
    created_at?: string;
    product_symbol?: string;
}

// rest.rs TradesListResponse — GET /trades. Carries both counts.
export interface TradeHistory {
    trades: TradeRecord[];
    total_count: number;
    total: number;
}

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface OnChainTradeRecord {
    sellOrder: PublicKey;
    buyOrder: PublicKey;
    seller: PublicKey;
    buyer: PublicKey;
    amount: BN;
    pricePerKwh: BN;
    totalValue: BN;
    feeAmount: BN;
    executedAt: BN;
}


// --- Market Stats ---

export interface ZoneStats {
    zone_id: number;
    generator_count: number;
    consumer_count: number;
    total_generation: string;
    total_consumption: string;
    net_balance: string;
}

export interface MarketStatsResponse {
    timestamp: string;
    total_volume_24h_kwh: string;
    avg_price_24h: string;
    active_users: number;
    grid_stability_index: string;
    renewable_ratio: string;
}