'use client'

import React, { useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import toast from 'react-hot-toast'
import { ArrowDownToLine, ArrowUpFromLine, Loader2, Wallet2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FeedbackMessage } from '@/components/shared/FeedbackMessage'
import { EscrowAmountInput } from '@/features/wallet/components/EscrowAmountInput'
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance'
import { useDepositEscrow, useWithdrawEscrow, useEscrowBalance } from '@/features/wallet/hooks/useEscrow'
import { cn } from '@/lib/utils'

type TransferTab = 'deposit' | 'withdraw'

function truncateSignature(sig: string) {
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`
}

function BalanceRow({
  label,
  value,
  loading,
}: {
  label: string
  value: string
  loading: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
      )}
    </div>
  )
}

export function WalletTransfer() {
  const { connected, publicKey } = useWallet()
  const [tab, setTab] = useState<TransferTab>('deposit')
  const [amount, setAmount] = useState('')
  const [feedback, setFeedback] = useState<{ message: string; isSuccess: boolean } | null>(null)

  const { data: balance, isLoading: balanceLoading } = useWalletBalance()

  const tokenMint = balance?.token_mint
  const mint = useMemo(() => {
    if (!tokenMint) return null
    try {
      return new PublicKey(tokenMint)
    } catch {
      return null
    }
  }, [tokenMint])

  const { data: escrowBalance, isLoading: escrowLoading } = useEscrowBalance(mint)
  const deposit = useDepositEscrow()
  const withdraw = useWithdrawEscrow()

  const walletAvailable = balance ? parseFloat(balance.token_balance) : null
  const escrowAvailable = escrowBalance?.uiAmount ?? (escrowLoading ? null : 0)
  const maxForTab = tab === 'deposit' ? walletAvailable : escrowAvailable

  // Clear stale feedback and input when switching direction
  const handleTabChange = (value: string) => {
    setTab(value as TransferTab)
    setFeedback(null)
    setAmount('')
  }

  const numericAmount = parseFloat(amount)
  const amountValid =
    !Number.isNaN(numericAmount) &&
    numericAmount > 0 &&
    (maxForTab === null || numericAmount <= maxForTab)

  const mutation = tab === 'deposit' ? deposit : withdraw
  const canSubmit =
    connected &&
    !!publicKey &&
    !!mint &&
    balance?.decimals !== undefined &&
    amountValid &&
    !mutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !mint || !balance) return
    setFeedback(null)
    try {
      const signature = await mutation.mutateAsync({
        mint,
        amountUi: amount,
        decimals: balance.decimals,
      })
      const verb = tab === 'deposit' ? 'Deposited' : 'Withdrew'
      const message = `${verb} ${amount} GRX · tx ${truncateSignature(signature)}`
      setFeedback({ message, isSuccess: true })
      toast.success(message)
      setAmount('')
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Transaction failed'
      const message = raw.includes('could not find account') || raw.includes('AccountNotFound')
        ? 'No on-chain GRX token account found for this wallet'
        : raw
      setFeedback({ message, isSuccess: false })
      toast.error(message)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-lg">Escrow Transfer</CardTitle>
        <p className="text-sm text-muted-foreground">
          Move GRX between your wallet and your on-chain trading escrow
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <BalanceRow
            label="Wallet Balance"
            value={`${walletAvailable?.toLocaleString(undefined, { maximumFractionDigits: 6 }) ?? '—'} GRX`}
            loading={balanceLoading}
          />
          <BalanceRow
            label="On-chain Escrow"
            value={`${escrowBalance?.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 6 }) ?? '—'} GRX`}
            loading={escrowLoading}
          />
        </div>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" data-testid="deposit-tab">
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" data-testid="withdraw-tab">
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          {(['deposit', 'withdraw'] as const).map((direction) => (
            <TabsContent key={direction} value={direction} className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <EscrowAmountInput
                  amount={amount}
                  setAmount={setAmount}
                  max={maxForTab}
                  decimals={balance?.decimals ?? 6}
                  label={direction === 'deposit' ? 'Deposit Amount' : 'Withdraw Amount'}
                />

                {feedback && (
                  <FeedbackMessage message={feedback.message} isSuccess={feedback.isSuccess} />
                )}

                {!connected ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/10 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Wallet2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Connect your wallet to {direction} GRX
                    </span>
                  </div>
                ) : (
                  <Button
                    data-testid="escrow-submit-button"
                    type="submit"
                    size="lg"
                    disabled={!canSubmit}
                    className={cn(
                      'h-14 w-full rounded-xl font-semibold text-base shadow-xl transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2',
                      direction === 'deposit'
                        ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 focus-visible:ring-emerald-500/50'
                        : 'bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-sky-500/25 hover:from-sky-400 hover:to-sky-500 focus-visible:ring-sky-500/50'
                    )}
                  >
                    {mutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <span>
                        {direction === 'deposit' ? 'Deposit' : 'Withdraw'} {amount || '0'} GRX
                      </span>
                    )}
                  </Button>
                )}
              </form>
            </TabsContent>
          ))}
        </Tabs>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Deposits fund your on-chain trading escrow; the first deposit also creates the escrow
          account (small one-time SOL rent). Withdrawals return escrowed GRX to your wallet.
        </p>
      </CardContent>
    </Card>
  )
}
