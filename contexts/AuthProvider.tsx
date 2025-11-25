"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useApiClient } from "@/hooks/useApi";
import type {
  LoginResponse,
  RegisterResponse,
  UserProfile,
  ProfileUpdateRequest,
} from "@/types/auth";

interface User {
  username: string;
  email: string;
  role: string;
  blockchain_registered: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
    wallet_address?: string;
  }) => Promise<RegisterResponse>;
  getProfile: () => Promise<UserProfile | null>;
  updateProfile: (profileData: ProfileUpdateRequest) => Promise<UserProfile>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiClient = useApiClient();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      // Try to get token from localStorage first, then sessionStorage
      const storedToken =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      const expiresAt =
        localStorage.getItem("token_expires_at") ||
        sessionStorage.getItem("token_expires_at");

      if (storedToken && storedUser) {
        // Check if token is expired
        if (expiresAt && Date.now() > parseInt(expiresAt)) {
          await logout();
          return;
        }

        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Set token in API client
        apiClient.setToken(storedToken);

        // Validate token with backend
        try {
          const response = await apiClient.getProfile();
          if (response.error || !response.data) {
            await logout();
            return;
          }
        } catch (error) {
          console.error("Token validation failed:", error);
          await logout();
          return;
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const response = await apiClient.login(username, password);

      if (response.error || !response.data) {
        throw new Error(response.error || "Login failed");
      }

      const loginData: LoginResponse = response.data;
      const expirationTime = Date.now() + loginData.expires_in * 1000;

      // Store token and user data
      if (rememberMe) {
        localStorage.setItem("access_token", loginData.access_token);
        localStorage.setItem("token_expires_at", String(expirationTime));
        localStorage.setItem("user", JSON.stringify(loginData.user));
      } else {
        sessionStorage.setItem("access_token", loginData.access_token);
        sessionStorage.setItem("token_expires_at", String(expirationTime));
        sessionStorage.setItem("user", JSON.stringify(loginData.user));
      }

      setToken(loginData.access_token);
      setUser(loginData.user);
      apiClient.setToken(loginData.access_token);

      return loginData;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      if (token) {
        await apiClient.logout();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage regardless of backend response
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_expires_at");
      localStorage.removeItem("user");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("token_expires_at");
      sessionStorage.removeItem("user");

      setToken(null);
      setUser(null);
      apiClient.clearToken();
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
    wallet_address?: string;
  }): Promise<RegisterResponse> => {
    setIsLoading(true);
    try {
      const response = await apiClient.register(userData);

      if (response.error || !response.data) {
        throw new Error(response.error || "Registration failed");
      }

      const registerData: RegisterResponse = response.data;

      // Check if email verification is required
      if ((registerData as any).verification_required) {
        return registerData;
      }

      // Auto-login if verification not required
      const expirationTime = Date.now() + registerData.expires_in * 1000;

      localStorage.setItem("access_token", registerData.access_token);
      localStorage.setItem("token_expires_at", String(expirationTime));
      localStorage.setItem("user", JSON.stringify(registerData.user));

      setToken(registerData.access_token);
      setUser(registerData.user);
      apiClient.setToken(registerData.access_token);

      return registerData;
    } finally {
      setIsLoading(false);
    }
  };

  const getProfile = async (): Promise<UserProfile | null> => {
    try {
      const response = await apiClient.getProfile();
      if (response.error || !response.data) {
        return null;
      }
      return response.data as UserProfile;
    } catch (error) {
      console.error("Get profile failed:", error);
      return null;
    }
  };

  const updateProfile = async (
    profileData: ProfileUpdateRequest
  ): Promise<UserProfile> => {
    try {
      const response = await apiClient.updateProfile(profileData);
      if (response.error || !response.data) {
        throw new Error(response.error || "Profile update failed");
      }
      return response.data as UserProfile;
    } catch (error) {
      console.error("Update profile failed:", error);
      throw error;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      // This would implement token refresh logic
      // For now, we'll just check if current token is still valid
      const response = await apiClient.getProfile();
      return !response.error && !!response.data;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    register,
    getProfile,
    updateProfile,
    checkAuth,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
