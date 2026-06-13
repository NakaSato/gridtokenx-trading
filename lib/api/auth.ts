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

  async verifyWalletSignature(data: {
    wallet_address: string
    signature: string
    message: string
    timestamp: number
  }): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>('/api/v1/auth/wallet/verify', {
      method: 'POST',
      body: data,
    })
  }

  async logout() {
    return apiRequest('/api/v1/auth/logout', {
      method: 'POST',
      token: this.getToken(),
    })
  }

  // Exchanges the current (still-valid) token for a fresh one. Must be called
  // BEFORE expiry — the backend rejects expired tokens, so this is driven by a
  // proactive timer in AuthProvider, not reactively after a 401.
  async refreshToken(): Promise<ApiResponse<RefreshResponse>> {
    return apiRequest<RefreshResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      token: this.getToken(),
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

  async forgotPassword(email: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest<{ success: boolean; message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest<{ success: boolean; message: string }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: { token, new_password: newPassword },
    })
  }
}
