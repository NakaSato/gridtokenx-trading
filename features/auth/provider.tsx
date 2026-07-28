'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useApiClient } from '@/lib/api/useApiClient'
import { ApiClientError } from '@/lib/api/core'
import {
  clearSession,
  parseStoredUser,
  persistRefreshedToken,
  persistSession,
  readRefreshToken,
  readSession,
  updateStoredUser,
} from '@/features/auth/lib/session-storage'
import { createRefreshScheduler } from '@/features/auth/lib/token-refresh'
import type {
  AuthUser,
  LoginResponse,
  ProfileUpdateRequest,
  RegisterResponse,
  Role,
  UserProfile,
} from '@/types/auth'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (
    username: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<LoginResponse>
  logout: () => Promise<void>
  register: (userData: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
    role?: Role
    wallet_address?: string
  }) => Promise<RegisterResponse>
  loginWithWallet: (data: {
    wallet_address: string
    signature: string
    message: string
    timestamp: number
  }) => Promise<LoginResponse>
  getProfile: () => Promise<UserProfile | null>
  updateProfile: (profileData: ProfileUpdateRequest) => Promise<UserProfile>
  updateWallet: (walletAddress: string) => Promise<UserProfile | null>
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const apiClient = useApiClient()

  // The scheduler reads the refresh closure through a ref so the pending timer
  // always calls the current one (with up-to-date apiClient/state).
  const refreshTokenRef = useRef<() => Promise<boolean>>(async () => false)
  const schedulerRef = useRef(
    createRefreshScheduler(() => refreshTokenRef.current)
  )
  const scheduler = schedulerRef.current

  useEffect(() => {
    checkAuth()
    return () => scheduler.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    setIsLoading(true)
    try {
      const { token: storedToken, rawUser, expiresAt } = readSession()

      if (storedToken && rawUser) {
        if (expiresAt && Date.now() > expiresAt) {
          await logout()
          return
        }

        const storedUser = parseStoredUser(rawUser)
        if (!storedUser) {
          await logout()
          return
        }

        setToken(storedToken)
        setUser(storedUser)
        apiClient.setToken(storedToken)

        // Arm proactive refresh against the restored token's expiry.
        if (expiresAt) scheduler.schedule(expiresAt)

        // Validate with the backend and fold in the latest profile.
        try {
          const response = await apiClient.getProfile()
          if (response.error || !response.data) {
            await logout()
            return
          }
          const updatedUser = {
            ...storedUser,
            ...(response.data as AuthUser),
          }
          setUser(updatedUser)
          updateStoredUser(updatedUser)
        } catch (error) {
          console.error('Token validation failed:', error)
          await logout()
          return
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      await logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (
    username: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<LoginResponse> => {
    // Deliberately does NOT toggle the global isLoading: that flag means
    // "initial auth check in progress" and gates skeletons/unmounts (e.g.
    // AuthButton). Flipping it here unmounted the WalletModal mid-login, so a
    // failed sign-in silently closed the modal. Callers show their own
    // per-form loading state.
    const response = await apiClient.login(username, password)

    if (response.error || !response.data) {
      throw new ApiClientError(
        response.error || 'Login failed',
        response.code,
        response.status
      )
    }

    const loginData: LoginResponse = response.data
    const expirationTime = Date.now() + loginData.expires_in * 1000

    persistSession(
      {
        accessToken: loginData.access_token,
        refreshToken: loginData.refresh_token,
        expiresAt: expirationTime,
        user: loginData.user,
      },
      rememberMe
    )

    setToken(loginData.access_token)
    setUser(loginData.user)
    apiClient.setToken(loginData.access_token)
    scheduler.schedule(expirationTime)

    return loginData
  }

  const logout = async () => {
    try {
      if (token) {
        await apiClient.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      scheduler.cancel()
      clearSession()
      setToken(null)
      setUser(null)
      apiClient.clearToken()
    }
  }

  const register = async (userData: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
    role?: Role
    wallet_address?: string
  }): Promise<RegisterResponse> => {
    // Same as login: never toggle the global isLoading here (see comment there).
    const response = await apiClient.register(userData)

    if (response.error || !response.data) {
      throw new Error(response.error || 'Registration failed')
    }

    return response.data
  }

  const loginWithWallet = async (data: {
    wallet_address: string
    signature: string
    message: string
    timestamp: number
  }): Promise<LoginResponse> => {
    // Same as login: never toggle the global isLoading here (see comment there).
    const response = await apiClient.verifyWalletSignature(data)

    if (response.error || !response.data) {
      throw new Error(response.error || 'Wallet login failed')
    }

    const loginData: LoginResponse = response.data
    const expirationTime = Date.now() + loginData.expires_in * 1000

    // Wallet sessions default to localStorage for convenience, like standard
    // dApps. Note the wallet endpoint returns no refresh_token.
    persistSession(
      {
        accessToken: loginData.access_token,
        expiresAt: expirationTime,
        user: loginData.user,
      },
      true
    )

    setToken(loginData.access_token)
    setUser(loginData.user)
    apiClient.setToken(loginData.access_token)
    scheduler.schedule(expirationTime)

    return loginData
  }

  const getProfile = async (): Promise<UserProfile | null> => {
    try {
      const response = await apiClient.getProfile()
      if (response.error || !response.data) {
        return null
      }
      return response.data as UserProfile
    } catch (error) {
      console.error('Get profile failed:', error)
      return null
    }
  }

  const updateProfile = async (
    profileData: ProfileUpdateRequest
  ): Promise<UserProfile> => {
    try {
      const response = await apiClient.updateProfile(profileData)
      if (response.error || !response.data) {
        throw new Error(response.error || 'Profile update failed')
      }
      return response.data as UserProfile
    } catch (error) {
      console.error('Update profile failed:', error)
      throw error
    }
  }

  const updateWallet = async (
    walletAddress: string
  ): Promise<UserProfile | null> => {
    try {
      if (!token) {
        throw new Error('Not authenticated. Please sign in first.')
      }

      if (!walletAddress || walletAddress.length < 32) {
        throw new Error('Invalid wallet address format')
      }

      const response = await apiClient.updateWallet(walletAddress)

      if (response.error || !response.data) {
        let errorMessage = 'Wallet update failed'

        if (response.status === 401) {
          errorMessage = 'Authentication expired. Please sign in again.'
          await logout()
        } else if (response.status === 400) {
          errorMessage = response.error || 'Invalid wallet address'
        } else if (response.status === 409) {
          errorMessage = 'This wallet is already linked to another account'
        } else if (response.error) {
          errorMessage = response.error
        }

        throw new Error(errorMessage)
      }

      if (user) {
        const updatedUser = { ...user, wallet_address: walletAddress }
        setUser(updatedUser)
        updateStoredUser(updatedUser)
      }

      return response.data
    } catch (error) {
      console.error('Update wallet failed:', error)
      throw error
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const storedRefresh = readRefreshToken()
      if (!storedRefresh) {
        // No refresh token on hand — session can't be renewed, force re-login.
        await logout()
        return false
      }
      const response = await apiClient.refreshToken(storedRefresh)
      if (response.error || !response.data) {
        console.warn('Token refresh failed:', response.error)
        // 401 means the token already expired — nothing to refresh.
        if (response.status === 401) {
          await logout()
        }
        return false
      }

      const { access_token, expires_in } = response.data
      const expirationTime = Date.now() + expires_in * 1000

      persistRefreshedToken(access_token, expirationTime)
      setToken(access_token)
      apiClient.setToken(access_token)
      scheduler.schedule(expirationTime)
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  // Keep the ref pointing at the latest closure so the scheduled timer always
  // calls the current refreshToken.
  refreshTokenRef.current = refreshToken

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    register,
    loginWithWallet,
    getProfile,
    updateProfile,
    updateWallet,
    checkAuth,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
