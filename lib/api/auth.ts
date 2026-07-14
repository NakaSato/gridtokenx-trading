import { apiRequest, ApiResponse } from './core'
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailResponse,
  UserProfile,
  ResendVerificationRequest,
  ResendVerificationResponse,
} from '../../types/auth'

export class AuthApi {
  constructor(private getToken: () => string | undefined) { }

  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { username, password },
    })
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return apiRequest<RegisterResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: userData,
    })
  }

  // IAM has no wallet-signature login endpoint (/api/v1/auth/wallet/verify
  // does not exist server-side). Fail locally with a clear message instead of
  // a confusing gateway 404. Sessions come from email/password login only.
  async verifyWalletSignature(_data: {
    wallet_address: string
    signature: string
    message: string
    timestamp: number
  }): Promise<ApiResponse<LoginResponse>> {
    return {
      error: 'Wallet-signature login is not supported by the IAM service',
      status: 501,
    }
  }

  // IAM issues stateless JWTs and has no /auth/logout endpoint — logout is
  // purely client-side (AuthProvider clears the stored token).
  async logout(): Promise<ApiResponse<Record<string, never>>> {
    return { data: {}, status: 200 }
  }

  // Exchanges the current (still-valid) token for a fresh one. Must be called
  // BEFORE expiry — the backend rejects expired tokens, so this is driven by a
  // proactive timer in AuthProvider, not reactively after a 401.
  // Backend reads the refresh token from the JSON body (RefreshRequest), NOT
  // the Authorization header — an access token in the header is rejected as the
  // wrong token type. Caller passes the long-lived refresh token stored at login.
  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshResponse>> {
    return apiRequest<RefreshResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    })
  }

  async updateWallet(
    walletAddress: string,
    verifyOwnership?: boolean
  ): Promise<ApiResponse<UserProfile>> {
    return apiRequest<UserProfile>('/api/v1/me/wallets', {
      method: 'POST',
      body: {
        wallet_address: walletAddress,
        label: 'Primary',
        is_primary: true
      },
      token: this.getToken(),
    })
  }

  async verifyEmail(token: string): Promise<ApiResponse<VerifyEmailResponse>> {
    return apiRequest<VerifyEmailResponse>(
      `/api/v1/auth/verify?token=${encodeURIComponent(token)}`,
      { method: 'GET' }
    )
  }

  async resendVerification(email: string): Promise<ApiResponse<ResendVerificationResponse>> {
    return apiRequest<ResendVerificationResponse>('/api/v1/auth/resend-verification', {
      method: 'POST',
      body: { email },
    })
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: { token, new_password: newPassword },
    })
  }
}
