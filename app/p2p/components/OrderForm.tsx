
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { defaultApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { Loader2, CheckCircle2, AlertCircle, Zap, Wallet } from 'lucide-react'

export default function OrderForm() {
    const { token } = useAuth()
    const [orderType, setOrderType] = useState('Buy')
    const [amount, setAmount] = useState('')
    const [price, setPrice] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const [balance, setBalance] = useState<number | null>(null)
    const [balanceLoading, setBalanceLoading] = useState(false)

    // Fetch token balance
    const fetchBalance = useCallback(async () => {
        if (!token) return
        setBalanceLoading(true)
        try {
            const response = await fetch('http://localhost:4000/api/v1/trading/balance', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
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

    // Fetch balance on mount and when token changes
    useEffect(() => {
        fetchBalance()
    }, [fetchBalance])

    // Auto-clear success message after 5 seconds
    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                setMessage('')
                setIsSuccess(false)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [isSuccess])


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
            defaultApiClient.setToken(token)

            const response = await defaultApiClient.createP2POrder({
                side: orderType as 'Buy' | 'Sell',
                amount: amount,
                price_per_kwh: price,
            })

            if (response.error) {
                setMessage(response.error)
            } else {
                setMessage(`${orderType} order placed successfully!`)
                setIsSuccess(true)
                setAmount('')
                setPrice('')
                // Refresh balance after order
                fetchBalance()
            }
        } catch (error: any) {
            setMessage(error.message || 'Failed to place order')
        } finally {
            setLoading(false)
        }
    }

    const totalValue = amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : '0.00'

    return (
        <Card className="overflow-hidden">
            <CardHeader className={`${orderType === 'Buy' ? 'bg-green-50 border-b border-green-100' : 'bg-red-50 border-b border-red-100'}`}>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Zap className={`h-5 w-5 ${orderType === 'Buy' ? 'text-green-600' : 'text-red-600'}`} />
                        Place Order
                    </CardTitle>
                    {token && (
                        <div className="flex items-center gap-1.5 text-sm bg-white/80 px-3 py-1 rounded-full border">
                            <Wallet className="h-4 w-4 text-blue-500" />
                            <span className="text-muted-foreground">Balance:</span>
                            <span className="font-semibold">
                                {balanceLoading ? '...' : (balance !== null ? balance.toFixed(2) : '-')}
                            </span>
                            <span className="text-muted-foreground">GRID</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Order Type</Label>
                        <Select value={orderType} onValueChange={setOrderType}>
                            <SelectTrigger className={orderType === 'Buy' ? 'border-green-300' : 'border-red-300'}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Buy">🟢 Buy Energy</SelectItem>
                                <SelectItem value="Sell">🔴 Sell Energy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Amount (kWh)</Label>
                        <Input
                            type="number"
                            placeholder="e.g. 100"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0.01"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Price per kWh (Tokens)</Label>
                        <Input
                            type="number"
                            placeholder="e.g. 5.00"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min="0.01"
                            step="0.01"
                            required
                        />
                    </div>

                    {/* Total Value Display */}
                    {amount && price && (
                        <div className={`p-3 rounded-lg ${orderType === 'Buy' ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total {orderType === 'Buy' ? 'Cost' : 'Value'}:</span>
                                <span className="font-semibold">{totalValue} Tokens</span>
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className={`w-full ${orderType === 'Buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        disabled={loading || !token}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            `${orderType} ${amount || '0'} kWh`
                        )}
                    </Button>

                    {!token && (
                        <p className="text-sm text-muted-foreground text-center">
                            Please connect to place orders
                        </p>
                    )}

                    {message && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${isSuccess
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {isSuccess ? (
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            )}
                            {message}
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
