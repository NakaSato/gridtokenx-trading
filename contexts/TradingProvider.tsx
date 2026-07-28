'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'

// Shape of an on-chain P2P order account (matches trading IDL)
export interface OrderAccount {
  publicKey: PublicKey
  account: {
    authority: PublicKey
    seller: PublicKey
    buyer: PublicKey
    amount: BN
    pricePerKwh: BN
    filledAmount: BN
    status: any // Enum
    orderType: any // Enum
    market: PublicKey
    createdAt: BN
    expiresAt: BN
  }
}

export interface OrderFill {
  amount: number
  price?: number
  targetOrder?: OrderAccount
}

interface TradingContextType {
  activeOrderFill: OrderFill | null
  setActiveOrderFill: (fill: OrderFill | null) => void
}

export const TradingContext = createContext<TradingContextType>({
  activeOrderFill: null,
  setActiveOrderFill: () => {},
})

export const useTrading = () => useContext(TradingContext)

// Cross-component handoff of a selected order fill (grid map / stats → order
// form). All on-chain read/write logic that used to live here was removed:
// it had zero call sites. Chain access belongs in feature-level hooks.
export const TradingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeOrderFill, setActiveOrderFill] = useState<OrderFill | null>(
    null
  )

  return (
    <TradingContext.Provider value={{ activeOrderFill, setActiveOrderFill }}>
      {children}
    </TradingContext.Provider>
  )
}
