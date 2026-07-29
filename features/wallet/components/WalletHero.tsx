'use client'

import { useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import {
  Banknote,
  Check,
  Copy,
  Landmark,
  RefreshCw,
  Wallet2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance'
import { useEscrowBalance } from '@/features/wallet/hooks/useEscrow'
import { THB_MINT } from '@/lib/const'
import {
  BALANCE_UNAVAILABLE_HINT,
  formatBalance,
  toBalanceNumber,
} from '@/features/wallet/lib/balance-display'

// Whole numbers stay whole ("100 GRX", not "100.00 GRX") — these are reference
// figures, not accounting lines.
const BALANCE_FORMAT = { minimumFractionDigits: 0, maximumFractionDigits: 6 }

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export function WalletHero() {
  const { connected, publicKey } = useWallet()
  const [copied, setCopied] = useState(false)

  const {
    data: balance,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useWalletBalance()

  const tokenMint = balance?.token_mint
  const mint = useMemo(() => {
    if (!tokenMint) return null
    try {
      return new PublicKey(tokenMint)
    } catch {
      return null
    }
  }, [tokenMint])

  const {
    data: escrowBalance,
    isLoading: escrowLoading,
    refetch: refetchEscrow,
  } = useEscrowBalance(mint)

  // Trade proceeds settle into the escrow PDAs, not the wallet — without this
  // leg, a seller's THBC earnings are invisible on this page.
  const {
    data: thbcEscrowBalance,
    isLoading: thbcEscrowLoading,
    refetch: refetchThbcEscrow,
  } = useEscrowBalance(THB_MINT)

  const loading = balanceLoading || escrowLoading || thbcEscrowLoading

  // null = unread (chain outage, disconnected wallet) and renders "—" — never
  // a fabricated 0. See features/wallet/lib/balance-display.ts.
  const walletGrx = toBalanceNumber(balance?.token_balance)
  const escrowGrx = escrowBalance?.uiAmount ?? null
  const thbcBalance = toBalanceNumber(balance?.currency_balance)
  const thbcEscrow = thbcEscrowBalance?.uiAmount ?? null

  // The headline is only as good as its parts — an unreadable leg makes the
  // total unknown, not smaller.
  const totalGrx =
    walletGrx === null || escrowGrx === null ? null : walletGrx + escrowGrx

  const walletAddress = publicKey?.toBase58() ?? balance?.wallet_address

  const handleRefresh = () => {
    refetchBalance()
    refetchEscrow()
    refetchThbcEscrow()
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

  return (
    <Card className="rounded-sm border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Identity — connection state + address */}
          <div className="flex min-w-0 items-start gap-4 md:flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Your Wallet
                </h2>
                <span
                  className={
                    connected
                      ? 'inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
                      : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                  }
                >
                  {connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                GRX held in your wallet and your on-chain trading escrow
              </p>
              {walletAddress ? (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border bg-background/60 px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Copy wallet address"
                >
                  <Wallet2 className="h-3 w-3" />
                  {truncateAddress(walletAddress)}
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Connect a wallet to see its balances
                </p>
              )}
            </div>
          </div>

          {/* Total GRX — hero figure */}
          <div className="md:flex-1 md:text-right">
            <div className="flex items-center gap-2 md:justify-end">
              <span className="text-sm text-muted-foreground">Total GRX</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRefresh}
                disabled={loading}
                aria-label="Refresh balances"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
            {loading ? (
              <div className="space-y-2 md:flex md:flex-col md:items-end">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            ) : (
              <>
                <p
                  className="text-4xl font-bold tracking-tight text-foreground"
                  title={
                    totalGrx === null ? BALANCE_UNAVAILABLE_HINT : undefined
                  }
                >
                  {formatBalance(totalGrx, BALANCE_FORMAT)} GRX
                </p>
                <p className="text-xs text-muted-foreground">
                  Wallet + escrow · 1 GRX = 1 kWh
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground md:justify-end">
                  <span
                    className="inline-flex items-center gap-1"
                    title={
                      walletGrx === null ? BALANCE_UNAVAILABLE_HINT : undefined
                    }
                  >
                    <Wallet2 className="h-3.5 w-3.5" />
                    {formatBalance(walletGrx, BALANCE_FORMAT)} GRX in wallet
                  </span>
                  <span
                    className="inline-flex items-center gap-1"
                    title={
                      escrowGrx === null ? BALANCE_UNAVAILABLE_HINT : undefined
                    }
                  >
                    <Landmark className="h-3.5 w-3.5" />
                    {formatBalance(escrowGrx, BALANCE_FORMAT)} GRX in escrow
                  </span>
                  {/* Currency leg — the baht this wallet actually holds. */}
                  <span
                    className="inline-flex items-center gap-1"
                    title={
                      thbcBalance === null
                        ? 'THBC balance not reported by the trading service'
                        : undefined
                    }
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    {formatBalance(thbcBalance, BALANCE_FORMAT)} THBC in wallet
                  </span>
                  {/* Trade settlement pays into escrow — earnings live here
                      until withdrawn. */}
                  <span
                    className="inline-flex items-center gap-1"
                    title={
                      thbcEscrow === null
                        ? BALANCE_UNAVAILABLE_HINT
                        : 'Trade proceeds settle into your on-chain escrow until you withdraw them'
                    }
                  >
                    <Landmark className="h-3.5 w-3.5" />
                    {formatBalance(thbcEscrow, BALANCE_FORMAT)} THBC in escrow
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
