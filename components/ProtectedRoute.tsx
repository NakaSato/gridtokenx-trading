'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/contexts/AuthProvider'
import React from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireWallet?: boolean
  requireAuth?: boolean
}

export default function ProtectedRoute({
  children,
  fallback,
  requireWallet = true,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { connected } = useWallet()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check authentication requirements
  // Prioritize authentication session over wallet connection
  const needsAuth = requireAuth && !isAuthenticated
  const needsWallet = requireWallet && !connected && !isAuthenticated

  // If authentication is required but user is not authenticated, show fallback
  if (needsAuth || needsWallet) {
    if (fallback) {
      return <>{fallback}</>
    }

    // Determine what actions are needed
    const showWalletButton = needsWallet || (!connected && !isAuthenticated)
    const showAuthButton = connected && !isAuthenticated

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 animate-pulse">
          <div className="h-8 w-32 rounded bg-muted"></div>
        </div>

        <p className="mb-4 text-muted-foreground">
          {authLoading
            ? 'Checking authentication...'
            : connected && !isAuthenticated
              ? 'Please sign in to continue'
              : 'Connect your wallet to continue'}
        </p>

        <div className="flex gap-2">
          {showWalletButton && (
            <button
              onClick={() => {
                const event = new CustomEvent('openWalletModal')
                window.dispatchEvent(event)
              }}
              className="rounded-sm bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Connect Wallet
            </button>
          )}
          {showAuthButton && (
            <button
              onClick={() => {
                const event = new CustomEvent('openAuthModal')
                window.dispatchEvent(event)
              }}
              className="hover:bg-secondary/90 rounded-sm bg-secondary px-4 py-2 text-secondary-foreground transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
