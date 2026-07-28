'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  XIcon,
  Eye,
  EyeOff,
  Check,
  X as XMark,
  AlertTriangle,
  Mail,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import WalletList from '@/features/auth/components/WalletList'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Wallet } from '@/types/wallet'
import { defaultApiClient } from '@/lib/api-client'
import { ApiClientError } from '@/lib/api/core'
import type { RegisterResponse, Role } from '@/types/auth'
import { allWallets } from '@/features/wallet/lib/wallets'
import { ROLE_OPTIONS } from '@/features/auth/lib/roles'
import {
  getPasswordChecks,
  passwordScore,
  EMAIL_PATTERN,
} from '@/features/auth/lib/password'
import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter'
import { useAuth } from '@/contexts/AuthProvider'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { useResendVerification } from '@/hooks/useResendVerification'

export { allWallets }

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}





export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const router = useRouter()
  const { login, isLoading: authLoading, isAuthenticated } = useAuth()
  const { connectAndLogin } = useWalletAuth()
  // Default to email sign-in: IAM has no wallet-signature login endpoint
  // (verifyWalletSignature 501s locally), so the wallet tab can only link a
  // wallet to an already-authenticated session.
  const [authMode, setAuthMode] = useState<'wallet' | 'signin' | 'signup'>(
    'signin'
  )

  // Email/Password form states
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('prosumer')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  // Login rejected with AUTH_1005 (correct password, email unverified).
  const [showUnverifiedAlert, setShowUnverifiedAlert] = useState(false)
  // Login failed (wrong credentials, server error, …) — shown inline so the
  // error survives inside the still-open modal instead of only flashing a toast.
  const [signInError, setSignInError] = useState<string | null>(null)
  const {
    canResend: canResendVerification,
    isResending: isResendingVerification,
    resendVerification: handleResendVerification,
  } = useResendVerification(username)

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose()
    }
  }, [isAuthenticated, isOpen, onClose])


  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!username || !password) {
      toast.error('Please fill in all fields')
      return
    }

    if (username.length < 3 || username.length > 50) {
      toast.error('Username must be between 3 and 50 characters')
      return
    }

    if (password.length < 8 || password.length > 128) {
      toast.error('Password must be between 8 and 128 characters')
      return
    }

    setIsLoading(true)
    try {
      setShowUnverifiedAlert(false)
      setSignInError(null)
      const loginData = await login(username, password, rememberMe)
      toast.success(`Welcome back, ${loginData.user.username}!`)

      // Small delay to ensure auth state is updated before closing and redirecting
      setTimeout(() => {
        onClose()
        // Redirect to home page after successful login
        router.push('/')
      }, 100)
    } catch (error: unknown) {
      console.error('Sign in error:', error)
      if (error instanceof ApiClientError && error.code === 'AUTH_1005') {
        // Credentials are right but the email is unverified — show the
        // actionable inline alert instead of the generic failure message.
        setShowUnverifiedAlert(true)
        return
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      setSignInError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !firstName ||
      !lastName
    ) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!agreeToTerms) {
      toast.error('Please agree to the terms and conditions')
      return
    }

    // Username validation
    if (username.length < 3 || username.length > 50) {
      toast.error('Username must be between 3 and 50 characters')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Password validation
    if (password.length < 8 || password.length > 128) {
      toast.error('Password must be between 8 and 128 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Password strength validation — same rules as the live meter, one source.
    const checks = getPasswordChecks(password)
    if (!checks.lower || !checks.upper || !checks.digit || !checks.special) {
      toast.error(
        'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'
      )
      return
    }

    const weakPatterns = [
      'password',
      '123456',
      'qwerty',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
    ]
    const passwordLower = password.toLowerCase()
    if (weakPatterns.some((pattern) => passwordLower.includes(pattern))) {
      toast.error(
        "Password contains common weak patterns (e.g. 'password', 'admin', '123456')"
      )
      return
    }

    // Name validation
    if (
      firstName.length < 1 ||
      firstName.length > 100 ||
      lastName.length < 1 ||
      lastName.length > 100
    ) {
      toast.error('Names must be between 1 and 100 characters')
      return
    }

    setIsLoading(true)
    try {
      const response = await defaultApiClient.register({
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: (role as Role) || 'prosumer',
      })

      if (response.error || !response.data) {
        // Handle specific error codes
        let errorMessage = 'Registration failed'

        if (response.status === 400) {
          if (response.error) {
            // Handle error object or string
            if (typeof response.error === 'object' && response.error !== null) {
              errorMessage =
                (response.error as { message?: string }).message ||
                'Validation error or user already exists'
            } else {
              errorMessage = String(response.error)
            }
          } else {
            errorMessage = 'Validation error or user already exists'
          }
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        } else if (response.error) {
          // Handle error object or string
          if (typeof response.error === 'object' && response.error !== null) {
            errorMessage =
              (response.error as { message?: string }).message ||
              JSON.stringify(response.error)
          } else {
            errorMessage = String(response.error)
          }
        }

        toast.error(errorMessage)
        return
      }

      const registerData: RegisterResponse = response.data

      toast.success(
        registerData.message ||
          'Registration successful! Please check your email to verify your account.'
      )
      onClose()
      // Redirect to home page after successful registration
      setTimeout(() => {
        router.push('/')
      }, 100)
    } catch (error: unknown) {
      console.error('Sign up error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Sign up failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Derived signup validation — computed each render, cheap, keeps the meter
  // and inline hints in sync with the live field values.
  const pwChecks = getPasswordChecks(password)
  const pwScore = passwordScore(pwChecks)
  const emailValid = EMAIL_PATTERN.test(email)
  const confirmMatches =
    confirmPassword.length > 0 && password === confirmPassword

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-auto max-h-[95vh] w-[95vw] max-w-full flex-col overflow-y-auto bg-accent p-4 sm:w-[90vw] sm:max-w-lg md:max-w-2xl md:p-10">
        <DialogHeader className="flex h-fit flex-row items-start justify-between space-y-0 pb-4 md:h-auto md:pb-2">
          <div className="space-y-2 pr-2">
            <DialogTitle className="text-xl font-medium text-foreground sm:text-2xl">
              {authMode === 'wallet'
                ? 'Connect Wallet'
                : authMode === 'signin'
                  ? 'Sign In'
                  : 'Sign Up'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {authMode === 'wallet'
                ? 'Connect your Solana wallet to start trading'
                : authMode === 'signin'
                  ? 'Sign in to your account with email and password'
                  : 'Create a new account to get started'}
            </DialogDescription>
          </div>
          <Button
            className="shrink-0 rounded-[12px] border-border bg-secondary p-[9px] shadow-none [&_svg]:size-[18px]"
            onClick={() => onClose()}
          >
            <XIcon size={18} className="text-secondary-foreground" />
          </Button>
        </DialogHeader>

        {authMode === 'wallet' ? (
          <div className="flex w-full flex-col justify-between space-y-5">
            <WalletList
              wallets={allWallets}
              onWalletConnect={connectAndLogin}
            />
            <div className="text-center">
              <button
                onClick={() => setAuthMode('signin')}
                className="text-sm font-medium text-secondary-foreground transition-colors hover:text-primary"
              >
                Or sign in with email →
              </button>
            </div>
          </div>
        ) : authMode === 'signin' ? (
          <div className="w-full">
            <>
              {showUnverifiedAlert && (
                <div className="mb-4 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="space-y-2 text-sm">
                      <p className="text-amber-700 dark:text-amber-300">
                        <span className="font-medium">
                          Your email isn&apos;t verified yet.
                        </span>{' '}
                        Check your inbox for the verification link before
                        signing in.
                      </p>
                      {canResendVerification && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleResendVerification}
                          disabled={isResendingVerification}
                          className="border-amber-500/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
                        >
                          {isResendingVerification ? (
                            <>
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="mr-1 h-4 w-4" />
                              Resend verification email
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {signInError && (
                <div
                  role="alert"
                  className="mb-4 rounded-sm border border-red-500/30 bg-red-500/10 p-3"
                >
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-red-700 dark:text-red-300">
                      <span className="font-medium">Sign in failed.</span>{' '}
                      {signInError}
                    </p>
                  </div>
                </div>
              )}
              <form
                onSubmit={handleEmailSignIn}
                noValidate
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="username">Username or Email</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username or email"
                    className="h-9 rounded-sm border border-border px-3 py-2"
                    minLength={3}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-9 rounded-sm border border-border px-3 py-2 pr-10"
                      minLength={8}
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked === true)
                      }
                    />
                    <Label
                      htmlFor="remember-me"
                      className="cursor-pointer text-sm text-secondary-foreground"
                    >
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      router.push('/forgot-password')
                    }}
                    className="text-sm text-primary transition-colors hover:text-primary/80"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || authLoading}
                  className="w-full rounded-sm"
                >
                  {isLoading || authLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-accent px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <WalletList
                  wallets={allWallets}
                  onWalletConnect={connectAndLogin}
                  className="grid grid-cols-3 gap-3"
                />
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <p className="text-center text-sm text-secondary-foreground">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </>
          </div>
        ) : (
          <div className="w-full">
            <form onSubmit={handleEmailSignUp} noValidate className="space-y-4">
              {/* Account ----------------------------------------------------- */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Account
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-username">Username</Label>
                  <div className="relative">
                    <Input
                      id="signup-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      className="h-10 rounded-md border border-border px-3 py-2 pr-9"
                      minLength={3}
                      maxLength={50}
                      required
                    />
                    {username.length >= 3 && (
                      <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-10 rounded-md border border-border px-3 py-2 pr-9"
                      required
                    />
                    {email.length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailValid ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <XMark className="h-4 w-4 text-red-500" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile ----------------------------------------------------- */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Profile
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-first-name">First Name</Label>
                    <Input
                      id="signup-first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="h-10 rounded-md border border-border px-3 py-2"
                      minLength={1}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-last-name">Last Name</Label>
                    <Input
                      id="signup-last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="h-10 rounded-md border border-border px-3 py-2"
                      minLength={1}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-role">Account Type</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger
                      id="signup-role"
                      className="h-10 border border-border bg-background"
                    >
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="font-medium">{opt.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {opt.hint}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Security ---------------------------------------------------- */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Security
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="h-10 rounded-md border border-border px-3 py-2 pr-10"
                      required
                      minLength={8}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <PasswordStrengthMeter password={password} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-confirm-password">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className={cn(
                        'h-10 rounded-md border border-border px-3 py-2 pr-16',
                        confirmPassword.length > 0 &&
                          !confirmMatches &&
                          'border-red-500 focus-visible:ring-red-500'
                      )}
                      required
                      minLength={8}
                      maxLength={128}
                    />
                    {confirmPassword.length > 0 && (
                      <span className="absolute right-10 top-1/2 -translate-y-1/2">
                        {confirmMatches ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <XMark className="h-4 w-4 text-red-500" />
                        )}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !confirmMatches && (
                    <p className="text-xs text-red-500">
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-1">
                <Checkbox
                  id="agree-terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) =>
                    setAgreeToTerms(checked === true)
                  }
                  className="mt-0.5"
                />
                <Label
                  htmlFor="agree-terms"
                  className="cursor-pointer text-xs leading-4 text-muted-foreground"
                >
                  I agree to the{' '}
                  <a href="#" className="text-primary hover:text-primary/80">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary hover:text-primary/80">
                    Privacy Policy
                  </a>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading || authLoading}
                className="h-10 w-full rounded-md"
              >
                {isLoading || authLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-center text-sm text-secondary-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => setAuthMode('signin')}
                  className="font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
