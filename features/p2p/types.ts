import type { PublicKey } from '@solana/web3.js'
import type { BN } from '@coral-xyz/anchor'

/** Shape of an on-chain P2P order account (matches the trading IDL). */
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

/**
 * A pending "fill this order" intent handed from wherever the user picked it
 * (grid map, live stats) to the order form.
 */
export interface OrderFill {
  amount: number
  price?: number
  targetOrder?: OrderAccount
}
