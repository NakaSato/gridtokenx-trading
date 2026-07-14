// Matches IAM contract: POST /api/v1/auth/register accepts only these roles
// (default consumer). Do not add "producer"/"user"/"ami" — the backend rejects them.
export type Role = "prosumer" | "consumer";

/**
 * Authentication Types for GridTokenX Platform
 */

export interface LoginRequest {
  username: string; // min: 3, max: 50 chars
  password: string; // min: 8, max: 128 chars
}

export interface RegisterRequest {
  username: string; // min: 3, max: 50 chars
  email: string; // valid email format
  password: string; // min: 8, max: 128 chars
  role?: Role; // optional, default consumer
  first_name?: string; // optional, max: 100 chars
  last_name?: string; // optional, max: 100 chars
}

export interface VerifyWalletRequest {
  wallet_address: string;
  signature: string;
  message: string;
  timestamp: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string; // long-lived JWT; presented to /auth/refresh
  expires_in: number; // seconds
  token_type: string; // always "Bearer"
  user: UserResponse;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number; // seconds
  token_type: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  wallet_address: string | null;
  status: string;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  status: string; // "pending_verification"
  message?: string;
}

export interface AuthError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

export interface ApiError {
  status: number;
  error: string;
  retry_after?: number;
}

// Matches backend VerifyEmailResponse (auth.rs:180). `auth` is present only on
// auto-login after verification.
export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  wallet_address?: string; // wallet address generated during verification
  auth?: LoginResponse; // optional auto-login after verification
}

export interface ResendVerificationRequest {
  email: string;
}

// Matches backend ResendVerificationResult (models.rs:168) — anti-enumeration:
// only { status, message }. Backend's status is always "sent".
export interface ResendVerificationResponse {
  status: string;
  message: string;
}

export interface UserProfile extends UserResponse {
  status: string;
  // Financial fields — backend Decimal serializes as string
  balance?: number | string;
  locked_amount?: number | string;
  locked_energy?: number | string;
}

export interface ProfileUpdateRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  wallet_address?: string;
}

export interface ProfileResponse {
  user: UserProfile;
}

export interface TokenBalance {
  wallet_address: string;
  token_balance: string;
  token_balance_raw: number;
  balance_sol: number;
  decimals: number;
  token_mint: string;
  token_account: string;
}
