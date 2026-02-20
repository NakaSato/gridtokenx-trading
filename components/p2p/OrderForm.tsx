'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { defaultApiClient, createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { useTrading, OrderAccount } from '@/contexts/TradingProvider'
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wallet,
  ChevronDown,
  MapPin,
  X,
  ArrowRightLeft,
  ChevronRight,
  Info,
  Link,
  Shield,
  Wallet2,
  Zap,
  TrendingUp,
  TrendingDown,
  BatteryCharging,
  Battery,
  Repeat,
} from 'lucide-react'
import { PublicKey } from '@solana/web3.js'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { useCrypto } from '@/hooks/useCrypto'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import P2PCostBreakdown from './P2PCostBreakdown'
import OrderBookDepth from './OrderBookDepth'
import type { EnergyNode } from '@/components/energy-grid/types'
import { RecurringOrderForm } from '../trading/RecurringOrderForm'
import { P2P_CONFIG } from '@/lib/constants'

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
  const [isSuccess, setIsSuccess] = useState(false)
  const [showCostBreakdown, setShowCostBreakdown] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [targetMatchOrder, setTargetMatchOrder] = useState<OrderAccount | null>(
    null
  )
  const [currency, setCurrency] = useState<'GRX' | 'USDC'>('GRX')
  const [isConfidential, setIsConfidential] = useState(false)
  const { signOrder, isLoaded: cryptoLoaded } = useCrypto()
  const queryClient = useQueryClient()
  const {
    createBuyOrder,
    createSellOrder,
    createStablecoinBuyOrder,
    createStablecoinSellOrder,
    activeOrderFill,
    setActiveOrderFill,
  } = useTrading()

  // Consume activeOrderFill if present
  useEffect(() => {
    if (activeOrderFill) {
      // Determine side based on target order
      // If target is a Sell Order (has seller), we want to BUY.
      // If target is a Buy Order (has buyer), we want to SELL.
      let side: 'buy' | 'sell' = 'buy'

      if (activeOrderFill.targetOrder) {
        const target = activeOrderFill.targetOrder
        // Simple check: default Pubkey check
        const isSellerSet =
          target.account.seller.toString() !==
          '11111111111111111111111111111111'
        if (isSellerSet) {
          side = 'buy' // Target is selling, we buy
        } else {
          side = 'sell' // Target is buying, we sell
        }
        setTargetMatchOrder(target)
      }

      setOrderType(side)
      setAmount(activeOrderFill.amount.toFixed(2))
      if (activeOrderFill.price) {
        setPrice(activeOrderFill.price.toFixed(2))
      }
      // Clear it so it doesn't persist if user changes manually
      setActiveOrderFill(null)
    }
  }, [activeOrderFill, setActiveOrderFill])

  const { data: balanceData, isLoading: balanceLoading } = useWalletBalance()
  const rawBalance = balanceData?.token_balance
  const balance = rawBalance != null ? Number(rawBalance) : null

  // Pre-fill amount and zone when a node is selected from the map
  useEffect(() => {
    if (selectedNode) {
      // Set order type based on node's energy state
      if (selectedNode.surplusEnergy && selectedNode.surplusEnergy > 0) {
        setOrderType('sell')
        setAmount(selectedNode.surplusEnergy.toFixed(2))
      } else if (selectedNode.deficitEnergy && selectedNode.deficitEnergy > 0) {
        setOrderType('buy')
        setAmount(selectedNode.deficitEnergy.toFixed(2))
      }

      // Sync Zone ID from map selection (ensures 1-indexed consistency)
      if (selectedNode.zoneId) {
        if (orderType === 'buy') {
          setBuyerZone(selectedNode.zoneId)
          // Default seller to same zone for minimum fees if not set
          if (sellerZone === 0) setSellerZone(selectedNode.zoneId)
        } else if (orderType === 'sell') {
          setSellerZone(selectedNode.zoneId)
          // Default buyer to same zone for minimum fees if not set
          if (buyerZone === 0) setBuyerZone(selectedNode.zoneId)
        }
      }
    }
  }, [selectedNode]) // Removed orderType from deps to avoid re-runs on type change

  // Use zones from centralized config
  const { zones } = P2P_CONFIG

  // fetchBalance logic removed in favor of useWalletBalance

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setMessage('')
        setIsSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess])

  const handleQuickAmount = (percent: number) => {
    if (balance && balance > 0) {
      setAmount(((balance * percent) / 100).toFixed(2))
    }
  }

  const orderMutation = useMutation({
    mutationFn: async (orderPayload: {
      side: 'buy' | 'sell'
      amount: string
      price_per_kwh: string
      zone_id: number
    }) => {
      if (!token) throw new Error('Please log in to create orders')

      // 1. Register order with the backend API for matching engine + settlement
      const apiClient = createApiClient(token)
      const apiResult = await apiClient.createP2POrder({
        side: orderPayload.side,
        amount: orderPayload.amount,
        price_per_kwh: orderPayload.price_per_kwh,
        zone_id: orderPayload.zone_id || undefined,
      })

      if (apiResult.error) {
        throw new Error(apiResult.error)
      }

      // 2. Also submit on-chain for transparent order book (best-effort)
      try {
        const amountValue = parseFloat(orderPayload.amount) * 1e6
        const priceValue = parseFloat(orderPayload.price_per_kwh) * 1e6

        if (currency === 'USDC') {
          // Constant 0 for USDC in this demo
          if (orderPayload.side === 'buy') {
            await createStablecoinBuyOrder(amountValue, priceValue, 0)
          } else {
            await createStablecoinSellOrder(amountValue, priceValue, 0)
          }
        } else if (orderPayload.side === 'buy') {
          await createBuyOrder(
            amountValue,
            priceValue,
            targetMatchOrder || undefined
          )
        } else {
          await createSellOrder(
            amountValue,
            priceValue,
            targetMatchOrder || undefined
          )
        }
      } catch (onChainError) {
        // On-chain submission is best-effort — backend handles matching/settlement
        console.warn(
          'On-chain order submission failed (backend order is active):',
          onChainError
        )
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
      // Invalidate balance and other relevant queries
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
    if (!price || parseFloat(price) <= 0) {
      setMessage('Please enter a valid price')
      return
    }

    // Balance pre-check for sell orders
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

    orderMutation.mutate({
      side: orderType as 'buy' | 'sell',
      amount,
      price_per_kwh: price,
      zone_id,
    })
  }

  const loading = orderMutation.isPending

  const totalValue =
    amount && price
      ? (parseFloat(amount) * parseFloat(price)).toFixed(2)
      : '0.00'
  const energyAmount = parseFloat(amount) || 0
  const agreedPrice = parseFloat(price) || undefined

  return (
    <div className="flex w-full flex-col space-y-0 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      {/* Header - Buy/Sell/DCA System UI Tabs */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex p-0.5 bg-muted rounded-md">
          {/* Buy Tab */}
          <button
            type="button"
            onClick={() => setOrderType('buy')}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-150',
              orderType === 'buy'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10'
            )}
          >
            <BatteryCharging className="h-3.5 w-3.5" />
            <span>Buy</span>
          </button>

          {/* Sell Tab */}
          <button
            type="button"
            onClick={() => setOrderType('sell')}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-150',
              orderType === 'sell'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10'
            )}
          >
            <Battery className="h-3.5 w-3.5" />
            <span>Sell</span>
          </button>

          {/* DCA Tab */}
          <button
            type="button"
            onClick={() => setOrderType('recurring')}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-150',
              orderType === 'recurring'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10'
            )}
          >
            <Repeat className="h-3.5 w-3.5" />
            <span>DCA</span>
          </button>
        </div>
        {orderType !== 'recurring' && (
          <div className="flex p-0.5 bg-background rounded-md border border-border">
            <button
              type="button"
              onClick={() => setPriceType('market')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-medium rounded-sm transition-all',
                priceType === 'market'
                  ? 'bg-muted text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => setPriceType('limit')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-medium rounded-sm transition-all',
                priceType === 'limit'
                  ? 'bg-muted text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              Limit
            </button>
          </div>
        )}
      </div>

      {/* Form Content */}
      <div className="flex flex-col space-y-4 p-4">
        {/* Match Target Indicator - Design System */}
        {targetMatchOrder && (
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Link className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Matching Order</span>
                <span className="text-xs text-muted-foreground font-mono">
                  #{targetMatchOrder.publicKey.toString().slice(0, 8)}...
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0 hover:bg-rose-500/10 hover:text-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/50"
              onClick={() => setTargetMatchOrder(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Balance Display - Design System Card */}
        {token && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Wallet2 className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Available Balance
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-semibold text-foreground">
                {balanceLoading ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ...
                  </span>
                ) : (
                  balance?.toFixed(2) || '0.00'
                )}
              </span>
              <span className="text-sm font-medium text-muted-foreground">GRX</span>
            </div>
          </div>
        )}

        {orderType === 'recurring' ? (
          <RecurringOrderForm />
        ) : (
          <>
            {/* Selected Node Context - Design System Card */}
            {selectedNode && (
              <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {selectedNode.name}
                    </span>
                  </div>
                  {onClearNode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onClearNode}
                      className="h-7 w-7 rounded-full p-0 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted px-2 py-1 font-medium">{selectedNode.type}</span>
                  <span>•</span>
                  <span>{selectedNode.capacity}</span>
                  {selectedNode.zoneId && (
                    <>
                      <span>•</span>
                      <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">Zone {selectedNode.zoneId}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              {/* Zone Selection - Design System Visual Flow */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                    </div>
                    Zone Routing
                  </Label>
                  <div className="flex items-center gap-2">
                    {/* Auto-Select Zone Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedNode?.zoneId) {
                          // Use zone from selected meter node
                          if (orderType === 'buy') {
                            setBuyerZone(selectedNode.zoneId)
                            setSellerZone(selectedNode.zoneId)
                          } else {
                            setSellerZone(selectedNode.zoneId)
                            setBuyerZone(selectedNode.zoneId)
                          }
                          toast.success(`Zones set to ${zones.find(z => z.id === selectedNode.zoneId)?.name || 'Zone ' + selectedNode.zoneId}`)
                        } else {
                          // Default to zone 1 if no node selected
                          if (orderType === 'buy') {
                            setBuyerZone(1)
                            setSellerZone(1)
                          } else {
                            setSellerZone(1)
                            setBuyerZone(1)
                          }
                          toast.success('Zones set to ' + (zones.find(z => z.id === 1)?.name || 'Zone 1'))
                        }
                      }}
                      className="h-7 px-2.5 rounded-lg text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                      Auto-Select
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/50">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[240px] text-sm">
                          <p>Select your zone and the counterparty zone. Different zones may incur transfer fees. Use Auto-Select to use your meter's zone.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Your Zone Card - Small */}
                  <div className="flex-1">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {orderType === 'buy' ? 'Your Zone' : 'Buyer Zone'}
                    </span>
                    <Select
                      value={String(orderType === 'buy' ? buyerZone : sellerZone)}
                      onValueChange={(value) => {
                        const zoneId = parseInt(value)
                        if (orderType === 'buy') {
                          setBuyerZone(zoneId)
                        } else {
                          setSellerZone(zoneId)
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-border bg-muted/50 text-xs font-medium transition-all hover:bg-muted focus:ring-1 focus:ring-primary/50">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={String(zone.id)} className="text-xs rounded-md">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                                {zone.id}
                              </span>
                              <span className="font-medium">{zone.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Arrow Connector - Small */}
                  <div className="flex flex-col items-center pt-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shadow-sm">
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Counterparty Zone Card - Small */}
                  <div className="flex-1">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {orderType === 'buy' ? 'Seller Zone' : 'Your Zone'}
                    </span>
                    <Select
                      value={String(orderType === 'buy' ? sellerZone : buyerZone)}
                      onValueChange={(value) => {
                        const zoneId = parseInt(value)
                        if (orderType === 'buy') {
                          setSellerZone(zoneId)
                        } else {
                          setBuyerZone(zoneId)
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-border bg-muted/50 text-xs font-medium transition-all hover:bg-muted focus:ring-1 focus:ring-primary/50">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={String(zone.id)} className="text-xs rounded-md">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                                {zone.id}
                              </span>
                              <span className="font-medium">{zone.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Amount Input - Design System */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">
                    Amount
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Min: 0.1 kWh
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="h-14 rounded-xl border-border bg-muted/30 pr-14 text-right font-mono text-xl font-semibold text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    kWh
                  </span>
                </div>
                {/* Quick Amount Pills - Design System */}
                <div className="flex gap-2">
                  {P2P_CONFIG.quickAmountPercentages.map((percent) => (
                    <Button
                      key={percent}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(percent)}
                      className="h-8 flex-1 rounded-lg border-border bg-transparent text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Input - Design System */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">
                    Price per kWh
                  </Label>
                  {priceType === 'market' && (
                    <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600">
                      Market Price
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="4.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0.01"
                    step="0.01"
                    disabled={priceType === 'market'}
                    className={cn(
                      "h-14 rounded-xl border-border bg-muted/30 pr-16 text-right font-mono text-xl font-semibold text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
                      priceType === 'market' && "cursor-not-allowed bg-muted/50 text-muted-foreground"
                    )}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    THB
                  </span>
                </div>
                {priceType === 'limit' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Spread: 4.20 - 4.80 THB
                  </p>
                )}
              </div>

              {/* Cost Breakdown - Design System Accordion */}
              {energyAmount > 0 && (
                <Accordion type="single" collapsible defaultValue={showCostBreakdown ? "breakdown" : undefined}>
                  <AccordionItem value="breakdown" className="border-0">
                    <AccordionTrigger
                      onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                      className="flex h-12 items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-0 text-sm font-semibold text-foreground hover:bg-muted hover:text-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-xl"
                    >
                      <span>Cost Breakdown</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-foreground">฿{totalValue}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-3">
                      <div className="rounded-xl border border-border bg-muted/20 p-4">
                        <P2PCostBreakdown
                          buyerZone={buyerZone}
                          sellerZone={sellerZone}
                          energyAmount={energyAmount}
                          agreedPrice={agreedPrice}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Market Depth Preview - System Design Informed */}
              {token && energyAmount > 0 && (
                <OrderBookDepth
                  side={orderType as 'buy' | 'sell'}
                  amount={energyAmount}
                  currentPrice={agreedPrice}
                />
              )}

              <Separator />

              {/* Order Summary - Design System Card */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Amount</span>
                  <span className="font-mono font-semibold">{amount || '0'} kWh</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Price</span>
                  <span className="font-mono font-semibold">฿{price || '0'}/kWh</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-foreground">Total</span>
                  <span className="font-mono text-2xl font-bold text-foreground">
                    ฿{totalValue}
                  </span>
                </div>
              </div>

              {/* Submit Button - Design System */}
              {!token ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/10 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Wallet2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Connect your wallet to start trading energy
                  </span>
                </div>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  className={cn(
                    'h-14 w-full rounded-xl font-semibold text-base shadow-xl transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2',
                    orderType === 'buy'
                      ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 focus-visible:ring-emerald-500/50'
                      : 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-rose-500/25 hover:from-rose-400 hover:to-rose-500 hover:shadow-rose-500/30 focus-visible:ring-rose-500/50'
                  )}
                  disabled={loading || !amount || parseFloat(amount) <= 0}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{isSigning ? 'Signing Transaction...' : 'Processing...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {cryptoLoaded && <Shield className="h-5 w-5" />}
                      <span>
                        {orderType === 'buy' ? 'Buy' : 'Sell'} {amount || '0'} kWh
                      </span>
                      {amount && price && (
                        <span className="ml-1 text-white/80 font-mono">
                          · ฿{totalValue}
                        </span>
                      )}
                    </div>
                  )}
                </Button>
              )}

              {/* Feedback Message - Design System */}
              {message && (
                <div
                  className={cn(
                    'flex items-start gap-3 rounded-xl p-4 text-sm',
                    isSuccess
                      ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
                      : 'border border-rose-500/20 bg-rose-500/10 text-rose-700'
                  )}
                >
                  {isSuccess ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
                  )}
                  <span className="leading-relaxed">{message}</span>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  )
})

export default OrderForm
