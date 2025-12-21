'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { defaultApiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Wallet,
  Copy,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'

type VerificationState = 'loading' | 'success' | 'error' | 'expired' | 'invalid'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // State management
  const [state, setState] = useState<VerificationState>('loading')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [email, setEmail] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [copied, setCopied] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [canResend, setCanResend] = useState(true)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Extract URL parameters
  const token = searchParams.get('token')
  const emailParam = searchParams.get('email')

  // Initialize email from URL parameter
  useEffect(() => {
    if (emailParam) setEmail(decodeURIComponent(emailParam))
  }, [emailParam])

  // Auto-verify on mount
  useEffect(() => {
    // Check if user is already authenticated (already verified)
    const storedToken = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      // User is already authenticated, redirect to home
      toast.success('Already verified! Redirecting to home...')
      window.location.href = '/'
      return
    }

    if (!token) {
      setState('invalid')
      setMessage(
        'No verification token provided. Please check your email link.'
      )
      return
    }
    verifyEmailToken(token)
  }, [token, router])

  // Auto-redirect countdown
  useEffect(() => {
    if (state !== 'success' || countdown === 0) {
      if (state === 'success' && countdown === 0) {
        toast.success('Welcome to GridTokenX! Redirecting to home...')
        window.location.href = '/'
      }
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [state, countdown, router])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown === 0) {
      if (!canResend) setCanResend(true)
      return
    }
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown, canResend])

  // Helper: Extract error message
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'object' && error !== null) {
      return error.message || JSON.stringify(error)
    }
    return String(error)
  }

  // Helper: Handle verification errors
  const handleVerificationError = (response: any) => {
    const errorMsg = getErrorMessage(response.error)

    if (response.status === 400) {
      if (errorMsg.includes('already verified')) {
        setState('success')
        setMessage('Your email is already verified! You can login now.')
      } else if (errorMsg.includes('expired')) {
        setState('expired')
        setMessage(
          'Verification token has expired. Please request a new verification email.'
        )
      } else {
        setState('invalid')
        setMessage('Invalid verification token. Please check your email link.')
      }
    } else if (response.status === 410) {
      setState('expired')
      setMessage(
        'Verification token has expired. Please request a new verification email.'
      )
    } else if (response.status === 404) {
      setState('invalid')
      setMessage('Verification token not found. Please check your email link.')
    } else {
      setState('error')
      setMessage(errorMsg || 'Verification failed. Please try again.')
    }
  }

  // Verify email token
  const verifyEmailToken = async (verificationToken: string) => {
    try {
      setState('loading')
      const response = await defaultApiClient.verifyEmail(verificationToken)

      if (response.error || !response.data) {
        handleVerificationError(response)
        return
      }

      // Success - store data
      setState('success')
      setMessage(
        response.data.message ||
        'Email verified successfully! You can now sign in.'
      )

      if (response.data.wallet_address) {
        setWalletAddress(response.data.wallet_address)
      }

      if (response.data.auth) {
        localStorage.setItem('access_token', response.data.auth.access_token)
        localStorage.setItem(
          'token_expires_at',
          String(Date.now() + response.data.auth.expires_in * 1000)
        )
        localStorage.setItem('user', JSON.stringify(response.data.auth.user))
        toast.success('Automatically signed in!')
      }
    } catch (error: any) {
      console.error('Email verification error:', error)
      setState('error')
      setMessage(`Verification failed: ${getErrorMessage(error)}`)
    }
  }

  // Helper: Handle resend errors
  const handleResendError = (response: any) => {
    if (response.status === 429) {
      const retryAfter = (response as any).retry_after || 30
      toast.error(`Rate limit exceeded. Please wait ${retryAfter} seconds.`)
      setCanResend(false)
      setResendCooldown(retryAfter)
    } else if (response.status === 404) {
      toast.error('Email address not found. Please check and try again.')
    } else {
      toast.error(
        getErrorMessage(response.error) || 'Failed to resend verification email'
      )
    }
  }

  // Resend verification email
  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    if (!email) {
      toast.error('Please enter your email address')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsResending(true)
    try {
      const response = await defaultApiClient.resendVerification(email)

      if (response.error || !response.data) {
        handleResendError(response)
        return
      }

      // Handle success based on status
      const { status, message } = response.data

      if (status === 'already_verified') {
        toast.success('Email is already verified! You can login now.')
      } else if (status === 'expired_resent') {
        toast.success(
          'A new verification email has been sent! Please check your inbox.'
        )
      } else {
        toast.success(
          message || 'Verification email sent! Please check your inbox.'
        )
        setCanResend(false)
        setResendCooldown(30)
      }
    } catch (error: any) {
      console.error('Resend verification error:', error)
      toast.error(`Failed to resend: ${getErrorMessage(error)}`)
    } finally {
      setIsResending(false)
    }
  }

  // Copy wallet address
  const handleCopyWallet = async () => {
    if (!walletAddress) return
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast.success('Wallet address copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy wallet address')
    }
  }

  // Format cooldown timer
  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-accent p-8 shadow-lg">
          {/* Title */}
          <h1 className="mb-4 text-center text-2xl font-semibold text-foreground">
            {state === 'loading' && 'Verifying Email...'}
            {state === 'success' && 'Email Verified!'}
            {state === 'error' && 'Verification Failed'}
            {state === 'expired' && 'Token Expired'}
            {state === 'invalid' && 'Invalid Token'}
          </h1>

          {/* Message */}
          <p className="mb-6 text-center text-muted-foreground">{message}</p>

          {/* Success State */}
          {state === 'success' && (
            <SuccessView
              walletAddress={walletAddress}
              copied={copied}
              countdown={countdown}
              onCopyWallet={handleCopyWallet}
              onGoHome={() => (window.location.href = '/')}
            />
          )}

          {/* Error/Expired/Invalid State */}
          {(state === 'error' ||
            state === 'expired' ||
            state === 'invalid') && (
              <ResendForm
                email={email}
                isResending={isResending}
                canResend={canResend}
                resendCooldown={resendCooldown}
                onEmailChange={setEmail}
                onSubmit={handleResendVerification}
                onGoHome={() => (window.location.href = '/')}
                formatCooldown={formatCooldown}
              />
            )}
        </div>
      </div>
    </div>
  )
}

