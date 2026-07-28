/**
 * Password rules — the single source for both the live strength meter and the
 * submit-time validation in the signup form.
 */
export function getPasswordChecks(password: string) {
  return {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password),
  }
}

export type PasswordChecks = ReturnType<typeof getPasswordChecks>

/** Index by the number of satisfied checks (0–5). */
export const STRENGTH_META = [
  { label: 'Too weak', color: 'bg-red-500', text: 'text-red-500' },
  { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' },
  { label: 'Fair', color: 'bg-yellow-500', text: 'text-yellow-500' },
  { label: 'Good', color: 'bg-yellow-400', text: 'text-yellow-400' },
  { label: 'Strong', color: 'bg-green-500', text: 'text-green-500' },
  { label: 'Very strong', color: 'bg-green-500', text: 'text-green-500' },
] as const

export function passwordScore(checks: PasswordChecks): number {
  return Object.values(checks).filter(Boolean).length
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
