'use client'

import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpDown,
  ArrowUpFromLine,
  Banknote,
  CheckCircle2,
  Landmark,
  QrCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FeedbackMessage } from '@/components/shared/FeedbackMessage'
import { EscrowAmountInput } from '@/features/wallet/components/EscrowAmountInput'
import { EscrowManager } from '@/features/wallet/components/EscrowManager'
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance'
import {
  MIN_SWAP_KWH,
  useAutoSwap,
  type SwapDirection,
} from '@/features/wallet/hooks/useAutoSwap'
import {
  useSwapTracker,
  type SwapStage,
} from '@/features/wallet/hooks/useSwapTracker'
import { useAuth } from '@/features/auth/provider'
import { useMarketPrice } from '@/features/portfolio/hooks/usePortfolio'
import { useP2PBestPrices } from '@/features/p2p/hooks/useP2PMarket'
import {
  BALANCE_UNAVAILABLE,
  formatBalance,
  toBalanceNumber,
} from '@/features/wallet/lib/balance-display'
import { cn } from '@/lib/utils'

type ActionTab = 'deposit' | 'swap' | 'withdraw' | 'escrow'

// Whole numbers stay whole ("100 THBC", not "100.00 THBC") — previews are
// reference figures, not accounting lines.
const AMOUNT_FORMAT = { minimumFractionDigits: 0, maximumFractionDigits: 6 }
const RATE_FORMAT = { minimumFractionDigits: 2, maximumFractionDigits: 4 }

const DEPOSIT_METHODS = [
  {
    id: 'promptpay',
    label: 'PromptPay',
    description: 'Instant QR payment',
    icon: QrCode,
  },
  {
    id: 'bank',
    label: 'Bank transfer',
    description: '1–2 business days',
    icon: Landmark,
  },
] as const

type DepositMethod = (typeof DEPOSIT_METHODS)[number]['id']

/** "You receive" preview line shared by all three flows. */
function ReceiveRow({
  value,
  unit,
  hint,
  estimated = false,
}: {
  value: number | null
  unit: string
  /** Explains an em-dash value (e.g. no market price yet). */
  hint?: string
  /** Swap fills at whatever the book offers — mark the figure as an estimate. */
  estimated?: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
      <span className="text-sm text-muted-foreground">
        You receive{estimated ? ' (est.)' : ''}
      </span>
      <span
        className="font-mono text-sm font-semibold text-foreground"
        title={value === null ? hint : undefined}
      >
        {estimated && value !== null ? '≈ ' : ''}
        {formatBalance(value, AMOUNT_FORMAT)} {unit}
      </span>
    </div>
  )
}