// Success View Component
function SuccessView({
  walletAddress,
  copied,
  countdown,
  onCopyWallet,
  onGoHome,
}: {
  walletAddress: string
  copied: boolean
  countdown: number
  onCopyWallet: () => void
  onGoHome: () => void
}) {
  return (
    <div className="space-y-6 text-center">
      {/* Wallet Address Section */}
      {walletAddress && (
        <div className="bg-secondary/50 space-y-4 rounded-lg border border-border p-6">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Wallet className="h-6 w-6" />
            <h2 className="text-lg font-semibold">
              Your Solana Wallet is Ready!
            </h2>
          </div>

          <p className="text-sm text-muted-foreground">
            We've automatically created a secure Solana wallet for you
          </p>

          <div className="break-all rounded-md bg-background p-4">
            <code className="font-mono text-sm text-foreground">
              {walletAddress}
            </code>
          </div>

          <Button
            onClick={onCopyWallet}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Wallet Address
              </>
            )}
          </Button>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-secondary/30 rounded-lg border border-border p-4">
        <h3 className="mb-3 font-semibold text-foreground">What's Next?</h3>
        <ul className="space-y-2 text-left text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
            <span>Your email is verified</span>
          </li>
          {walletAddress && (
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <span>Your Solana wallet is created</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
            <span>You can now login to the platform</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">🚀</span>
            <span>Start trading energy tokens!</span>
          </li>
        </ul>
      </div>

      {/* Redirect Notice */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Redirecting to home in {countdown} seconds...
        </p>
        <Button onClick={onGoHome} className="w-full" size="lg">
          Go to Home Now
        </Button>
      </div>
    </div>
  )
}

// Resend Form Component
function ResendForm({
  email,
  isResending,
  canResend,
  resendCooldown,
  onEmailChange,
  onSubmit,
  onGoHome,
  formatCooldown,
}: {
  email: string
  isResending: boolean
  canResend: boolean
  resendCooldown: number
  onEmailChange: (email: string) => void
  onSubmit: (e: React.FormEvent) => void
  onGoHome: () => void
  formatCooldown: (seconds: number) => string
}) {
  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Enter your email"
            className="h-10"
            required
            disabled={isResending || !canResend}
          />
        </div>

        <Button
          type="submit"
          disabled={isResending || !canResend}
          className="w-full"
          size="lg"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : !canResend ? (
            <>Resend in {formatCooldown(resendCooldown)}</>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Verification Email
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-6">
        <Button variant="outline" onClick={onGoHome} className="w-full">
          Back to Home
        </Button>
      </div>
    </>
  )
}

// Default export with Suspense boundary
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-border bg-accent p-8 shadow-lg">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">
                  Loading verification page...
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
