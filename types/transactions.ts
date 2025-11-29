/**
 * Transaction types for GridTokenX Platform
 */

export type TransactionType = 
  | 'EnergyTrade'
  | 'TokenMint'
  | 'TokenBurn'
  | 'Stake'
  | 'Unstake'
  | 'Reward'

export type TransactionStatus = 
  | 'pending'
  | 'processing'
  | 'submitted'
  | 'confirmed'
  | 'failed'
  | 'settled'

export interface UserTransaction {
  transaction_type: TransactionType
  operation_id: string
  user_id: string
  status: TransactionStatus
  signature: string | null
  attempts: number
  last_error: string | null
  created_at: string
  submitted_at: string | null
  confirmed_at: string | null
  settled_at: string | null
}

export interface GetUserTransactionsParams {
  transaction_type?: TransactionType
  status?: TransactionStatus
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
  min_attempts?: number
  has_signature?: boolean
}

export type UserTransactionsResponse = UserTransaction[]