function truncateSignature(sig: string) {
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`
}

/**
 * Live progress of the placed swap order: matching → settling → settled.
 * Confirmation is REST-polled — there is no settlement WS frame (see
 * useSwapTracker).
 */
function SwapProgress({
  stage,
  txHash,
}: {
  stage: SwapStage
  txHash: string | null
}) {
  if (stage === 'idle') return null

  if (stage === 'settled') {
    return (
      <div
        data-testid="swap-progress"
        className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>
          Settled on-chain
          {txHash ? (
            <span className="ml-1 font-mono">
              · tx {truncateSignature(txHash)}
            </span>
          ) : null}
        </span>
      </div>
    )
  }

  if (stage === 'unfilled') {
    return (
      <p
        data-testid="swap-progress"
        className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-500"
      >
        Order didn&apos;t fill — no counterparty at that price. Nothing was
        traded.
      </p>
    )
  }

  if (stage === 'timeout') {
    return (
      <p
        data-testid="swap-progress"
        className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground"
      >
        Still processing — check Portfolio → History for the final status.
      </p>
    )
  }

  return (
    <div
      data-testid="swap-progress"
      className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground"
    >
      <Spinner className="h-4 w-4 shrink-0" />
      <span>
        {stage === 'matching'
          ? 'Matching in the P2P order book…'
          : 'Matched — settling on-chain…'}
      </span>
    </div>
  )
}

/**
 * The fiat on/off-ramp has no backend endpoints yet — those forms are real
 * (live balances, validation) but submission is gated until the payment
 * service exists. Never fake a call that can't settle.
 */
function ComingSoonNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-500"
    >
      {children}
    </p>
  )
}

export function WalletActions() {
  const { token } = useAuth()
  const [tab, setTab] = useState<ActionTab>('deposit')
  const [amount, setAmount] = useState('')
  const [depositMethod, setDepositMethod] =
    useState<DepositMethod>('promptpay')
  const [swapDirection, setSwapDirection] =
    useState<SwapDirection>('thbc-to-grx')
  const [destination, setDestination] = useState('')
  const [feedback, setFeedback] = useState<{
    message: string
    isSuccess: boolean
  } | null>(null)
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null)

  const { data: balance } = useWalletBalance()

  // null = unread (chain outage, disconnected wallet) and renders "—" — never
  // a fabricated 0. See features/wallet/lib/balance-display.ts.
  const grxBalance = toBalanceNumber(balance?.token_balance)
  const thbcBalance = toBalanceNumber(balance?.currency_balance)

  // Swap pricing, best first: the live book's top (what a fill actually costs),
  // then the trade VWAP (24h, widened to all-time), then "—" — never a guess.
  const { bestBid, bestAsk } = useP2PBestPrices(token ?? undefined)
  const { data: mp24 } = useMarketPrice(24)
  const needAllTime = !!mp24 && mp24.trade_count === 0
  const { data: mpAll } = useMarketPrice(0, needAllTime)
  const effectivePrice =
    mp24 && mp24.trade_count > 0
      ? mp24
      : mpAll && mpAll.trade_count > 0
        ? mpAll
        : null
  const vwap = effectivePrice ? parseFloat(effectivePrice.vwap) : null

  const swap = useAutoSwap()
  const tracking = useSwapTracker(trackedOrderId)

  // One toast per settled order — the strip stays, the toast fires once.
  const settledToastFor = useRef<string | null>(null)
  useEffect(() => {
    if (tracking.stage !== 'settled' || !trackedOrderId) return
    if (settledToastFor.current === trackedOrderId) return
    settledToastFor.current = trackedOrderId
    toast.success(
      `Swap settled on-chain${tracking.txHash ? ` · tx ${truncateSignature(tracking.txHash)}` : ''}`
    )
  }, [tracking.stage, tracking.txHash, trackedOrderId])

  const swapFromUnit = swapDirection === 'thbc-to-grx' ? 'THBC' : 'GRX'
  const swapToUnit = swapDirection === 'thbc-to-grx' ? 'GRX' : 'THBC'
  const swapFromBalance =
    swapDirection === 'thbc-to-grx' ? thbcBalance : grxBalance

  const numericAmount = parseFloat(amount)
  const validAmount =
    !Number.isNaN(numericAmount) && numericAmount > 0 ? numericAmount : null

  // A buy fills against the resting asks, so the best ask is the honest
  // estimate; a sell executes at the best bid. VWAP is display-only fallback.
  const buyRate = bestAsk ?? vwap
  const sellRate = bestBid ?? vwap
  const swapRate = swapDirection === 'thbc-to-grx' ? buyRate : sellRate
  const rateSource =
    swapDirection === 'thbc-to-grx'
      ? bestAsk !== null
        ? 'best ask in the live book'
        : 'market VWAP'
      : bestBid !== null
        ? 'best bid in the live book'
        : 'market VWAP'

  const swapReceive =
    validAmount === null || swapRate === null
      ? null
      : swapDirection === 'thbc-to-grx'
        ? validAmount / swapRate
        : validAmount * swapRate

  // The order the engine sees is denominated in kWh (= GRX).
  const swapEnergyKwh =
    swapDirection === 'thbc-to-grx' ? swapReceive : validAmount
  const belowMinSwap =
    swapEnergyKwh !== null && swapEnergyKwh < MIN_SWAP_KWH

  const withinBalance =
    validAmount !== null &&
    (swapFromBalance === null || validAmount <= swapFromBalance)
  const sellNeedsBid = swapDirection === 'grx-to-thbc' && bestBid === null
  const canSwap =
    !!token &&
    validAmount !== null &&
    withinBalance &&
    swapEnergyKwh !== null &&
    !belowMinSwap &&
    !sellNeedsBid &&
    !swap.isPending

  // Fiat legs are 1:1 by construction — THBC is the baht settlement token.
  const fiatReceive = validAmount

  // Clear stale input when switching flows — a THB deposit amount is not a
  // GRX swap amount.
  const handleTabChange = (value: string) => {
    setTab(value as ActionTab)
    setAmount('')
    setFeedback(null)
    setTrackedOrderId(null)
  }

  const handleFlipSwap = () => {
    setSwapDirection((d) => (d === 'thbc-to-grx' ? 'grx-to-thbc' : 'thbc-to-grx'))
    setAmount('')
    setFeedback(null)
    setTrackedOrderId(null)
  }

  const handleSwap = async () => {
    if (!canSwap || swapEnergyKwh === null) return
    setFeedback(null)
    setTrackedOrderId(null)
    try {
      const order = await swap.mutateAsync({
        direction: swapDirection,
        energyKwh: swapEnergyKwh,
        bestBid,
      })
      const message = `Swap order placed (${order.status}) · tracking settlement below`
      setFeedback({ message, isSuccess: true })
      toast.success(message)
      setAmount('')
      setTrackedOrderId(order.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Swap failed'
      setFeedback({ message, isSuccess: false })
      toast.error(message)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Move Money</CardTitle>
        <p className="text-sm text-muted-foreground">
          Deposit baht, swap between THBC and GRX, or withdraw back to your
          bank
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="deposit" data-testid="fiat-deposit-tab">
              <ArrowDownToLine className="mr-1.5 h-4 w-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="swap" data-testid="swap-tab">
              <ArrowLeftRight className="mr-1.5 h-4 w-4" />
              Swap
            </TabsTrigger>
            <TabsTrigger value="withdraw" data-testid="fiat-withdraw-tab">
              <ArrowUpFromLine className="mr-1.5 h-4 w-4" />
              Withdraw
            </TabsTrigger>
            <TabsTrigger value="escrow" data-testid="escrow-tab">
              <Landmark className="mr-1.5 h-4 w-4" />
              Escrow
            </TabsTrigger>
          </TabsList>

          {/* Deposit — THB in, THBC credited 1:1 */}
          <TabsContent value="deposit" className="mt-4 space-y-4">
            <EscrowAmountInput
              amount={amount}
              setAmount={setAmount}
              max={null}
              decimals={2}
              label="Deposit Amount"
              unit="THB"
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Payment Method
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {DEPOSIT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    data-testid={`deposit-method-${method.id}`}
                    onClick={() => setDepositMethod(method.id)}
                    aria-pressed={depositMethod === method.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                      depositMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-secondary/50 hover:border-primary/50'
                    )}
                  >
                    <method.icon
                      className={cn(
                        'h-5 w-5 shrink-0',
                        depositMethod === method.id
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {method.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {method.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <ReceiveRow value={fiatReceive} unit="THBC" />

            <ComingSoonNote>
              Fiat deposits aren&apos;t connected in this environment yet —
              the form previews the flow, but no payment is initiated.
            </ComingSoonNote>

            <Button
              data-testid="fiat-deposit-submit"
              type="button"
              size="lg"
              disabled
              className="h-14 w-full rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-base font-semibold text-white shadow-xl shadow-emerald-500/25"
            >
              <Banknote className="mr-2 h-5 w-5" />
              Deposit {amount || '0'} THB
            </Button>
          </TabsContent>

          {/* Swap — a P2P energy-market order the CDA engine auto-matches:
              THBC→GRX = market buy, GRX→THBC = best-bid limit sell. */}
          <TabsContent value="swap" className="mt-4 space-y-4">
            <EscrowAmountInput
              amount={amount}
              setAmount={setAmount}
              max={swapFromBalance}
              decimals={6}
              label={`From ${swapFromUnit}`}
              unit={swapFromUnit}
            />

            <div className="flex items-center justify-center">
              <Button
                data-testid="swap-flip-button"
                type="button"
                variant="outline"
                size="icon"
                onClick={handleFlipSwap}
                aria-label="Flip swap direction"
                className="rounded-full"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>

            <ReceiveRow
              value={swapReceive}
              unit={swapToUnit}
              estimated
              hint="No market price yet — no completed trades"
            />

            <p className="text-xs text-muted-foreground">
              {swapRate === null
                ? 'No market price yet — the swap rate appears after the first completed trade.'
                : `1 GRX ≈ ฿${formatBalance(swapRate, RATE_FORMAT)} · ${rateSource}`}
            </p>

            {sellNeedsBid && (
              <p
                role="status"
                className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-500"
              >
                No buyers in the book right now — an instant GRX → THBC sell
                cannot fill. Place a limit sell from the Trading page instead.
              </p>
            )}
            {belowMinSwap && (
              <p role="alert" className="text-xs font-medium text-destructive">
                Minimum swap size is {MIN_SWAP_KWH} kWh
                {swapDirection === 'thbc-to-grx' && swapRate !== null
                  ? ` (≈ ฿${formatBalance(MIN_SWAP_KWH * swapRate, RATE_FORMAT)})`
                  : ''}
              </p>
            )}

            {feedback && (
              <FeedbackMessage
                message={feedback.message}
                isSuccess={feedback.isSuccess}
              />
            )}

            <SwapProgress stage={tracking.stage} txHash={tracking.txHash} />

            <Button
              data-testid="swap-submit"
              type="button"
              size="lg"
              disabled={!canSwap}
              onClick={handleSwap}
              className="h-14 w-full rounded-xl bg-gradient-to-b from-violet-500 to-violet-600 text-base font-semibold text-white shadow-xl shadow-violet-500/25 transition-all duration-200 hover:from-violet-400 hover:to-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              {swap.isPending ? (
                <div className="flex items-center gap-2">
                  <Spinner className="h-5 w-5" />
                  <span>Placing order...</span>
                </div>
              ) : (
                <>
                  <ArrowLeftRight className="mr-2 h-5 w-5" />
                  Swap {amount || '0'} {swapFromUnit} → {swapToUnit}
                </>
              )}
            </Button>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Swaps execute in the P2P energy market (THBC/kWh): a buy fills
              against the lowest-priced sell offers; a sell posts at the best
              bid and fills against it. Settlement then moves GRX and THBC
              on-chain automatically.
            </p>
          </TabsContent>

          {/* Withdraw — THBC out to a bank account, 1:1 THB */}
          <TabsContent value="withdraw" className="mt-4 space-y-4">
            <EscrowAmountInput
              amount={amount}
              setAmount={setAmount}
              max={thbcBalance}
              decimals={2}
              label="Withdraw Amount"
              unit="THBC"
            />

            <div className="space-y-2">
              <Label
                htmlFor="withdraw-destination"
                className="text-sm font-medium text-foreground"
              >
                Destination
              </Label>
              <Input
                id="withdraw-destination"
                data-testid="withdraw-destination"
                placeholder="PromptPay ID or bank account number"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-12 rounded-xl border-muted bg-secondary"
              />
            </div>

            <ReceiveRow value={fiatReceive} unit="THB" />

            <ComingSoonNote>
              Fiat withdrawals aren&apos;t connected in this environment yet —
              the form previews the flow, but no transfer is initiated.
            </ComingSoonNote>

            <Button
              data-testid="fiat-withdraw-submit"
              type="button"
              size="lg"
              disabled
              className="h-14 w-full rounded-xl bg-gradient-to-b from-sky-500 to-sky-600 text-base font-semibold text-white shadow-xl shadow-sky-500/25"
            >
              <Banknote className="mr-2 h-5 w-5" />
              Withdraw {amount || '0'} THBC
            </Button>
          </TabsContent>

          {/* Escrow — collect settled proceeds / fund trading, both mints */}
          <TabsContent value="escrow" className="mt-4">
            <EscrowManager />
          </TabsContent>
        </Tabs>

        <p className="text-xs leading-relaxed text-muted-foreground">
          THBC is the baht settlement token (1 THBC = ฿1); GRX is the energy
          token (1 GRX = 1 kWh). Balances shown are read live from your
          wallet{thbcBalance === null ? ` — ${BALANCE_UNAVAILABLE} means the balance could not be read` : ''}.
        </p>
      </CardContent>
    </Card>
  )
}
