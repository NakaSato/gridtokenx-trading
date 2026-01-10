'use client'

/**
 * React Hooks for Real-time Transaction Updates
 * Provides hooks for transaction status changes, P2P order updates, and settlement notifications
 */

import { useState, useEffect, useCallback } from 'react'
import { useWebSocketMessage } from './useWebSocket'
import toast from 'react-hot-toast'

/**
 * Transaction status update from WebSocket
 */
export interface TransactionStatusUpdate {
    operation_id: string
    transaction_type: 'EnergyTrade' | 'TokenMint' | 'TokenBurn' | 'Stake' | 'Unstake' | 'Reward'
    old_status: string
    new_status: string
    signature: string | null
    error_message: string | null
    timestamp: string
}

/**
 * P2P order update from WebSocket
 */
export interface P2POrderUpdate {
    order_id: string
    user_id: string
    side: 'buy' | 'sell'
    status: 'open' | 'partially_filled' | 'filled' | 'cancelled'
    original_amount: string
    filled_amount: string
    remaining_amount: string
    price_per_kwh: string
    timestamp: string
}

/**
 * Settlement complete notification from WebSocket
 */
export interface SettlementComplete {
    settlement_id: string
    buyer_id: string
    seller_id: string
    energy_amount: string
    total_cost: string
    transaction_signature: string | null
    timestamp: string
}

/**
 * Get human-readable label for transaction type
 */
function getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        EnergyTrade: 'Energy Trade',
        TokenMint: 'Token Mint',
        TokenBurn: 'Token Burn',
        Stake: 'Stake',
        Unstake: 'Unstake',
        Reward: 'Reward',
    }
    return labels[type] || type
}

/**
 * Get human-readable label for status
 */
function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        pending: 'Pending',
        processing: 'Processing',
        submitted: 'Submitted',
        confirmed: 'Confirmed',
        failed: 'Failed',
        settled: 'Settled',
        open: 'Open',
        partially_filled: 'Partially Filled',
        filled: 'Filled',
        cancelled: 'Cancelled',
    }
    return labels[status] || status
}

/**
 * Show toast notification for transaction status change
 */
function showTransactionToast(update: TransactionStatusUpdate): void {
    const typeLabel = getTransactionTypeLabel(update.transaction_type)
    const statusLabel = getStatusLabel(update.new_status)

    switch (update.new_status) {
        case 'confirmed':
        case 'settled':
            toast.success(`${typeLabel} ${statusLabel}`, {
                icon: '✅',
                duration: 4000,
            })
            break
        case 'failed':
            toast.error(`${typeLabel} Failed: ${update.error_message || 'Unknown error'}`, {
                icon: '❌',
                duration: 6000,
            })
            break
        case 'processing':
        case 'submitted':
            toast(`${typeLabel} ${statusLabel}`, {
                icon: '⏳',
                duration: 3000,
            })
            break
        default:
            toast(`${typeLabel}: ${statusLabel}`, {
                duration: 3000,
            })
    }
}

/**
 * Show toast notification for P2P order update
 */
function showP2POrderToast(update: P2POrderUpdate): void {
    const sideLabel = update.side === 'buy' ? '🟢 Buy' : '🔴 Sell'
    const statusLabel = getStatusLabel(update.status)

    switch (update.status) {
        case 'filled':
            toast.success(`${sideLabel} Order Filled!`, {
                icon: '🎉',
                duration: 4000,
            })
            break
        case 'partially_filled':
            const fillPercent = (
                (parseFloat(update.filled_amount) / parseFloat(update.original_amount)) *
                100
            ).toFixed(1)
            toast(`${sideLabel} Order ${fillPercent}% Filled`, {
                icon: '📊',
                duration: 3000,
            })
            break
        case 'cancelled':
            toast(`${sideLabel} Order Cancelled`, {
                icon: '🚫',
                duration: 3000,
            })
            break
        default:
            break
    }
}

/**
 * Show toast notification for settlement completion
 */
function showSettlementToast(settlement: SettlementComplete): void {
    const amount = parseFloat(settlement.energy_amount).toFixed(2)
    toast.success(`Settlement Complete: ${amount} kWh`, {
        icon: '⚡',
        duration: 4000,
    })
}

/**
 * Hook for real-time transaction status updates
 * Automatically shows toast notifications and tracks latest updates
 */
