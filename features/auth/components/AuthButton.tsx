'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/features/auth/provider'
import SignIn from '@/features/auth/components/SignIn'
import SignOut from '@/features/auth/components/SignOut'
import AuthModalManager from '@/features/auth/components/AuthModalManager'
import { Skeleton } from '@/components/ui/skeleton'

interface AuthButtonProps {
  signInVariant?: 'default' | 'outline' | 'ghost'
  signOutVariant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  signInText?: string
  signOutText?: string
  onSignOut?: () => void
}

export default function AuthButton({
  signInVariant = 'default',
  signOutVariant = 'outline',
  size = 'default',
  className = '',
  showIcon = true,
  signInText = 'Connect Wallet',
  signOutText = 'Disconnect',
  onSignOut,
}: AuthButtonProps) {
  const { connected } = useWallet()
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      // className is the caller's button sizing, so it stays on the wrapper —
      // the skeleton keeps the button's own footprint.
      <div className={className}>
        <Skeleton className="h-9 w-24 rounded bg-muted" />
      </div>
    )
  }

  // If both wallet is connected AND user is authenticated, show sign out
  if (connected && isAuthenticated) {
    return (
      <SignOut
        variant={signOutVariant}
        size={size}
        className={className}
        showIcon={showIcon}
        text={signOutText}
        onSignOut={onSignOut}
      />
    )
  }

  // If wallet is connected but not authenticated, show sign in prompt
  if (connected && !isAuthenticated) {
    return (
      <SignIn
        variant={signInVariant}
        size={size}
        className={className}
        showIcon={showIcon}
        text="Sign In"
      />
    )
  }

  // If wallet is not connected, show connect wallet
  return (
    <SignIn
      variant={signInVariant}
      size={size}
      className={className}
      showIcon={showIcon}
      text={signInText}
    />
  )
}
