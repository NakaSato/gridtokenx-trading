'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { Loader2, CheckCircle2, AlertCircle, Calendar, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export function RecurringOrderForm() {
    const { token } = useAuth()
    const [side, setSide] = useState<'buy' | 'sell'>('buy')
    const [amount, setAmount] = useState('')
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return

        setLoading(true)
        setMessage('')
        setIsSuccess(false)

        try {
            const apiClient = createApiClient(token)
            const response = await apiClient.createRecurringOrder({
                symbol: 'GRX',
                side,
                amount,
                frequency,
                start_at: new Date().toISOString()
            })

            if (response.error) {
                setMessage(response.error)
            } else {
                setMessage(`Started ${frequency} DCA for ${amount} GRX`)
                setIsSuccess(true)
                setAmount('')
            }
        } catch (err) {
            setMessage('Failed to schedule recurring order')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 pt-2">
            <div className="flex gap-2 p-1 bg-secondary/50 rounded-sm">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "flex-1 h-8 rounded-sm text-xs",
                        side === 'buy' ? "bg-green-500 text-white shadow-sm" : "text-muted-foreground"
                    )}
                    onClick={() => setSide('buy')}
                >
                    Buy
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "flex-1 h-8 rounded-sm text-xs",
                        side === 'sell' ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground"
                    )}
                    onClick={() => setSide('sell')}
                >
                    Sell
                </Button>
            </div>

            <div className="space-y-2">
                <Label className="text-xs text-secondary-foreground">Amount per interval (kWh)</Label>
                <div className="flex h-10 w-full items-center space-x-2 rounded-sm bg-secondary px-3 py-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-fit border-none bg-transparent p-0 font-mono text-sm shadow-none focus-visible:ring-0"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs text-secondary-foreground">Frequency</Label>
                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                    <SelectTrigger className="h-10 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Every Day</SelectItem>
                        <SelectItem value="weekly">Every Week</SelectItem>
                        <SelectItem value="monthly">Every Month</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-sm bg-primary/5 border border-primary/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">Auto-Schedule DCA</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Recurring orders will execute at the best market price during each interval. Ensure you have enough balance to cover the trades.
                </p>
            </div>

            <Button
                type="submit"
                className="w-full rounded-sm"
                disabled={loading || !token || !amount}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Start ${frequency} DCA`}
            </Button>

            {message && (
                <div className={cn(
                    "flex items-center gap-2 rounded-sm p-3 text-[11px]",
                    isSuccess ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                    {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {message}
                </div>
            )}
        </form>
    )
}
