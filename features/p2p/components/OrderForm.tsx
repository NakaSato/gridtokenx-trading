'use client'

import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Separator } from '@/components/ui/separator'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/features/auth/provider'
import { useOrderFill } from '@/features/p2p/order-fill-context'
import type { OrderAccount } from '@/features/p2p/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EnergyNode } from '@/types/grid'
import { RecurringOrderForm } from '@/features/trading/components/RecurringOrderForm'
import { useCrypto } from '@/lib/wasm-hooks'
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance'
import { toBalanceNumber } from '@/features/wallet/lib/balance-display'
import {
  useMarketConfig,
  useP2PMarketPrices,
  useP2PBestPrices,
} from '@/features/p2p/hooks/useP2PMarket'
import { P2P_CONFIG } from '@/lib/constants'
import { OrderTypeTabs } from '@/features/p2p/components/order-form/OrderTypeTabs'
import { MatchTargetIndicator } from '@/features/p2p/components/order-form/MatchTargetIndicator'
import { BalanceDisplay } from '@/features/p2p/components/order-form/BalanceDisplay'
import { SelectedNodeCard } from '@/features/p2p/components/order-form/SelectedNodeCard'
import { ZoneSelector } from '@/features/p2p/components/order-form/ZoneSelector'
import { AmountInput } from '@/features/p2p/components/order-form/AmountInput'
import { PriceInput } from '@/features/p2p/components/order-form/PriceInput'
import { OrderSummary } from '@/features/p2p/components/order-form/OrderSummary'
import { SubmitButton } from '@/features/p2p/components/order-form/SubmitButton'
import { FeedbackMessage } from '@/components/shared/FeedbackMessage'
import { UnverifiedMeterNotice } from '@/features/p2p/components/order-form/UnverifiedMeterNotice'
import { meterSerialFromNode } from '@/features/p2p/components/order-form/meterId'
import { useSellEligibility } from '@/features/meter/hooks/useSellEligibility'

interface OrderFormProps {
  onOrderPlaced?: () => void
  selectedNode?: EnergyNode | null
  onClearNode?: () => void
}

