'use client'

import React, { useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import toast from 'react-hot-toast'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Wallet2,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { FeedbackMessage } from '@/components/shared/FeedbackMessage'
import { EscrowAmountInput } from '@/features/wallet/components/EscrowAmountInput'
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance'
import {
  useDepositEscrow,
  useEscrowBalance,
  useWithdrawEscrow,
} from '@/features/wallet/hooks/useEscrow'
import { THB_DECIMALS, THB_MINT } from '@/lib/const'
import {
  formatBalance,
  toBalanceNumber,
} from '@/features/wallet/lib/balance-display'
import { cn } from '@/lib/utils'

type EscrowAsset = 'GRX' | 'THBC'
type EscrowDirection = 'deposit' | 'withdraw'

const BALANCE_FORMAT = { minimumFractionDigits: 0, maximumFractionDigits: 6 }

const ASSETS = [
  { id: 'GRX', label: 'GRX', description: 'Energy · 1 GRX = 1 kWh', icon: Zap },
  { id: 'THBC', label: 'THBC', description: 'Baht settlement token', icon: Banknote },
] as const

function truncateSignature(sig: string) {
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`
}

/**
 * Moves funds between the user's wallet and their on-chain escrow PDAs —
 * both mints. Settlement pays trade proceeds INTO escrow (THBC for sellers,
 * GRX for buyers), so "withdraw to wallet" is how earnings are collected;
 * "deposit to escrow" funds future trading.
 */
export function EscrowManager() {
  const { connected, publicKey } = useWallet()
  const [asset, setAsset] = useState<EscrowAsset>('GRX')
  // Default to withdraw — collecting settled proceeds is this tab's main job.
  const [direction, setDirection] = useState<EscrowDirection>('withdraw')
  const [amount, setAmount] = useState('')
  const [feedback, setFeedback] = useState<{
    message: string
    isSuccess: boolean
  } | null>(null)

  const { data: balance } = useWalletBalance()

  const tokenMint = balance?.token_mint
  const grxMint = useMemo(() => {
    if (!tokenMint) return null
    try {
      return new PublicKey(tokenMint)
    } catch {
      return null
    }
  }, [tokenMint])

  const { data: grxEscrow, isLoading: grxEscrowLoading } =
    useEscrowBalance(grxMint)
  const { data: thbcEscrow, isLoading: thbcEscrowLoading } =
    useEscrowBalance(THB_MINT)
  const deposit = useDepositEscrow()
  const withdraw = useWithdrawEscrow()

  const mint = asset === 'GRX' ? grxMint : THB_MINT
  const decimals = asset === 'GRX' ? (balance?.decimals ?? 9) : THB_DECIMALS

  // null = unread — renders "—" and leaves the amount cap unset rather than
  // pinning max to a fabricated 0.
  const walletAvailable =
    asset === 'GRX'
      ? toBalanceNumber(balance?.token_balance)
      : toBalanceNumber(balance?.currency_balance)
  const escrowLoading = asset === 'GRX' ? grxEscrowLoading : thbcEscrowLoading
  const escrowData = asset === 'GRX' ? grxEscrow : thbcEscrow
  const escrowAvailable = escrowData?.uiAmount ?? (escrowLoading ? null : 0)

  const maxForDirection =
    direction === 'deposit' ? walletAvailable : escrowAvailable

  const numericAmount = parseFloat(amount)
  const amountValid =
    !Number.isNaN(numericAmount) &&
    numericAmount > 0 &&
    (maxForDirection === null || numericAmount <= maxForDirection)

  const mutation = direction === 'deposit' ? deposit : withdraw
  const canSubmit =
    connected &&
    !!publicKey &&
    !!mint &&
    (asset !== 'GRX' || balance?.decimals !== undefined) &&
    amountValid &&
    !mutation.isPending

  const resetInput = () => {
    setAmount('')
    setFeedback(null)
  }

  const handleAssetChange = (next: EscrowAsset) => {
    setAsset(next)
    resetInput()
  }

  const handleDirectionChange = (next: EscrowDirection) => {
    setDirection(next)
    resetInput()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !mint) return
    setFeedback(null)
    try {
      const signature = await mutation.mutateAsync({
        mint,
        amountUi: amount,
        decimals,
      })
      const verb =
        direction === 'deposit' ? 'Moved to escrow' : 'Withdrawn to wallet'
      const message = `${verb}: ${amount} ${asset} · tx ${truncateSignature(signature)}`
      setFeedback({ message, isSuccess: true })
      toast.success(message)
      setAmount('')
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Transaction failed'
      const message =
        raw.includes('could not find account') ||
        raw.includes('AccountNotFound')
          ? `No on-chain ${asset} token account found for this wallet`
          : raw
      setFeedback({ message, isSuccess: false })
      toast.error(message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Asset</Label>
        <div className="grid grid-cols-2 gap-2">
          {ASSETS.map((a) => (
            <button
              key={a.id}
              type="button"
              data-testid={`escrow-asset-${a.id.toLowerCase()}`}
              onClick={() => handleAssetChange(a.id)}
              aria-pressed={asset === a.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                asset === a.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-secondary/50 hover:border-primary/50'
              )}
            >
              <a.icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  asset === a.id ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {a.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {a.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Wallet</span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {formatBalance(walletAvailable, BALANCE_FORMAT)} {asset}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Escrow</span>
          {escrowLoading ? (
            <Spinner className="h-4 w-4 text-muted-foreground" />
          ) : (
            <span className="font-mono text-sm font-semibold text-foreground">
              {formatBalance(escrowAvailable, BALANCE_FORMAT)} {asset}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={direction === 'withdraw' ? 'default' : 'outline'}
          data-testid="escrow-direction-withdraw"
          onClick={() => handleDirectionChange('withdraw')}
          className="rounded-xl"
        >
          <ArrowUpFromLine className="mr-2 h-4 w-4" />
          Escrow → Wallet
        </Button>
        <Button
          type="button"
          variant={direction === 'deposit' ? 'default' : 'outline'}
          data-testid="escrow-direction-deposit"
          onClick={() => handleDirectionChange('deposit')}
          className="rounded-xl"
        >
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Wallet → Escrow
        </Button>
      </div>

      <EscrowAmountInput
        amount={amount}
        setAmount={setAmount}
        max={maxForDirection}
        decimals={decimals}
        label={direction === 'deposit' ? 'Move to Escrow' : 'Withdraw to Wallet'}
        unit={asset}
      />

      {feedback && (
        <FeedbackMessage
          message={feedback.message}
          isSuccess={feedback.isSuccess}
        />
      )}

      {!connected ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/10 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Wallet2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Connect your wallet to move {asset} between wallet and escrow
          </span>
        </div>
      ) : (
        <Button
          data-testid="escrow-manager-submit"
          type="submit"
          size="lg"
          disabled={!canSubmit}
          className={cn(
            'h-14 w-full rounded-xl text-base font-semibold shadow-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]',
            direction === 'deposit'
              ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 focus-visible:ring-emerald-500/50'
              : 'bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-sky-500/25 hover:from-sky-400 hover:to-sky-500 focus-visible:ring-sky-500/50'
          )}
        >
          {mutation.isPending ? (
            <div className="flex items-center gap-2">
              <Spinner className="h-5 w-5" />
              <span>Processing...</span>
            </div>
          ) : (
            <span>
              {direction === 'deposit' ? 'Move' : 'Withdraw'} {amount || '0'}{' '}
              {asset}
            </span>
          )}
        </Button>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Trade settlement pays proceeds into your on-chain escrow — THBC for
        sellers, GRX for buyers. Withdraw moves them to your wallet; the first
        move to escrow also creates the escrow account (small one-time SOL
        rent).
      </p>
    </form>
  )
}
