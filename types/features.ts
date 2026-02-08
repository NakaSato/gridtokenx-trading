/**
 * Phase 3 Features Types for GridTokenX
 */

// --- Carbon Credits ---
export type CarbonStatus = 'active' | 'retired' | 'transferred' | 'expired';

export interface CarbonCredit {
    id: string;
    user_id: string;
    amount: string;
    source: string;
    source_reference_id?: string;
    status: CarbonStatus;
    description?: string;
    created_at: string;
}

export interface CarbonBalanceResponse {
    total_credits: string;
    active_credits: string;
    retired_credits: string;
    transferred_credits: string;
    kg_co2_equivalent: number;
}

export interface CarbonTransaction {
    id: string;
    sender_id: string;
    receiver_id: string;
    amount: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    notes?: string;
    created_at: string;
}

// --- Multi-wallet ---
export interface UserWallet {
    id: string;
    user_id: string;
    wallet_address: string;
    label?: string;
    is_primary: boolean;
    verified: boolean;
    created_at: string;
}

export interface LinkWalletRequest {
    wallet_address: string;
    label?: string;
    is_primary?: boolean;
}

// --- Notifications ---
export type NotificationType = 'system' | 'trade' | 'alert' | 'wallet' | 'reward';

export interface Notification {
    id: string;
    user_id: string;
    notification_type: NotificationType;
    title: string;
    message: string;
    data?: any;
    is_read: boolean;
    created_at: string;
}

export interface NotificationPreferences {
    email_enabled: boolean;
    push_enabled: boolean;
    trade_notifications: boolean;
    alert_notifications: boolean;
    system_notifications: boolean;
}

// --- Price Alerts ---
export interface PriceAlert {
    id: string;
    user_id: string;
    symbol: string;
    target_price: string;
    condition: 'above' | 'below';
    is_active: boolean;
    created_at: string;
}

// --- Recurring Orders ---
export interface RecurringOrder {
    id: string;
    user_id: string;
    symbol: string;
    side: 'buy' | 'sell';
    amount: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    start_at: string;
    end_at?: string;
    last_run_at?: string;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    created_at: string;
}

export interface CreateRecurringOrderRequest {
    symbol: string;
    side: 'buy' | 'sell';
    amount: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    start_at?: string;
    end_at?: string;
}
