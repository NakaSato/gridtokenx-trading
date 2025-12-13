
'use client'

import { useState } from 'react'
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

export default function OrderForm() {
    const [orderType, setOrderType] = useState('Buy')
    const [amount, setAmount] = useState('')
    const [price, setPrice] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            // defaultApiClient.setToken(userToken)

            const response = await defaultApiClient.createP2POrder({
                side: orderType as 'Buy' | 'Sell',
                amount: amount,
                price_per_kwh: price,
            })

            if (response.error) {
                setMessage(`Error: ${response.error}`)
            } else {
                setMessage('Order created successfully!')
                setAmount('')
                setPrice('')
            }
        } catch (error: any) {
            setMessage(`Failed: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Place Order</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Order Type</Label>
                        <Select value={orderType} onValueChange={setOrderType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Buy">Buy Energy</SelectItem>
                                <SelectItem value="Sell">Sell Energy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Amount (kWh)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Price per bit (Tokens)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                        variant={orderType === 'Buy' ? 'default' : 'destructive'}
                    >
                        {loading ? 'Processing...' : `${orderType} Energy`}
                    </Button>

                    {message && (
                        <div className={`text-sm ${message.includes('Error') || message.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
                            {message}
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
