'use client'

/**
 * React Hooks for Real-time Transaction Updates
 * Provides hooks for transaction status changes, P2P order updates, and settlement notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWebSocketMessage } from '@/lib/ws/useWebSocket'
import toast from 'react-hot-toast'
import throttle from 'lodash.throttle'
import type {
    ConditionalOrderTriggered,
    OrderBookSnapshotUpdate,
    P2POrderBookEntry,
    P2POrderUpdate,
    SettlementComplete,
    TransactionStatusUpdate,
} from '@/types/ws'

export type {
    ConditionalOrderTriggered,
    OrderBookSnapshotUpdate,
    P2POrderBookEntry,
    P2POrderUpdate,
    SettlementComplete,
    TransactionStatusUpdate,
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
 * Show toast notification for conditional order trigger
 */
function showConditionalOrderToast(update: ConditionalOrderTriggered): void {
    const typeLabel = update.trigger_type === 'StopLoss' ? 'Stop-Loss' : 
                     update.trigger_type === 'TakeProfit' ? 'Take-Profit' : 
                     update.trigger_type === 'TrailingStop' ? 'Trailing Stop' : update.trigger_type
    
    const sideLabel = update.side.toLowerCase() === 'buy' ? '🟢 Buy' : '🔴 Sell'
    
    toast(`${typeLabel} Triggered! ${sideLabel}`, {
        icon: '🔔',
        duration: 5000,
        style: {
            border: '1px solid #7137f1',
            padding: '16px',
            color: '#7137f1',
        },
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

    // Use a ref to accumulate updates between throttles
    const updatesQueue = useRef<TransactionStatusUpdate[]>([])

    const flushUpdates = useCallback(
        throttle(() => {
            if (updatesQueue.current.length === 0) return

            const updates = [...updatesQueue.current]
            updatesQueue.current = []

            setLatestUpdate(updates[0])
            setUpdates((prev) => [...updates, ...prev].slice(0, 50)) // Keep last 50

            if (showToasts) {
                // To avoid toast overload, we only show toast for the most recent 3 updates if there's a flood
                const displayUpdates = updates.slice(0, 3)
                displayUpdates.forEach(u => showTransactionToast(u))
            }

            if (onUpdate) onUpdate(updates[0])
        }, 150, { leading: true, trailing: true }),
        [showToasts, onUpdate]
    )

    const handleUpdate = useCallback(
        (data: TransactionStatusUpdate) => {
            updatesQueue.current.unshift(data)
            flushUpdates()
        },
        [flushUpdates]
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

    // Use a ref to accumulate map updates between throttles
    const updatesQueue = useRef<P2POrderUpdate[]>([])

    // Throttled flush to the actual React states
    const flushUpdates = useCallback(
        throttle(() => {
            if (updatesQueue.current.length === 0) return

            const updates = [...updatesQueue.current]
            updatesQueue.current = []

            // Set latest
            setLatestUpdate(updates[0])

            // Batch into active orders map
            setActiveOrders((prev) => {
                const next = new Map(prev)
                updates.forEach(data => {
                    if (data.status === 'filled' || data.status === 'cancelled') {
                        next.delete(data.order_id)
                    } else {
                        next.set(data.order_id, data)
                    }
                })
                return next
            })

            // Run toasts sequentially to prevent massive popups
            if (showToasts) {
                // To avoid toast overload, we only show toast for the most recent 3 updates if there's a flood
                const displayUpdates = updates.slice(0, 3)
                displayUpdates.forEach(u => showP2POrderToast(u))
            }

            // Trigger generic callback on last item
            if (onUpdate) onUpdate(updates[0])

        }, 150, { leading: true, trailing: true }),
        [showToasts, onUpdate]
    )

    const handleUpdate = useCallback(
        (data: P2POrderUpdate) => {
            if (filterUserId && data.user_id !== filterUserId) return

            updatesQueue.current.unshift(data)
            flushUpdates()
        },
        [flushUpdates, filterUserId]
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

    const settlementsQueue = useRef<SettlementComplete[]>([])

    const flushSettlements = useCallback(
        throttle(() => {
            if (settlementsQueue.current.length === 0) return

            const stlUpdates = [...settlementsQueue.current]
            settlementsQueue.current = []

            setLatestSettlement(stlUpdates[0])
            setSettlements((prev) => [...stlUpdates, ...prev].slice(0, 50))

            if (showToasts) {
                const displayUpdates = stlUpdates.slice(0, 3)
                displayUpdates.forEach(s => showSettlementToast(s))
            }

            if (onSettlement) onSettlement(stlUpdates[0])
        }, 150, { leading: true, trailing: true }),
        [showToasts, onSettlement]
    )

    const handleSettlement = useCallback(
        (data: SettlementComplete) => {
            // Filter by user ID if specified (either as buyer or seller)
            if (filterUserId && data.buyer_id !== filterUserId && data.seller_id !== filterUserId) {
                return
            }

            settlementsQueue.current.unshift(data)
            flushSettlements()
        },
        [flushSettlements, filterUserId]
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
