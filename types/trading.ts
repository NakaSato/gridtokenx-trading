export interface Bar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TradeRecord {
    id: string;
    buy_order_id: string;
    sell_order_id: string;
    quantity: string;
    price: string;
    total_value: string;
    role: "buyer" | "seller";
    counterparty_id: string;
    executed_at: string;
    status: string;
}

export interface TradeHistory {
    trades: TradeRecord[];
    total_count: number;
}