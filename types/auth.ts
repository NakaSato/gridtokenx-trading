// Matches IAM contract: POST /api/v1/auth/register accepts only these roles
// (default consumer). Do not add "producer"/"user"/"ami" — the backend rejects them.
export type Role = 'prosumer' | 'consumer'

/**
 * Authentication Types for GridTokenX Platform
 */

export interface LoginRequest {
  username: string // min: 3, max: 50 chars
  password: string // min: 8, max: 128 chars
}

export interface RegisterRequest {
  username: string // min: 3, max: 50 chars
  email: string // valid email format
  password: string // min: 8, max: 128 chars
  role?: Role // optional, default consumer
  first_name?: string // optional, max: 100 chars
  last_name?: string // optional, max: 100 chars
}

export interface VerifyWalletRequest {
  wallet_address: string
  signature: string
  message: string
  timestamp: number
}

export interface LoginResponse {
  access_token: string
  refresh_token: string // long-lived JWT; presented to /auth/refresh
  expires_in: number // seconds
  token_type: string // always "Bearer"
  user: UserResponse
}

export interface RefreshResponse {
  access_token: string
  expires_in: number // seconds
  token_type: string
}

export interface UserResponse {
  id: string
  username: string
  email: string
  role: string
  first_name: string | null
  last_name: string | null
  wallet_address: string | null
  status: string
}

export interface RegisterResponse {
  id: string
  username: string
  email: string
  status: string // "pending_verification"
  message?: string
}

export interface AuthError {
  message: string
  code: string
  details?: Record<string, any>
}

export interface ApiError {
  status: number
  error: string
  retry_after?: number
}

// Matches backend VerifyEmailResponse (auth.rs:180). `auth` is present only on
// auto-login after verification.
export interface VerifyEmailResponse {
  success: boolean
  message: string
  wallet_address?: string // wallet address generated during verification
  auth?: LoginResponse // optional auto-login after verification
}

export interface ResendVerificationRequest {
  email: string
}

// Matches backend ResendVerificationResult (models.rs:168) — anti-enumeration:
// only { status, message }. Backend's status is always "sent".
export interface ResendVerificationResponse {
  status: string
  message: string
}

export interface UserProfile extends UserResponse {
  status: string
  // Financial fields — backend Decimal serializes as string
  balance?: number | string
  locked_amount?: number | string
  locked_energy?: number | string
}

export interface ProfileUpdateRequest {
  email?: string
  first_name?: string
  last_name?: string
  wallet_address?: string
}

export interface ProfileResponse {
  user: UserProfile
}

/**
 * A wallet's holdings across both legs of a trade.
 *
 * Energy (GRID/GRX) and currency (THBC) are separate SPL mints with different
 * decimal scales — 9 vs 6 — and different owning token programs (Token-2022 vs
 * classic SPL). Each leg therefore carries its own `decimals` and mint; applying
 * one leg's scale to the other is a 1000x error.
 *
 * The currency fields are optional so a response from a trading-service older
 * than the two-leg change still satisfies the type rather than failing at
 * runtime — treat `undefined` as "not reported", not as zero.
 */
export interface TokenBalance {
  wallet_address: string
  /** Energy (GRID/GRX) — 1 token = 1 kWh. */
  token_balance: string
  token_balance_raw: number
  /** Energy mint decimals — 9. */
  decimals: number
  token_mint: string
  token_account: string
  balance_sol: number
  /** Currency (THBC) — the baht this wallet holds. */
  currency_balance?: string
  currency_balance_raw?: number
  /** Currency mint decimals — 6. */
  currency_decimals?: number
  currency_mint?: string
}

/**
 * The user shape the client keeps in the session. Looser than UserProfile
 * because it is rehydrated from web storage before the profile fetch resolves,
 * so optional fields may be absent on the first render after a reload.
 * Previously declared privately inside AuthProvider, which is why the provider
 * had to merge two disagreeing shapes by hand.
 */
export interface AuthUser {
  id: string
  username: string
  email: string
  role: string
  first_name?: string | null
  last_name?: string | null
  wallet_address?: string | null
  status?: string
  balance?: number | string
  locked_amount?: number | string
  locked_energy?: number | string
}
