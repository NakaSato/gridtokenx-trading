'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { OrderFill } from '@/features/p2p/types'

interface OrderFillContextValue {
  activeOrderFill: OrderFill | null
  setActiveOrderFill: (fill: OrderFill | null) => void
}

const OrderFillContext = createContext<OrderFillContextValue>({
  activeOrderFill: null,
  setActiveOrderFill: () => {},
})

export const useOrderFill = () => useContext(OrderFillContext)

/**
 * Carries a selected order from the grid map / live stats over to the order
 * form, which consumes and clears it. This is the whole of what the old
 * TradingProvider still did once its unused on-chain surface was removed.
 */
export function OrderFillProvider({ children }: { children: ReactNode }) {
  const [activeOrderFill, setActiveOrderFill] = useState<OrderFill | null>(null)

  return (
    <OrderFillContext.Provider value={{ activeOrderFill, setActiveOrderFill }}>
      {children}
    </OrderFillContext.Provider>
  )
}