const OrderForm = React.memo(function OrderForm({
  onOrderPlaced,
  selectedNode,
  onClearNode,
}: OrderFormProps) {
  const { token } = useAuth()
  const [orderType, setOrderType] = useState<'buy' | 'sell' | 'recurring'>(
    'buy'
  )
  const [priceType, setPriceType] = useState<'market' | 'limit'>('limit')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [buyerZone, setBuyerZone] = useState<number>(0)
  const [sellerZone, setSellerZone] = useState<number>(0)
  const [message, setMessage] = useState('')
  const [targetMatchOrder, setTargetMatchOrder] = useState<OrderAccount | null>(
    null
  )
  const { isLoaded: cryptoLoaded } = useCrypto()
  const queryClient = useQueryClient()
  const { marketConfig } = useMarketConfig(token ?? undefined)
  const { marketPrices } = useP2PMarketPrices(token ?? undefined)
  // Best bid/ask refresh on their own interval inside the hook, so the spread
  // warning and market-order estimate don't go stale.
  const { bestBid, bestAsk } = useP2PBestPrices(token ?? undefined)
  const { activeOrderFill, setActiveOrderFill } = useOrderFill()
  // Trading refuses a sell (403) from a user with no verified meter. Mirror the
  // rule here to explain the block up front rather than after a failed submit —
  // the server stays the authority, and this fails open (see the hook).
  const { canSell, hasUnverifiedMetersOnly, hasNoMeters } = useSellEligibility()
  const sellBlocked = orderType === 'sell' && !canSell

  const {
    data: balanceData,
    isLoading: balanceLoading,
    isError: balanceUnavailable,
  } = useWalletBalance()
  // `null` = could not read (not zero). BalanceDisplay renders it as "—" and the
  // sell-side check below skips rather than asserting a balance we don't have.
  const balance = balanceUnavailable
    ? null
    : toBalanceNumber(balanceData?.token_balance)

  // Consume activeOrderFill if present
  useEffect(() => {
    if (activeOrderFill) {
      let side: 'buy' | 'sell' = 'buy'

      if (activeOrderFill.targetOrder) {
        const target = activeOrderFill.targetOrder
        const isSellerSet =
          target.account.seller.toString() !==
          '11111111111111111111111111111111'
        if (isSellerSet) {
          side = 'buy'
        } else {
          side = 'sell'
        }
        setTargetMatchOrder(target)
      }

      setOrderType(side)
      setAmount(activeOrderFill.amount.toFixed(2))
      if (activeOrderFill.price) {
        setPrice(activeOrderFill.price.toFixed(2))
      }
      setActiveOrderFill(null)
    }
  }, [activeOrderFill, setActiveOrderFill])

  // Pre-fill amount and zone when a node is selected from the map
  useEffect(() => {
    if (selectedNode) {
      if (selectedNode.surplusEnergy && selectedNode.surplusEnergy > 0) {
        setOrderType('sell')
        setAmount(selectedNode.surplusEnergy.toFixed(2))
      } else if (selectedNode.deficitEnergy && selectedNode.deficitEnergy > 0) {
        setOrderType('buy')
        setAmount(selectedNode.deficitEnergy.toFixed(2))
      }

      if (selectedNode.zoneId) {
        if (orderType === 'buy') {
          setBuyerZone(selectedNode.zoneId)
          if (sellerZone === 0) setSellerZone(selectedNode.zoneId)
        } else if (orderType === 'sell') {
          setSellerZone(selectedNode.zoneId)
          if (buyerZone === 0) setBuyerZone(selectedNode.zoneId)
        }
      }
    }
  }, [selectedNode])

  // Market sells are unsupported (the matcher prices them at the resting ask and
  // rejects them), so switching to the sell side forces a limit order. Wrapping
  // the setter keeps this out of an effect (avoids a cascading-render setState).
  const handleSetOrderType = (next: 'buy' | 'sell' | 'recurring') => {
    if (next === 'sell') setPriceType('limit')
    setOrderType(next)
  }

  const orderMutation = useMutation({
    mutationFn: async (orderPayload: {
      side: 'buy' | 'sell'
      order_type: 'market' | 'limit'
      amount: string
      price_per_kwh?: string
      zone_id: number
      meter_serial?: string
    }) => {
      if (!token) throw new Error('Please log in to create orders')

      const apiClient = createApiClient(token)
      // createOrder maps `amount` → energy_amount_kwh and only sends price when
      // present, so a market order (empty price, or a buy-side slippage ceiling)
      // is submitted correctly instead of being forced to a limit order.
      const apiResult = await apiClient.createOrder({
        side: orderPayload.side,
        order_type: orderPayload.order_type,
        amount: orderPayload.amount,
        price_per_kwh: orderPayload.price_per_kwh,
        // zone_id 0 ("Main Grid") is a valid zone, not "unset" — `|| undefined` was
        // dropping it from the request, and trading-service requires the field
        // (400 "missing field `zone_id`"), so every order at the default zone failed.
        zone_id: orderPayload.zone_id,
        // Attributes the order to the meter it was placed against, which is what
        // lets the map show only meters that are actually trading
        // (GET /markets/active-order-meters). The map holds serials, so the
        // backend resolves this to meters.id. Undefined when the order wasn't
        // placed from a map node — createOrder then omits the field.
        meter_serial: orderPayload.meter_serial,
      })

      if (apiResult.error) {
        throw new Error(apiResult.error)
      }

      return apiResult.data
    },
    onSuccess: () => {
      setMessage('')
      setAmount('')
      setPrice('')
      setTargetMatchOrder(null)
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['p2p-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orderbook'] })
      // The map filters markers on this — refresh it so the meter just traded
      // against appears without waiting for the poll interval.
      queryClient.invalidateQueries({ queryKey: ['active-order-meters'] })
      onOrderPlaced?.()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Belt-and-braces alongside the disabled submit button: the server would
    // refuse this anyway, but a 403 toast is a worse explanation than the notice
    // already on screen.
    if (sellBlocked) {
      setMessage(
        hasNoMeters
          ? 'Register and verify a smart meter before selling energy.'
          : 'Verify your smart meter before selling energy.'
      )
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Please enter a valid amount')
      return
    }
    if (parseFloat(amount) < 0.1) {
      setMessage('Minimum order amount is 0.1 kWh')
      return
    }
    // The matcher rejects market sells (it would price them at the resting ask),
    // so a sell must be a limit order. Guard here in case state slips through.
    const effectivePriceType = orderType === 'sell' ? 'limit' : priceType

    // Market orders fill against the resting book — no price required. Only limit
    // orders need a price (and are range-checked against market config).
    if (effectivePriceType === 'limit') {
      if (!price || parseFloat(price) <= 0) {
        setMessage('Please enter a valid price')
        return
      }

      if (marketConfig) {
        const priceVal = parseFloat(price)
        if (priceVal < marketConfig.min_price_per_kwh) {
          setMessage(
            `Price cannot be lower than the minimum limit (฿${marketConfig.min_price_per_kwh})`
          )
          return
        }
        if (priceVal > marketConfig.max_price_per_kwh) {
          setMessage(
            `Price cannot be higher than the maximum limit (฿${marketConfig.max_price_per_kwh})`
          )
          return
        }
      }
    }

    if (
      orderType === 'sell' &&
      balance !== null &&
      parseFloat(amount) > balance
    ) {
      setMessage(
        `Insufficient balance. You have ${balance.toFixed(2)} GRX available.`
      )
      return
    }

    const zone_id = orderType === 'buy' ? buyerZone : sellerZone

    toast
      .promise(
        orderMutation.mutateAsync({
          side: orderType as 'buy' | 'sell',
          order_type: effectivePriceType,
          amount,
          // Limit: the price. Market: omit (a market buy may still carry `price` as a
          // slippage ceiling; sell is always limit).
          price_per_kwh:
            effectivePriceType === 'limit' ? price : price || undefined,
          zone_id,
          meter_serial: meterSerialFromNode(selectedNode),
        }),
        {
          loading: 'Placing order…',
          success:
            'Order placed successfully! The matching engine will find the best counterparty.',
          error: (error) =>
            error instanceof Error ? error.message : 'Failed to place order',
        }
      )
      // toast.promise surfaces the failure; swallow the rejection it re-throws.
      .catch(() => {})
  }

  const loading = orderMutation.isPending

  const amountNum = parseFloat(amount) || 0
  const priceNum = parseFloat(price) || 0

  // Market orders have no price of their own (the field is disabled) — they
  // sweep the resting book, so estimate against the side they'd actually fill
  // against: a market buy eats asks, a market sell eats bids. Falls back to
  // the typed price only while the book hasn't loaded yet.
  const effectivePrice =
    priceType === 'market'
      ? ((orderType === 'buy' ? bestAsk : bestBid) ?? priceNum)
      : priceNum
  const energyCost = amountNum * effectivePrice

  // A limit order priced worse than the current best opposing quote won't
  // fill immediately — it rests on the book until a counterparty crosses it.
  const fillWarning =
    priceType === 'limit' && priceNum > 0
      ? orderType === 'buy'
        ? bestAsk !== null && priceNum < bestAsk
          ? `Price below best ask (฿${bestAsk.toFixed(2)}) — this order will rest unfilled until matched, not execute immediately.`
          : null
        : bestBid !== null && priceNum > bestBid
          ? `Price above best bid (฿${bestBid.toFixed(2)}) — this order will rest unfilled until matched, not execute immediately.`
          : null
      : null

  // Wheeling charge + transmission loss for the selected zone pair — sourced
  // from the real market-prices endpoint, not the mocked /api/v1/quotes.
  const crossZone = buyerZone !== sellerZone
  const zoneKey = String(sellerZone)
  const homeZoneKey = String(buyerZone)
  const wheelingChargePerKwh = crossZone
    ? (marketPrices?.wheeling_charges?.[zoneKey] ??
      marketPrices?.wheeling_charges?.[homeZoneKey] ??
      0)
    : 0
  const wheelingCharge = wheelingChargePerKwh * amountNum
  const lossFactor = crossZone
    ? (marketPrices?.loss_factors?.[zoneKey] ??
      marketPrices?.loss_factors?.[homeZoneKey] ??
      P2P_CONFIG.defaultCrossZoneLossFactor)
    : 0
  const lossCost = energyCost * lossFactor
  const orderTotal = energyCost + wheelingCharge + lossCost

  return (
    <div className="flex w-full flex-col space-y-0 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      <OrderTypeTabs orderType={orderType} setOrderType={handleSetOrderType} />

      <div className="flex flex-col space-y-4 p-4">
        <MatchTargetIndicator
          targetMatchOrder={targetMatchOrder}
          onClear={() => setTargetMatchOrder(null)}
        />

        <BalanceDisplay
          token={token}
          balance={balance}
          balanceLoading={balanceLoading}
        />

        {orderType === 'recurring' ? (
          <RecurringOrderForm />
        ) : (
          <>
            <SelectedNodeCard
              selectedNode={selectedNode || null}
              onClearNode={onClearNode}
            />

            {orderType === 'sell' && (
              <UnverifiedMeterNotice
                hasUnverifiedMetersOnly={hasUnverifiedMetersOnly}
                hasNoMeters={hasNoMeters}
              />
            )}

            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              <ZoneSelector
                orderType={orderType as 'buy' | 'sell'}
                buyerZone={buyerZone}
                sellerZone={sellerZone}
                setBuyerZone={setBuyerZone}
                setSellerZone={setSellerZone}
                selectedNode={selectedNode || null}
              />

              <AmountInput
                amount={amount}
                setAmount={setAmount}
                balance={balance}
              />

              <PriceInput
                price={price}
                setPrice={setPrice}
                priceType={priceType}
                setPriceType={setPriceType}
                bestBid={bestBid}
                bestAsk={bestAsk}
                fillWarning={fillWarning}
                disableMarket={orderType === 'sell'}
              />

              <Separator />

              <OrderSummary
                amount={amount}
                priceType={priceType}
                effectivePrice={effectivePrice}
                total={orderTotal}
                wheelingCharge={crossZone ? wheelingCharge : 0}
                lossCost={crossZone ? lossCost : 0}
                lossFactor={crossZone ? lossFactor : 0}
              />

              <SubmitButton
                token={token}
                loading={loading}
                orderType={orderType as 'buy' | 'sell'}
                amount={amount}
                total={orderTotal}
                resting={!!fillWarning}
                cryptoLoaded={cryptoLoaded}
                disabled={
                  loading || !amount || parseFloat(amount) <= 0 || sellBlocked
                }
              />

              <FeedbackMessage message={message} isSuccess={false} />
            </form>
          </>
        )}
      </div>
    </div>
  )
})

export default OrderForm
