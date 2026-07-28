export interface Wallet {
  name: string;
  iconPath: string;
  id: string;
}

import type { Coin } from '@/lib/data/coins'
import type { Token } from '@/lib/data/tokenlist'

export interface Transaction {
  transactionID: string
  token: Coin
  transactionType: string
  optionType: string
  expiry: string
  strikePrice: number
  quantity?: number
  totalValue?: number
  wheelingCharge?: number
  lossCost?: number
  effectiveEnergy?: number
  buyerZoneId?: number
  sellerZoneId?: number
}

export interface FuturesTransaction {
  transactionID: string
  token: Token
  transactionType: string
  futureType: string
  expiry: string | 'N/A'
  leverage: number
  purchaseDate: string
}

export interface FuturePos {
  token: Token
  symbol: string
  futureType: 'perps' | 'dated'
  position: 'long' | 'short'
  entryPrice: number
  LiqPrice: number
  size: number
  collateral: number
  TPSL: number
  logo: string
  leverage: number
  purchaseDate: string
}
