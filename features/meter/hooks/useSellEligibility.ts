'use client'

import { useQuery } from '@tanstack/react-query'

import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/features/auth/provider'
import { queryKeys } from '@/lib/query/keys'
import type { MeterResponse } from '@/types/meter'

/**
 * Whether the signed-in user may open a sell order.
 *
 * The trading service refuses a sell (403) unless the seller owns a **verified**
 * meter: selling energy is a claim to have produced it, and registering a meter
 * only records an unproven assertion that a serial is yours. Verification proves
 * the device — see `MetersApi.verifyMeter`.
 *
 * This mirrors the server rule so the form can explain the block up front
 * instead of letting the user fill it in and collect a 403. It is deliberately
 * NOT the authority: the gate is enforced server-side at both submit edges, and
 * a stale client read must never be able to admit an order.
 *
 * Fails **open** on an error or while loading — `canSell` stays true so a meters
 * endpoint hiccup can't lock a legitimate seller out of a form the backend would
 * have accepted. A wrongly-allowed submit surfaces the real 403 from the server;
 * a wrongly-blocked one has no recourse.
 */
export function useSellEligibility() {
  const { token } = useAuth()

  const { data, isLoading, isError } = useQuery({
    // Shares the cache slot with any other "my meters" reader, so verifying a
    // meter elsewhere in the app refreshes this without a bespoke invalidation.
    queryKey: queryKeys.meters.mine(token ?? undefined),
    queryFn: async (): Promise<MeterResponse[]> => {
      if (!token) return []
      const res = await createApiClient(token).getMyMeters()
      if (res.error) throw new Error(res.error)
      return res.data ?? []
    },
    enabled: !!token,
    staleTime: 30_000,
  })

  const meters = data ?? []
  const verifiedMeters = meters.filter((m) => m.is_verified)
  // `unknown` while we have no answer — the caller must not render a block on it.
  const unknown = !token || isLoading || isError

  return {
    meters,
    verifiedMeters,
    hasVerifiedMeter: verifiedMeters.length > 0,
    /** True when the user owns meters but none is verified — the actionable case. */
    hasUnverifiedMetersOnly: !unknown && meters.length > 0 && verifiedMeters.length === 0,
    /** True when the user owns no meter at all. */
    hasNoMeters: !unknown && meters.length === 0,
    /** Fails open: only false once we KNOW there is no verified meter. */
    canSell: unknown || verifiedMeters.length > 0,
    isLoading,
  }
}
