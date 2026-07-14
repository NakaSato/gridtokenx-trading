'use client'

import React, { useState, useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { useTrading, OrderAccount } from '@/contexts/TradingProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EnergyNode } from '@/components/energy-grid/types'
import { RecurringOrderForm } from '../trading/RecurringOrderForm'
import { useCrypto } from '@/hooks/useCrypto'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { useMarketConfig, useP2PMarketPrices, useP2PBestPrices } from '@/hooks/useApi'
import { P2P_CONFIG } from '@/lib/constants'
import {
  OrderTypeTabs,
  MatchTargetIndicator,
  BalanceDisplay,
  SelectedNodeCard,
  ZoneSelector,
  AmountInput,
  PriceInput,
  OrderSummary,
  SubmitButton,
  FeedbackMessage,
} from './order-form'

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
  const [orderType, setOrderType] = useState<'buy' | 'sell' | 'recurring'>('buy')
  const [priceType, setPriceType] = useState<'market' | 'limit'>('limit')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [buyerZone, setBuyerZone] = useState<number>(0)
  const [sellerZone, setSellerZone] = useState<number>(0)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [targetMatchOrder, setTargetMatchOrder] = useState<OrderAccount | null>(null)
  const { isLoaded: cryptoLoaded } = useCrypto()
  const queryClient = useQueryClient()
  const { marketConfig } = useMarketConfig(token ?? undefined)
  const { marketPrices } = useP2PMarketPrices(token ?? undefined)
  const { bestBid, bestAsk, refetch: refetchBestPrices } = useP2PBestPrices(token ?? undefined)
  const { activeOrderFill, setActiveOrderFill } = useTrading()

  // Best bid/ask move as the book fills — refresh periodically so the spread
  // warning and market-order estimate don't go stale.
  useEffect(() => {
    const interval = setInterval(refetchBestPrices, 10000)
    return () => clearInterval(interval)
  }, [refetchBestPrices])

  const { data: balanceData, isLoading: balanceLoading } = useWalletBalance()
  const rawBalance = balanceData?.token_balance
  const balance = rawBalance != null ? Number(rawBalance) : null

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

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setMessage('')
        setIsSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess])

  const orderMutation = useMutation({
    mutationFn: async (orderPayload: {
      side: 'buy' | 'sell'
      order_type: 'market' | 'limit'
      amount: string
      price_per_kwh?: string
      zone_id: number
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
      })

      if (apiResult.error) {
        throw new Error(apiResult.error)
      }

      return apiResult.data
    },
    onSuccess: () => {
      setMessage(
        'Order placed successfully! The matching engine will find the best counterparty.'
      )
      setIsSuccess(true)
      setAmount('')
      setPrice('')
      setTargetMatchOrder(null)
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['p2p-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orderbook'] })
      onOrderPlaced?.()
    },
    onError: (error) => {
      setMessage(
        error instanceof Error ? error.message : 'Failed to place order'
      )
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Please enter a valid amount')
      return
    }
    if (parseFloat(amount) < 0.1) {
      setMessage('Minimum order amount is 0.1 kWh')
      return
    }
    // Market orders fill against the resting book — no price required. Only limit
    // orders need a price (and are range-checked against market config).
    if (priceType === 'limit') {
      if (!price || parseFloat(price) <= 0) {
        setMessage('Please enter a valid price')
        return
      }

      if (marketConfig) {
        const priceVal = parseFloat(price)
        if (priceVal < marketConfig.min_price_per_kwh) {
          setMessage(`Price cannot be lower than the minimum limit (฿${marketConfig.min_price_per_kwh})`)
          return
        }
        if (priceVal > marketConfig.max_price_per_kwh) {
          setMessage(`Price cannot be higher than the maximum limit (฿${marketConfig.max_price_per_kwh})`)
          return
        }
      }
    }

    if (orderType === 'sell' && balance !== null && parseFloat(amount) > balance) {
      setMessage(`Insufficient balance. You have ${balance.toFixed(2)} GRX available.`)
      return
    }

    const zone_id = orderType === 'buy' ? buyerZone : sellerZone

    orderMutation.mutate({
      side: orderType as 'buy' | 'sell',
      order_type: priceType,
      amount,
      // Limit: the price. Market: omit (a market buy may still carry `price` as a
      // slippage ceiling; sell carries none).
      price_per_kwh: priceType === 'limit' ? price : (price || undefined),
      zone_id,
    })
  }

  const loading = orderMutation.isPending

  const amountNum = parseFloat(amount) || 0
  const priceNum = parseFloat(price) || 0

  // Market orders have no price of their own (the field is disabled) — they
  // sweep the resting book, so estimate against the side they'd actually fill
  // against: a market buy eats asks, a market sell eats bids. Falls back to
  // the typed price only while the book hasn't loaded yet.
  const effectivePrice = priceType === 'market'
    ? (orderType === 'buy' ? bestAsk : bestBid) ?? priceNum
    : priceNum
  const energyCost = amountNum * effectivePrice

  // A limit order priced worse than the current best opposing quote won't
  // fill immediately — it rests on the book until a counterparty crosses it.
  const fillWarning = priceType === 'limit' && priceNum > 0
    ? orderType === 'buy'
      ? (bestAsk !== null && priceNum < bestAsk
        ? `Price below best ask (฿${bestAsk.toFixed(2)}) — this order will rest unfilled until matched, not execute immediately.`
        : null)
      : (bestBid !== null && priceNum > bestBid
        ? `Price above best bid (฿${bestBid.toFixed(2)}) — this order will rest unfilled until matched, not execute immediately.`
        : null)
    : null

  // Wheeling charge + transmission loss for the selected zone pair — sourced
  // from the real market-prices endpoint, not the mocked /api/v1/quotes.
  const crossZone = buyerZone !== sellerZone
  const zoneKey = String(sellerZone)
  const homeZoneKey = String(buyerZone)
  const wheelingChargePerKwh = crossZone
    ? (marketPrices?.wheeling_charges?.[zoneKey] ?? marketPrices?.wheeling_charges?.[homeZoneKey] ?? 0)
    : 0
  const wheelingCharge = wheelingChargePerKwh * amountNum
  const lossFactor = crossZone
    ? (marketPrices?.loss_factors?.[zoneKey] ?? marketPrices?.loss_factors?.[homeZoneKey] ?? P2P_CONFIG.defaultCrossZoneLossFactor)
    : 0
  const lossCost = energyCost * lossFactor
  const orderTotal = energyCost + wheelingCharge + lossCost

  return (
    <div className="flex w-full flex-col space-y-0 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      <OrderTypeTabs
        orderType={orderType}
        setOrderType={setOrderType}
      />

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
                disabled={loading || !amount || parseFloat(amount) <= 0}
              />

              <FeedbackMessage message={message} isSuccess={isSuccess} />
            </form>
          </>
        )}
      </div>
    </div>
  )
})

export default OrderForm
