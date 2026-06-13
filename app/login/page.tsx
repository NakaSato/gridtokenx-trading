'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthProvider'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import WalletList from '@/components/WalletList'
import { allWallets } from '@/components/WalletModal'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const { connectAndLogin, isConnecting } = useWalletAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

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
      const loginData = await login(username, password, rememberMe)
      toast.success(`Welcome back, ${loginData.user.username}!`)
      router.push('/')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      toast.error(message)
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

        {/* Connect a Solana wallet — Phantom / Solflare / Trust / SafePal */}
        <div className="space-y-3">
          <p className="text-center text-sm font-medium">Connect your wallet</p>
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
