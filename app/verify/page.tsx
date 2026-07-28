'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { defaultApiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle2,
  RefreshCw,
  Wallet,
  Copy,
  Check,
  Mail,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Spinner } from '@/components/ui/spinner'

type VerificationState = 'loading' | 'success' | 'error' | 'expired' | 'invalid'

// Extract a human-readable message from an unknown thrown/returned error.
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return String(error)
}

const formatCooldown = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

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
    if (!token) {
      setState('invalid')
      setMessage(
        'No verification token provided. Please check your email link.'
      )
      return
    }
    verifyEmailToken(token)
  }, [token])

  // Auto-redirect countdown
  useEffect(() => {
    if (state !== 'success' || countdown === 0) {
      if (state === 'success' && countdown === 0) {
        toast.success('Email verified! Redirecting to login...')
        window.location.href = '/login'
      }
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [state, countdown])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown === 0) {
      if (!canResend) setCanResend(true)
      return
    }
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown, canResend])

  // Helper: Handle verification errors
  const handleVerificationError = (response: {
    status?: number
    error?: unknown
    retry_after?: number
  }) => {
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
        localStorage.setItem('refresh_token', response.data.auth.refresh_token)
        localStorage.setItem(
          'token_expires_at',
          String(Date.now() + response.data.auth.expires_in * 1000)
        )
        localStorage.setItem('user', JSON.stringify(response.data.auth.user))
        toast.success('Automatically signed in!')
      }
    } catch (error: unknown) {
      setState('error')
      setMessage(`Verification failed: ${getErrorMessage(error)}`)
    }
  }

  // Helper: Handle resend errors
  const handleResendError = (response: {
    status?: number
    error?: unknown
    retry_after?: number
  }) => {
    if (response.status === 429) {
      const retryAfter = response.retry_after || 30
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
        setResendCooldown(60)
      }
    } catch (error: unknown) {
      toast.error(`Failed to resend: ${getErrorMessage(error)}`)
    } finally {
      setIsResending(false)
    }
  }

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header — mirrors the login page */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">GridTokenX</h1>
          <p className="text-sm text-muted-foreground">
            P2P energy trading platform
          </p>
        </div>

        {/* Onboarding progress: account → verify → trade */}
        <OnboardingStepper state={state} />

        {/* Status card */}
        <div
          className="rounded-xl border border-border bg-card p-8 shadow-lg"
          aria-live="polite"
        >
          <StateHero state={state} message={message} />

          <div className="mt-6">
            {state === 'loading' && <LoadingView />}

            {state === 'success' && (
              <SuccessView
                walletAddress={walletAddress}
                copied={copied}
                countdown={countdown}
                onCopyWallet={handleCopyWallet}
                onContinue={() => router.push('/login')}
              />
            )}

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
              />
            )}
          </div>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Back to marketplace
          </Link>
          <span aria-hidden="true" className="h-3 w-px bg-border" />
          <Link
            href="/contact"
            className="transition-colors hover:text-foreground"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Onboarding stepper                                                  */
/* ------------------------------------------------------------------ */

