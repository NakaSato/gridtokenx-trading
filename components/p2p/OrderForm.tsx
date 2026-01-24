'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { defaultApiClient, createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { Loader2, CheckCircle2, AlertCircle, Wallet, ChevronDown, MapPin, X, Zap, Shield } from 'lucide-react'
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
import P2PCostBreakdown from './P2PCostBreakdown'
import type { EnergyNode } from '@/components/energy-grid/types'
import { RecurringOrderForm } from '../trading/RecurringOrderForm'
import { P2P_CONFIG } from '@/lib/constants'

interface OrderFormProps {
    onOrderPlaced?: () => void
    selectedNode?: EnergyNode | null
    onClearNode?: () => void
}

const OrderForm = React.memo(function OrderForm({ onOrderPlaced, selectedNode, onClearNode }: OrderFormProps) {
    const { token } = useAuth()
    const [orderType, setOrderType] = useState<'buy' | 'sell' | 'recurring'>('buy')
    const [priceType, setPriceType] = useState<'market' | 'limit'>('limit')
    const [amount, setAmount] = useState('')
    const [price, setPrice] = useState('')
    const [buyerZone, setBuyerZone] = useState<number>(0)
    const [sellerZone, setSellerZone] = useState<number>(0)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const [showCostBreakdown, setShowCostBreakdown] = useState(true)
    const [isSigning, setIsSigning] = useState(false)
    const { signOrder, isLoaded: cryptoLoaded } = useCrypto()
    const queryClient = useQueryClient()

    const {
        data: balanceData,
        isLoading: balanceLoading
    } = useWalletBalance()
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
            setAmount((balance * percent / 100).toFixed(2))
        }
    }

    const orderMutation = useMutation({
        mutationFn: async (orderPayload: { side: 'buy' | 'sell', amount: string, price_per_kwh: string }) => {
            if (!token) throw new Error('Please log in to create orders')

            setIsSigning(true)
            const signedOrder = signOrder(orderPayload, token)
            setIsSigning(false)

            defaultApiClient.setToken(token)
            const response = await defaultApiClient.createP2POrder({
                side: signedOrder.side,
                amount: signedOrder.amount,
                price_per_kwh: signedOrder.price_per_kwh,
            })

            if (response.error) throw new Error(response.error)
            return response.data
        },
        onSuccess: () => {
            setMessage('Order placed successfully!')
            setIsSuccess(true)
            setAmount('')
            setPrice('')
            // Invalidate balance and other relevant queries
            queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
            queryClient.invalidateQueries({ queryKey: ['user-stats'] })
            onOrderPlaced?.()
        },
        onError: (error) => {
            setMessage(error instanceof Error ? error.message : 'Failed to place order')
        }
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || parseFloat(amount) <= 0) {
            setMessage('Please enter a valid amount')
            return
        }
        if (!price || parseFloat(price) <= 0) {
            setMessage('Please enter a valid price')
            return
        }

        orderMutation.mutate({
            side: orderType as 'buy' | 'sell',
            amount,
            price_per_kwh: price
        })
    }

    const loading = orderMutation.isPending


    const totalValue = amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : '0.00'
    const energyAmount = parseFloat(amount) || 0
    const agreedPrice = parseFloat(price) || undefined

    return (
        <div className="flex w-full flex-col space-y-0">
            {/* Header - Buy/Sell Tabs */}
            <div className="flex h-[42px] w-full items-center justify-between rounded-sm rounded-b-none border px-4 py-1 border-border bg-card">
                <div className="flex gap-4">
                    <Button
                        className={cn(
                            'h-[42px] w-full rounded-none border-b bg-inherit shadow-none hover:text-primary transition-colors',
                            orderType === 'buy'
                                ? 'border-emerald-500 text-emerald-500 font-medium'
                                : 'border-transparent text-secondary-foreground'
                        )}
                        onClick={() => setOrderType('buy')}
                    >
                        Buy
                    </Button>
                    <Button
                        className={cn(
                            'h-[42px] w-full rounded-none border-b bg-inherit shadow-none hover:text-primary transition-colors',
                            orderType === 'sell'
                                ? 'border-destructive text-destructive font-medium'
                                : 'border-transparent text-secondary-foreground'
                        )}
                        onClick={() => setOrderType('sell')}
                    >
                        Sell
                    </Button>
                    <Button
                        className={cn(
                            'h-[42px] w-full rounded-none border-b bg-inherit shadow-none hover:text-primary transition-colors',
                            orderType === 'recurring'
                                ? 'border-primary text-primary font-medium'
                                : 'border-transparent text-secondary-foreground'
                        )}
                        onClick={() => setOrderType('recurring')}
                    >
                        DCA
                    </Button>
                </div>
                {orderType !== 'recurring' && (
                    <Select
                        defaultValue="limit"
                        onValueChange={(value) => {
                            if (value === 'market' || value === 'limit') {
                                setPriceType(value)
                            }
                        }}
                    >
                        <SelectTrigger className="h-[32px] w-fit gap-2 bg-inherit px-2 text-xs text-secondary-foreground focus:border-primary border-transparent hover:bg-muted/50 rounded-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="market">Market</SelectItem>
                            <SelectItem value="limit">Limit</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Form Content */}
            <div className="flex flex-col rounded-sm rounded-t-none border border-t-0 p-4 bg-card">
                {/* Balance Display */}
                {token && (
                    <div className="flex items-center justify-between pb-4">
                        <span className="text-xs text-secondary-foreground">Available Balance</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <Wallet className="h-3 w-3 text-secondary-foreground" />
                                <span className="font-mono text-sm font-medium">
                                    {balanceLoading ? '...' : (balance?.toFixed(2) || '0.00')} GRX
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <Separator className="mb-4" />

                {orderType === 'recurring' ? (
                    <RecurringOrderForm />
                ) : (
                    <>
                        {/* Selected Node Context */}
                        {selectedNode && (
                            <div className="mb-4 rounded-sm border border-primary/30 bg-primary/5 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium text-foreground">Trading from meter</span>
                                    </div>
                                    {onClearNode && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={onClearNode}
                                            className="h-6 w-6 p-0 text-secondary-foreground hover:text-foreground rounded-sm"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-foreground font-medium truncate">{selectedNode.name}</p>
                                <p className="text-[10px] text-secondary-foreground">
                                    {selectedNode.type} • {selectedNode.capacity}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                            {/* Zone Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col space-y-2">
                                    <Label className="flex items-center gap-1 text-xs text-secondary-foreground">
                                        <MapPin className="h-3 w-3" />
                                        {orderType === 'buy' ? 'Your Zone' : 'Seller Zone'}
                                    </Label>
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
                                        <SelectTrigger className="h-9 text-xs rounded-sm">
                                            <SelectValue placeholder="Select zone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {zones.map((zone) => (
                                                <SelectItem key={zone.id} value={String(zone.id)}>
                                                    {zone.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <Label className="flex items-center gap-1 text-xs text-secondary-foreground">
                                        <MapPin className="h-3 w-3" />
                                        {orderType === 'buy' ? 'Seller Zone' : 'Your Zone'}
                                    </Label>
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
                                        <SelectTrigger className="h-9 text-xs rounded-sm">
                                            <SelectValue placeholder="Select zone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {zones.map((zone) => (
                                                <SelectItem key={zone.id} value={String(zone.id)}>
                                                    {zone.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-secondary-foreground">Amount (kWh)</Label>
                                </div>
                                <div className="flex h-fit w-full items-center space-x-2 rounded-sm bg-secondary px-3 py-2">
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min="0.01"
                                        step="0.01"
                                        className="h-fit border-none bg-transparent p-0 font-mono text-foreground shadow-none placeholder:text-secondary-foreground focus-visible:ring-0"
                                    />
                                    <span className="text-xs text-secondary-foreground">kWh</span>
                                </div>
                                {/* Quick Amount Buttons */}
                                <div className="flex gap-1">
                                    {P2P_CONFIG.quickAmountPercentages.map((percent) => (
                                        <Button
                                            key={percent}
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleQuickAmount(percent)}
                                            className="h-6 flex-1 text-xs text-secondary-foreground hover:text-primary rounded-sm"
                                        >
                                            {percent}%
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Input */}
                            <div className="flex flex-col space-y-2">
                                <Label className="text-xs text-secondary-foreground">Price per kWh (THB)</Label>
                                <div className="flex h-fit w-full items-center space-x-2 rounded-sm bg-secondary px-3 py-2">
                                    <Input
                                        type="number"
                                        placeholder="4.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        min="0.01"
                                        step="0.01"
                                        disabled={priceType === 'market'}
                                        className="h-fit border-none bg-transparent p-0 font-mono text-foreground shadow-none placeholder:text-secondary-foreground focus-visible:ring-0"
                                    />
                                    <span className="text-xs text-secondary-foreground">THB</span>
                                </div>
                            </div>

                            {/* P2P Cost Breakdown Toggle */}
                            {energyAmount > 0 && (
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-secondary-foreground">Show Cost Breakdown</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                                        className="h-6 text-xs rounded-sm"
                                    >
                                        {showCostBreakdown ? 'Hide' : 'Show'}
                                    </Button>
                                </div>
                            )}

                            {/* P2P Cost Breakdown Component */}
                            {showCostBreakdown && energyAmount > 0 && (
                                <P2PCostBreakdown
                                    buyerZone={buyerZone}
                                    sellerZone={sellerZone}
                                    energyAmount={energyAmount}
                                    agreedPrice={agreedPrice}
                                />
                            )}

                            <Separator />

                            {/* Total Display */}
                            <div className="flex items-center justify-between py-2">
                                <span className="text-xs text-secondary-foreground">Base Total</span>
                                <span className="font-mono text-lg font-medium text-foreground">
                                    ฿{totalValue}
                                </span>
                            </div>

                            {/* Submit Button or Connect Wallet */}
                            {!token ? (
                                <div className="rounded-sm bg-secondary p-3 text-center text-xs text-secondary-foreground">
                                    Connect wallet to place orders
                                </div>
                            ) : (
                                <Button
                                    type="submit"
                                    className={cn(
                                        'h-[42px] w-full rounded-sm font-medium transition-all shadow-sm',
                                        orderType === 'buy'
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                            : 'bg-destructive hover:bg-destructive/90 text-white shadow-destructive/20'
                                    )}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {isSigning ? 'Signing...' : 'Processing...'}
                                        </>
                                    ) : (
                                        <>
                                            {cryptoLoaded && <Shield className="mr-2 h-4 w-4" />}
                                            {`${orderType === 'buy' ? 'Buy' : 'Sell'} ${amount || '0'} kWh`}
                                        </>
                                    )}
                                </Button>
                            )}

                            {/* Feedback Message */}
                            {message && (
                                <div className={cn(
                                    'flex items-center gap-2 rounded-sm p-3 text-xs',
                                    isSuccess
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-destructive/10 text-destructive'
                                )}>
                                    {isSuccess ? (
                                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    )}
                                    {message}
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
