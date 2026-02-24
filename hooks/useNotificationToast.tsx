'use client'

import React, { useCallback } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle, Zap, Wallet, TrendingUp, AlertTriangle } from 'lucide-react'
import {
  useOrderFilledWebSocket,
  useOrderMatchedWebSocket,
  useWebSocketMessage,
} from './useWebSocket'
import { useAuth } from '@/contexts/AuthProvider'

interface OrderFilledData {
  order_id: string
  amount: number
  price: number
  side: 'buy' | 'sell'
}

interface OrderMatchedData {
  match_id: string
  buy_order_id: string
  sell_order_id: string
  matched_amount: string
  match_price: string
}

interface SettlementData {
  settlement_id: string
  buyer_id: string
  seller_id: string
  energy_amount: string
  total_cost: string
  transaction_signature?: string
}

interface P2POrderUpdateData {
  order_id: string
  user_id: string
  side: string
  status: string
  original_amount: string
  filled_amount: string
  remaining_amount: string
  price_per_kwh: string
}

interface TransactionStatusData {
  operation_id: string
  transaction_type: string
  old_status: string
  new_status: string
  signature?: string
  error_message?: string
}

// Custom toast content components
const OrderFilledToast = ({ side, amount, price }: { side: string; amount: number; price: number }) => (
  <div className="flex items-center gap-2">
    <CheckCircle className="h-4 w-4 text-green-500" />
    <div>
      <p className="font-medium">{side} Order Filled</p>
      <p className="text-xs opacity-80">
        {amount} kWh @ {price} GRIDX/kWh
      </p>
    </div>
  </div>
)

const OrderMatchedToast = ({ amount, price }: { amount: string; price: string }) => (
  <div className="flex items-center gap-2">
    <Zap className="h-4 w-4 text-yellow-500" />
    <div>
      <p className="font-medium">Order Matched!</p>
      <p className="text-xs opacity-80">
        {amount} kWh @ {price} GRIDX/kWh
      </p>
    </div>
  </div>
)

const SettlementToast = ({ isBuyer, amount, total }: { isBuyer: boolean; amount: string; total: string }) => (
  <div className="flex items-center gap-2">
    <Wallet className="h-4 w-4 text-blue-500" />
    <div>
      <p className="font-medium">Settlement Complete</p>
      <p className="text-xs opacity-80">
        {isBuyer ? 'Bought' : 'Sold'} {amount} kWh for {total} GRIDX
      </p>
    </div>
  </div>
)

const P2PFilledToast = ({ filled, original, price }: { filled: string; original: string; price: string }) => (
  <div className="flex items-center gap-2">
    <CheckCircle className="h-4 w-4 text-green-500" />
    <div>
      <p className="font-medium">P2P Order Fully Filled</p>
      <p className="text-xs opacity-80">
        {filled} kWh filled @ {price} GRIDX/kWh
      </p>
    </div>
  </div>
)

const P2PPartialToast = ({ filled, original }: { filled: string; original: string }) => (
  <div className="flex items-center gap-2">
    <TrendingUp className="h-4 w-4 text-blue-500" />
    <div>
      <p className="font-medium">P2P Order Partially Filled</p>
      <p className="text-xs opacity-80">
        {filled} / {original} kWh filled
      </p>
    </div>
  </div>
)

const TxErrorToast = ({ type, message }: { type: string; message: string }) => (
  <div className="flex items-center gap-2">
    <AlertTriangle className="h-4 w-4 text-red-500" />
    <div>
      <p className="font-medium">Transaction Failed</p>
      <p className="text-xs opacity-80">{type} - {message}</p>
    </div>
  </div>
)

const TxSuccessToast = ({ type, status }: { type: string; status: string }) => (
  <div className="flex items-center gap-2">
    <CheckCircle className="h-4 w-4 text-green-500" />
    <div>
      <p className="font-medium">Transaction {status}</p>
      <p className="text-xs opacity-80">{type}</p>
    </div>
  </div>
)

/**
 * Hook to display toast notifications for WebSocket events
 * Shows toast notifications when orders are filled, matched, settled, etc.
 */
export function useNotificationToast() {
  const { user } = useAuth()
  // Use wallet_address as user identifier since User doesn't have id
  const currentUserId = user?.wallet_address || ''

  // Order filled notification
  useOrderFilledWebSocket(
    useCallback((data: OrderFilledData) => {
      const side = data.side === 'buy' ? 'Buy' : 'Sell'
      toast.success(
        <OrderFilledToast side={side} amount={data.amount} price={data.price} />,
        { duration: 5000, id: `order-filled-${data.order_id}` }
      )
    }, [])
  )

  // Order matched notification
  useOrderMatchedWebSocket(
    useCallback((data: OrderMatchedData) => {
      toast.success(
        <OrderMatchedToast amount={data.matched_amount} price={data.match_price} />,
        { duration: 5000, id: `order-matched-${data.match_id}` }
      )
    }, [])
  )

  // Settlement complete notification
  useWebSocketMessage(
    'trades',
    'settlement_complete',
    useCallback((data: SettlementData) => {
      // Only show if user is buyer or seller (compare by wallet address)
      const isBuyer = currentUserId === data.buyer_id
      const isSeller = currentUserId === data.seller_id
      if (!isBuyer && !isSeller) return

      toast.success(
        <SettlementToast isBuyer={isBuyer} amount={data.energy_amount} total={data.total_cost} />,
        { duration: 6000, id: `settlement-${data.settlement_id}` }
      )
    }, [currentUserId])
  )

  // P2P order update notification
  useWebSocketMessage(
    'trades',
    'p2p_order_update',
    useCallback((data: P2POrderUpdateData) => {
      // Only show for user's own orders (compare by wallet address)
      if (currentUserId !== data.user_id) return

      // Skip if just created
      if (data.status === 'created') return

      const isFilled = parseFloat(data.remaining_amount) === 0
      const isPartial = parseFloat(data.filled_amount) > 0 && !isFilled

      if (isFilled) {
        toast.success(
          <P2PFilledToast filled={data.filled_amount} original={data.original_amount} price={data.price_per_kwh} />,
          { duration: 5000, id: `p2p-filled-${data.order_id}` }
        )
      } else if (isPartial) {
        toast.success(
          <P2PPartialToast filled={data.filled_amount} original={data.original_amount} />,
          { duration: 4000, id: `p2p-partial-${data.order_id}` }
        )
      }
    }, [currentUserId])
  )

  // Transaction status updates
  useWebSocketMessage(
    'trades',
    'transaction_status_update',
    useCallback((data: TransactionStatusData) => {
      // Error notification
      if (data.error_message) {
        toast.error(
          <TxErrorToast type={data.transaction_type} message={data.error_message} />,
          { duration: 6000, id: `tx-error-${data.operation_id}` }
        )
        return
      }

      // Success transition to confirmed/finalized
      if (data.new_status === 'confirmed' || data.new_status === 'finalized') {
        toast.success(
          <TxSuccessToast type={data.transaction_type} status={data.new_status} />,
          { duration: 4000, id: `tx-success-${data.operation_id}` }
        )
      }
    }, [])
  )
}

/**
 * Component that mounts the notification toast hooks
 * Add this inside a provider or layout component
 */
export function NotificationToastProvider({ children }: { children: React.ReactNode }) {
  useNotificationToast()
  return <>{children}</>
}
