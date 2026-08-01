'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

interface UnverifiedMeterNoticeProps {
  /** True when the user owns meters but none of them is verified. */
  hasUnverifiedMetersOnly: boolean
  /** True when the user owns no meter at all. */
  hasNoMeters: boolean
}

/**
 * Explains, before the user fills the form in, why their sell order would be
 * refused: selling energy requires a **verified** meter, and registering one
 * only claims a serial.
 *
 * The two cases need different instructions — "register a meter" and "verify the
 * meter you have" are not the same next step — so they get different copy rather
 * than one vague message.
 *
 * Renders nothing when the user can sell, or while eligibility is unknown: a
 * block shown on a loading state would flash on every page load, and the server
 * is the real gate regardless.
 */
export function UnverifiedMeterNotice({
  hasUnverifiedMetersOnly,
  hasNoMeters,
}: UnverifiedMeterNoticeProps) {
  if (!hasUnverifiedMetersOnly && !hasNoMeters) return null

  return (
    <div
      data-testid="unverified-meter-notice"
      role="status"
      className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
      <div className="leading-relaxed">
        {hasNoMeters ? (
          <>
            <span className="font-medium">
              You need a verified meter to sell energy.
            </span>{' '}
            Register your smart meter, then verify it once it has started
            reporting.
          </>
        ) : (
          <>
            <span className="font-medium">Your meter is not verified yet.</span>{' '}
            Verification confirms the device is really yours and is reporting —
            it succeeds once your meter has sent signed readings.
          </>
        )}{' '}
        <Link
          href="/meter"
          className="font-medium underline underline-offset-2 hover:no-underline"
        >
          {hasNoMeters ? 'Register a meter' : 'Go to My Meters'}
        </Link>
      </div>
    </div>
  )
}
