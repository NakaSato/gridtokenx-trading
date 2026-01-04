'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { defaultApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { Loader2, CheckCircle2, AlertCircle, Wallet, ChevronDown, MapPin, X, Zap, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCrypto } from '@/hooks/useCrypto'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import P2PCostBreakdown from './P2PCostBreakdown'
import type { EnergyNode } from '@/components/energy-grid/types'

interface OrderFormProps {
    onOrderPlaced?: () => void
    selectedNode?: EnergyNode | null
    onClearNode?: () => void
}

export default function OrderForm({ onOrderPlaced, selectedNode, onClearNode }: OrderFormProps) {
    const { token } = useAuth()
    const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')
    const [priceType, setPriceType] = useState<'market' | 'limit'>('limit')
    const [amount, setAmount] = useState('')
    const [price, setPrice] = useState('')
    const [buyerZone, setBuyerZone] = useState<number>(0)
    const [sellerZone, setSellerZone] = useState<number>(0)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const [balance, setBalance] = useState<number | null>(null)
    const [balanceLoading, setBalanceLoading] = useState(false)
    const [showCostBreakdown, setShowCostBreakdown] = useState(true)
    const [isSigning, setIsSigning] = useState(false)
    const { signOrder, isLoaded: cryptoLoaded } = useCrypto()

    // Pre-fill amount when a node is selected from the map
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
        }
    }, [selectedNode])

    // Available zones (could be fetched from API)
    const zones = [
        { id: 0, name: 'Zone A - Residential' },
        { id: 1, name: 'Zone B - Commercial' },
        { id: 2, name: 'Zone C - Industrial' },
        { id: 3, name: 'Zone D - Mixed Use' },
    ]

    const fetchBalance = useCallback(async () => {
        if (!token) return
        setBalanceLoading(true)
        try {
            const response = await fetch('http://localhost:4000/api/v1/trading/balance', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setBalance(data.token_balance)
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error)
        } finally {
            setBalanceLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchBalance()
    }, [fetchBalance])

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        setIsSuccess(false)

        if (!token) {
            setMessage('Please log in to create orders')
            setLoading(false)
            return
        }

        if (!amount || parseFloat(amount) <= 0) {
            setMessage('Please enter a valid amount')
            setLoading(false)
            return
        }

        if (!price || parseFloat(price) <= 0) {
            setMessage('Please enter a valid price')
            setLoading(false)
            return
        }

        try {
            // Sign the order before submitting
            setIsSigning(true)
            const orderPayload = {
                side: orderType,  // Already typed as 'buy' | 'sell'
                amount: amount,
                price_per_kwh: price,
            }

            // Use wallet address or token as secret key
            const secretKey = 'test_secret_key'
            const signedOrder = signOrder(orderPayload, secretKey)
            setIsSigning(false)

            defaultApiClient.setToken(token)
            const response = await defaultApiClient.createP2POrder({
                side: signedOrder.side,
                amount: signedOrder.amount,
                price_per_kwh: signedOrder.price_per_kwh,
                // Include signature in the request (API would validate)
                // signature: signedOrder.signature,
                // timestamp: signedOrder.timestamp,
            })

            if (response.error) {
                setMessage(response.error)
            } else {
                setMessage(`Order placed successfully!`)
                setIsSuccess(true)
                setAmount('')
                setPrice('')
                fetchBalance()
                onOrderPlaced?.()
            }
        } catch (error: any) {
            setMessage(error.message || 'Failed to place order')
        } finally {
            setLoading(false)
        }
    }

    const totalValue = amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : '0.00'
    const energyAmount = parseFloat(amount) || 0
    const agreedPrice = parseFloat(price) || undefined

    return (
        <div className="flex h-full w-full flex-col space-y-0">
            {/* Header - Buy/Sell Tabs */}
            <div className="flex h-[42px] w-full items-center justify-between rounded-sm rounded-b-none border px-4 py-1">
                <div className="flex gap-4">
                    <Button
                        className={cn(
                            'h-[42px] w-full rounded-none border-b bg-inherit shadow-none hover:text-primary',
                            orderType === 'buy'
                                ? 'border-green-500 text-green-500'
                                : 'border-transparent text-secondary-foreground'
                        )}
                        onClick={() => setOrderType('buy')}
                    >
                        Buy Option
                    </Button>
                    <Button
                        className={cn(
                            'h-[42px] w-full rounded-none border-b bg-inherit shadow-none hover:text-primary',
                            orderType === 'sell'
                                ? 'border-red-500 text-red-500'
                                : 'border-transparent text-secondary-foreground'
                        )}
                        onClick={() => setOrderType('sell')}
                    >
                        Sell
                    </Button>
                </div>
                <Select
                    defaultValue="limit"
                    onValueChange={(value) => {
                        if (value === 'market' || value === 'limit') {
                            setPriceType(value)
                        }
                    }}
                >
                    <SelectTrigger className="h-[42px] w-fit gap-3 bg-inherit px-3 text-secondary-foreground focus:border-primary">
                        <SelectValue />
                        <ChevronDown size={12} />
                    </SelectTrigger>
                    <SelectContent align="end">
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="limit">Limit</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Form Content */}
            <div className="flex flex-col rounded-sm rounded-t-none border border-t-0 p-4">
                {/* Balance Display */}
                {token && (
                    <div className="flex items-center justify-between pb-4">
                        <span className="text-xs text-secondary-foreground">Available Balance</span>
                        <div className="flex items-center gap-1">
                            <Wallet className="h-3 w-3 text-secondary-foreground" />
                            <span className="font-mono text-sm font-medium">
                                {balanceLoading ? '...' : (balance?.toFixed(2) || '0.00')} GRX
                            </span>
                        </div>
                    </div>
                )}

                <Separator className="mb-4" />

                {/* Selected Node Context */}
                {selectedNode && (
                    <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
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
                                    className="h-6 w-6 p-0 text-secondary-foreground hover:text-foreground"
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
                                <SelectTrigger className="h-9 text-xs">
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
                                <SelectTrigger className="h-9 text-xs">
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
                            {[25, 50, 75, 100].map((percent) => (
                                <Button
                                    key={percent}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleQuickAmount(percent)}
                                    className="h-6 flex-1 text-xs text-secondary-foreground hover:text-primary"
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
                                className="h-6 text-xs"
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

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className={cn(
                            'h-[42px] w-full rounded-sm font-medium',
                            orderType === 'buy'
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-red-500 text-white hover:bg-red-600'
                        )}
                        disabled={loading || !token}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isSigning ? 'Signing...' : 'Processing...'}
                            </>
                        ) : (
                            <>
                                {cryptoLoaded && <Shield className="mr-2 h-4 w-4" />}
                                {`${orderType === 'buy' ? 'Buy Option' : 'Sell'} ${amount || '0'} kWh`}
                            </>
                        )}
                    </Button>

                    {!token && (
                        <div className="rounded-sm bg-secondary p-3 text-center text-xs text-secondary-foreground">
                            Connect wallet to place orders
                        </div>
                    )}

                    {/* Feedback Message */}
                    {message && (
                        <div className={cn(
                            'flex items-center gap-2 rounded-sm p-3 text-xs',
                            isSuccess
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-red-500/10 text-red-500'
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
            </div>
        </div>
    )
}

