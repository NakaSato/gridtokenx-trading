'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/provider'
import { useWallet } from '@solana/wallet-adapter-react'
import { useMarketPrice, useProfile, useWalletBalance, useWallets } from '@/features/portfolio/hooks/usePortfolio'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Coins, Copy, RefreshCw, User, Wallet } from 'lucide-react'
import { PortfolioStatsRow } from '@/features/portfolio/components/portfolio-stats-row'

// No static prices. GRX (the only platform token) is priced from the real trade
// VWAP (useMarketPrice); when the market has never traded, ฿-value renders "—".
const EMDASH = '—'

function formatAmount(value: string | number | undefined, decimals = 2): string {
  if (value === undefined || value === null) return '0.00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** ฿-formatted value, or an em-dash when the figure is genuinely unknown. */
function formatBaht(value: number | null | undefined, decimals = 2): string {
  return value === null || value === undefined ? EMDASH : `฿${formatAmount(value, decimals)}`
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export function PortfolioHero() {
  const { isAuthenticated } = useAuth()
  const { publicKey } = useWallet()
  const { data: profileUser, isLoading: profileLoading, refetch: refetchProfile } = useProfile()
  const { data: linkedWallets } = useWallets()
  // Real price: 24h VWAP; widen to all-time only when 24h has no trades.
  const { data: mp24 } = useMarketPrice(24)
  const needAllTime = !!mp24 && mp24.trade_count === 0
  const { data: mpAll } = useMarketPrice(0, needAllTime)
  const [copied, setCopied] = useState(false)

  // Prefer the profile's wallet_address, then the IAM primary linked wallet,
  // then any linked wallet, then the connected browser-extension wallet.
  const primaryLinked = useMemo(() => {
    if (!linkedWallets?.length) return undefined
    return (linkedWallets.find((w) => w.is_primary) ?? linkedWallets[0])?.wallet_address
  }, [linkedWallets])

  const walletAddress = profileUser?.wallet_address || primaryLinked || publicKey?.toString()
  const {
    data: tokenBalance,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useWalletBalance(walletAddress)

  const loading = profileLoading || balanceLoading

  const handleRefresh = async () => {
    await Promise.all([refetchProfile(), refetchBalance()])
  }

  const handleCopy = async () => {
    if (!walletAddress) return
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (insecure context) — silently ignore
    }
  }

  const grxBalance = parseFloat(tokenBalance?.token_balance || '0')
  // Effective real price: prefer 24h VWAP, else all-time; null when the market
  // has never traded. No static fallback — an unknown price renders as "—".
  const effectivePrice =
    mp24 && mp24.trade_count > 0 ? mp24 : mpAll && mpAll.trade_count > 0 ? mpAll : null
  const grxPriceThb = effectivePrice ? parseFloat(effectivePrice.vwap) : null
  const grxValue = grxPriceThb === null ? null : grxBalance * grxPriceThb
  // GRX is the only platform token — total wealth is its ฿-value (or "—").
  const totalWealth = grxValue

  return (
    <Card className="rounded-sm bg-gradient-to-br from-primary/10 via-transparent to-transparent border-primary/20">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Identity */}
          <div className="flex items-start gap-4 min-w-0 md:flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              {isAuthenticated && profileUser ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground truncate">
                      {profileUser.username || 'User'}
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                      {profileUser.role || 'User'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{profileUser.email}</p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-foreground">Not logged in</h2>
                  <p className="text-sm text-muted-foreground">Sign in to view your portfolio</p>
                </>
              )}
              {walletAddress ? (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border bg-background/60 px-2 py-1 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Copy wallet address"
                >
                  <Wallet className="h-3 w-3" />
                  {truncateAddress(walletAddress)}
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No wallet connected</p>
              )}
            </div>
          </div>

          {/* Total wealth — hero figure */}
          <div className="md:flex-1 md:text-right">
            <div className="flex items-center gap-2 md:justify-end">
              <span className="text-sm text-muted-foreground">Total wealth</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRefresh}
                disabled={loading}
                aria-label="Refresh balances"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {loading ? (
              <div className="space-y-2 md:flex md:flex-col md:items-end">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            ) : (
              <>
                <p className="text-4xl font-bold tracking-tight text-foreground">
                  {formatBaht(totalWealth)}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground md:justify-end">
                  <span className="inline-flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5" />
                    {formatAmount(grxBalance)} GRX
                    <span className="text-xs" title={grxValue === null ? 'No market price yet — no completed trades' : undefined}>
                      ≈ {formatBaht(grxValue)}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Performance — colocated with the user's identity & wealth */}
        <div className="mt-6 border-t pt-6">
          <PortfolioStatsRow />
        </div>
      </CardContent>
    </Card>
  )
}
