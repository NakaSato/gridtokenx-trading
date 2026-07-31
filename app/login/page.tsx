'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/features/auth/provider'
import { useWalletAuth } from '@/features/auth/lib/useWalletAuth'
import WalletList from '@/features/auth/components/WalletList'
import { allWallets } from '@/features/auth/components/WalletModal'
import { ApiClientError } from '@/lib/api/core'
import {
  loginErrorMessage,
  isExpectedLoginError,
} from '@/features/auth/lib/login-error'
import { useResendVerification } from '@/features/auth/lib/useResendVerification'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const { connectAndLogin, isConnecting, walletLoginSupported } =
    useWalletAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  // Login rejected with AUTH_1005 (correct password, email unverified).
  const [showUnverifiedAlert, setShowUnverifiedAlert] = useState(false)
  // Login failed (wrong credentials, server error, …) — shown inline so the
  // error persists on the form instead of only flashing a toast.
  const [signInError, setSignInError] = useState<string | null>(null)
  const { canResend, isResending, resendVerification: handleResendVerification } =
    useResendVerification(username)

  // Once authenticated (via password or wallet), leave the login page.
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Please enter your username and password')
      return
    }

    setLoading(true)
    try {
      setShowUnverifiedAlert(false)
      setSignInError(null)
      const loginData = await login(username, password, rememberMe)
      toast.success(`Welcome back, ${loginData.user.username}!`)
      router.push('/')
    } catch (error: unknown) {
      if (error instanceof ApiClientError && error.code === 'AUTH_1005') {
        // Credentials are right but the email is unverified — show the
        // actionable inline alert instead of the generic failure message.
        setShowUnverifiedAlert(true)
        return
      }
      // Expected rejections are already spelled out inline; only log what the
      // UI can't explain, so a real defect isn't buried under failed logins.
      if (!isExpectedLoginError(error)) {
        console.error('Unexpected sign-in failure:', error)
      }
      setSignInError(loginErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">GridTokenX</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        {/* A wallet can't open a session yet — offering the grid here just
            leads to a signature prompt that ends in a 501. Say what the wallet
            is actually for instead. */}
        {walletLoginSupported ? (
          <>
            <div className="space-y-3">
              <p className="text-center text-sm font-medium">
                Connect your wallet
              </p>
              <WalletList
                wallets={allWallets}
                onWalletConnect={connectAndLogin}
                className="grid grid-cols-2 gap-3"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  Or sign in with email
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-md border border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
            Accounts are email and password. Your Solana wallet connects after
            sign-in, for signing transactions.
          </p>
        )}

        {showUnverifiedAlert && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <p className="text-amber-700 dark:text-amber-300">
              <span className="font-medium">
                Your email isn&apos;t verified yet.
              </span>{' '}
              Check your inbox for the verification link before signing in.
            </p>
            {canResend && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="mt-2 font-medium text-primary hover:underline disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        )}

        {signInError && (
          <div
            role="alert"
            className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm"
          >
            <p className="text-red-700 dark:text-red-300">
              <span className="font-medium">Sign in failed.</span>{' '}
              {signInError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username or Email
            </label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="font-medium text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || authLoading || isConnecting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
