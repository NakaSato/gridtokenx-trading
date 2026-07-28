'use client'

import { Check, X as XMark } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getPasswordChecks,
  passwordScore,
  STRENGTH_META,
} from '@/features/auth/lib/password'

const REQUIREMENTS = [
  { key: 'length', label: '8+ characters' },
  { key: 'lower', label: 'Lowercase' },
  { key: 'upper', label: 'Uppercase' },
  { key: 'digit', label: 'Number' },
  { key: 'special', label: 'Symbol' },
] as const

/** Live strength bar + requirement checklist. Renders nothing until typed in. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  if (password.length === 0) return null

  const checks = getPasswordChecks(password)
  const score = passwordScore(checks)
  const strength = STRENGTH_META[score]

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-full transition-colors',
                i < score ? strength.color : 'bg-border'
              )}
            />
          ))}
        </div>
        <span
          className={cn('w-20 text-right text-xs font-medium', strength.text)}
        >
          {strength.label}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {REQUIREMENTS.map((r) => {
          const ok = checks[r.key]
          return (
            <li
              key={r.label}
              className={cn(
                'flex items-center gap-1.5 text-xs',
                ok ? 'text-green-500' : 'text-muted-foreground'
              )}
            >
              {ok ? (
                <Check className="h-3 w-3 shrink-0" />
              ) : (
                <XMark className="h-3 w-3 shrink-0" />
              )}
              {r.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