function OnboardingStepper({ state }: { state: VerificationState }) {
  const verified = state === 'success'
  const steps = [
    { label: 'Create account', done: true, active: false },
    { label: 'Verify email', done: verified, active: !verified },
    { label: 'Start trading', done: false, active: verified },
  ]

  return (
    <ol
      className="flex items-center justify-center gap-0"
      aria-label="Onboarding progress"
    >
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center">
          {i > 0 && (
            <span
              aria-hidden="true"
              className={`mx-2 h-px w-8 sm:w-12 ${
                step.done || step.active ? 'bg-primary/60' : 'bg-border'
              }`}
            />
          )}
          <span className="flex items-center gap-1.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                step.done
                  ? 'bg-primary text-primary-foreground'
                  : step.active
                    ? 'border border-primary text-primary'
                    : 'border border-border text-muted-foreground'
              }`}
            >
              {step.done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span
              className={`hidden text-xs sm:inline ${
                step.active
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------------ */
/* State hero (icon + title + description)                             */
/* ------------------------------------------------------------------ */

const HERO: Record<
  VerificationState,
  { title: string; fallback: string; tone: string; ring: string }
> = {
  loading: {
    title: 'Verifying your email',
    fallback: 'Securing your connection to the energy grid…',
    tone: 'bg-primary/10 text-primary',
    ring: '',
  },
  success: {
    title: 'Email verified',
    fallback: 'Your account is now fully activated and ready for trading.',
    tone: 'bg-green-500/10 text-green-500',
    ring: 'ring-8 ring-green-500/5',
  },
  expired: {
    title: 'Link expired',
    fallback: 'This secure link is no longer valid. Request a new one below.',
    tone: 'bg-amber-500/10 text-amber-500',
    ring: 'ring-8 ring-amber-500/5',
  },
  invalid: {
    title: 'Invalid link',
    fallback: 'This link doesn’t match our records. Request a new one below.',
    tone: 'bg-red-500/10 text-red-500',
    ring: 'ring-8 ring-red-500/5',
  },
  error: {
    title: 'Verification failed',
    fallback: 'An unexpected error occurred. Please try again.',
    tone: 'bg-red-500/10 text-red-500',
    ring: 'ring-8 ring-red-500/5',
  },
}

function StateHero({
  state,
  message,
}: {
  state: VerificationState
  message: string
}) {
  const { title, fallback, tone, ring } = HERO[state]
  return (
    <div className="space-y-3 text-center">
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${tone} ${ring} animate-in fade-in zoom-in-75`}
        key={state} // re-trigger entrance animation on state change
      >
        {state === 'loading' && <Mail className="h-7 w-7" />}
        {state === 'success' && <CheckCircle2 className="h-7 w-7" />}
        {state === 'expired' && <Clock className="h-7 w-7" />}
        {(state === 'invalid' || state === 'error') && (
          <AlertCircle className="h-7 w-7" />
        )}
      </div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto max-w-xs text-sm text-muted-foreground">
        {message || fallback}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Per-state content                                                   */
/* ------------------------------------------------------------------ */

function LoadingView() {
  return (
    <div className="space-y-4" role="status" aria-label="Verifying email">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Spinner className="h-3.5 w-3.5" />
        This usually takes a few seconds
      </div>
    </div>
  )
}

// Middle-ellipsize a Solana address for compact display.
const shortenAddress = (addr: string) =>
  addr.length > 16 ? `${addr.slice(0, 8)}…${addr.slice(-8)}` : addr

function SuccessView({
  walletAddress,
  copied,
  countdown,
  onCopyWallet,
  onContinue,
}: {
  walletAddress: string
  copied: boolean
  countdown: number
  onCopyWallet: () => void
  onContinue: () => void
}) {
  return (
    <div className="space-y-5">
      {walletAddress && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wallet className="h-4 w-4 text-primary" />
            Your Solana wallet is ready
          </div>
          <div className="flex items-center gap-2">
            <code
              title={walletAddress}
              className="flex-1 truncate rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground"
            >
              {shortenAddress(walletAddress)}
            </code>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 shrink-0 px-3"
              onClick={onCopyWallet}
              aria-label={copied ? 'Address copied' : 'Copy wallet address'}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">
            This address receives your energy-trading settlements. You can view
            it anytime from your wallet page.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Button onClick={onContinue} className="h-11 w-full">
          Continue to sign in
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p
          className="text-center text-xs text-muted-foreground"
          aria-live="off"
        >
          Redirecting automatically in {countdown}s
        </p>
      </div>
    </div>
  )
}

function ResendForm({
  email,
  isResending,
  canResend,
  resendCooldown,
  onEmailChange,
  onSubmit,
}: {
  email: string
  isResending: boolean
  canResend: boolean
  resendCooldown: number
  onEmailChange: (email: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="name@example.com"
            className="pl-9"
            autoComplete="email"
            required
            disabled={isResending || !canResend}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          We’ll send a fresh verification link to this address.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isResending || !canResend}
        className="h-11 w-full"
      >
        {isResending ? (
          <Spinner className="mr-2 h-4 w-4" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {isResending
          ? 'Sending…'
          : canResend
            ? 'Send new verification link'
            : `Try again in ${formatCooldown(resendCooldown)}`}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Already verified?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}

export default function VerifyEmailPage() {
  return (
    <ErrorBoundary name="Email Verification">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </ErrorBoundary>
  )
}
