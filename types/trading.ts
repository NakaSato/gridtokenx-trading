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

export interface TradeRecord {
    id: string;
    quantity: string;
    price: string;
    total_value: string;
    role: "buyer" | "seller";
    executed_at: string;
    status: string;
    buy_order_id?: string;
    sell_order_id?: string;
    counterparty_id?: string;
    product_symbol?: string;
    wheeling_charge?: string;
    loss_cost?: string;
    effective_energy?: string;
    buyer_zone_id?: number;
    seller_zone_id?: number;
}

export interface TradeHistory {
    trades: TradeRecord[];
    total_count: number;
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