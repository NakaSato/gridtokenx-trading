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

/**
 * Mirrors trading-service `TransactionData` (trading-core/src/models.rs:648) —
 * the exact wire shape of GET /api/v1/transactions, which returns a bare ARRAY
 * of these (no wrapper). Backed by the `settlements` table via analytics_repo,
 * so it carries only settlement-level fields: no per-op signature, energy
 * metadata, or confirmed/settled timestamps (those live on other endpoints).
 */
export interface UserTransaction {
  id: string
  transaction_type: string // backend emits 'trading' for settlement rows
  amount: string // Decimal string
  asset: string // e.g. 'GRID'
  status: string
  timestamp: string
  reference_id: string | null
  /**
   * Runtime-only: merged in from the realtime WS `TransactionStatusUpdate`
   * feed (useTransactionUpdates), never present on the REST response.
   */
  signature?: string | null
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

// NOTE: GET /api/v1/transactions returns a bare `UserTransaction[]`, NOT a
// wrapper object. A prior `{ transactions, total }` shape never matched the
// backend and left WalletActivity permanently empty.