export function useTransactionUpdates(
    options: {
        showToasts?: boolean
        onUpdate?: (update: TransactionStatusUpdate) => void
        token?: string
    } = {}
) {
    const { showToasts = true, onUpdate, token } = options
    const [latestUpdate, setLatestUpdate] = useState<TransactionStatusUpdate | null>(null)
    const [updates, setUpdates] = useState<TransactionStatusUpdate[]>([])

    const handleUpdate = useCallback(
        (data: TransactionStatusUpdate) => {
            setLatestUpdate(data)
            setUpdates((prev) => [data, ...prev].slice(0, 50)) // Keep last 50

            if (showToasts) {
                showTransactionToast(data)
            }

            onUpdate?.(data)
        },
        [showToasts, onUpdate]
    )

    const { connected } = useWebSocketMessage<TransactionStatusUpdate>(
        'trades',
        'transaction_status_update',
        handleUpdate,
        token
    )

    return {
        connected,
        latestUpdate,
        updates,
        clearUpdates: () => setUpdates([]),
    }
}

/**
 * Hook for real-time P2P order updates
 * Tracks order status changes and shows notifications
 */
export function useP2POrderUpdates(
    options: {
        showToasts?: boolean
        onUpdate?: (update: P2POrderUpdate) => void
        filterUserId?: string // Only show updates for specific user
        token?: string
    } = {}
) {
    const { showToasts = true, onUpdate, filterUserId, token } = options
    const [latestUpdate, setLatestUpdate] = useState<P2POrderUpdate | null>(null)
    const [activeOrders, setActiveOrders] = useState<Map<string, P2POrderUpdate>>(new Map())

    const handleUpdate = useCallback(
        (data: P2POrderUpdate) => {
            // Filter by user ID if specified
            if (filterUserId && data.user_id !== filterUserId) {
                return
            }

            setLatestUpdate(data)

            // Update active orders map
            setActiveOrders((prev) => {
                const next = new Map(prev)
                if (data.status === 'filled' || data.status === 'cancelled') {
                    next.delete(data.order_id)
                } else {
                    next.set(data.order_id, data)
                }
                return next
            })

            if (showToasts) {
                showP2POrderToast(data)
            }

            onUpdate?.(data)
        },
        [showToasts, onUpdate, filterUserId]
    )

    const { connected } = useWebSocketMessage<P2POrderUpdate>(
        'trades',
        'p2p_order_update',
        handleUpdate,
        token
    )

    return {
        connected,
        latestUpdate,
        activeOrders: Array.from(activeOrders.values()),
        activeOrdersCount: activeOrders.size,
        activeBuyOrders: Array.from(activeOrders.values()).filter((o) => o.side === 'buy'),
        activeSellOrders: Array.from(activeOrders.values()).filter((o) => o.side === 'sell'),
    }
}

/**
 * Hook for settlement completion notifications
 */
export function useSettlementUpdates(
    options: {
        showToasts?: boolean
        onSettlement?: (settlement: SettlementComplete) => void
        filterUserId?: string // Only show settlements involving this user
        token?: string
    } = {}
) {
    const { showToasts = true, onSettlement, filterUserId, token } = options
    const [latestSettlement, setLatestSettlement] = useState<SettlementComplete | null>(null)
    const [settlements, setSettlements] = useState<SettlementComplete[]>([])

    const handleSettlement = useCallback(
        (data: SettlementComplete) => {
            // Filter by user ID if specified (either as buyer or seller)
            if (filterUserId && data.buyer_id !== filterUserId && data.seller_id !== filterUserId) {
                return
            }

            setLatestSettlement(data)
            setSettlements((prev) => [data, ...prev].slice(0, 50))

            if (showToasts) {
                showSettlementToast(data)
            }

            onSettlement?.(data)
        },
        [showToasts, onSettlement, filterUserId]
    )

    const { connected } = useWebSocketMessage<SettlementComplete>(
        'trades',
        'settlement_complete',
        handleSettlement,
        token
    )

    return {
        connected,
        latestSettlement,
        settlements,
        clearSettlements: () => setSettlements([]),
    }
}

/**
 * Combined hook for all real-time trading updates
 * Useful for dashboard or activity views that need all update types
 */
export function useAllTradingUpdates(
    options: {
        showToasts?: boolean
        userId?: string
        token?: string
    } = {}
) {
    const { showToasts = true, userId, token } = options

    const transactions = useTransactionUpdates({ showToasts, token })
    const p2pOrders = useP2POrderUpdates({ showToasts, filterUserId: userId, token })
    const settlements = useSettlementUpdates({ showToasts, filterUserId: userId, token })

    const isConnected = transactions.connected || p2pOrders.connected || settlements.connected

    return {
        isConnected,
        transactions,
        p2pOrders,
        settlements,
    }
}
