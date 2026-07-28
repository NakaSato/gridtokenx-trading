'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { defaultApiClient } from '@/lib/api-client'

/**
 * Shared resend-verification-email action for the AUTH_1005 unverified-email
 * alert (login page + WalletModal sign-in tab).
 *
 * IAM's resend endpoint takes an email; `canResend` is only true when the
 * identifier field holds one (users can also sign in by username).
 */
export function useResendVerification(identifier: string) {
  const [isResending, setIsResending] = useState(false)
  const canResend = identifier.includes('@')

  const resendVerification = async () => {
    if (isResending || !canResend) return

    setIsResending(true)
    try {
      const response = await defaultApiClient.resendVerification(identifier)
      // Success = HTTP 2xx (response.data present). Backend returns a generic
      // { status:"sent", message } acknowledgement — no `success` flag.
      if (response.data && !response.error) {
        toast.success('Verification email sent! Check your inbox.')
      } else {
        toast.error(
          response.data?.message || 'Failed to send verification email'
        )
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      toast.error('Failed to send verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return { canResend, isResending, resendVerification }
}
