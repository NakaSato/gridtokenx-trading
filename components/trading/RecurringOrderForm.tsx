'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { Loader2, CheckCircle2, AlertCircle, Repeat, ArrowRight, TrendingUp, TrendingDown, Sun, CalendarDays, CalendarRange } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function RecurringOrderForm() {
    const { token } = useAuth()
    const [side, setSide] = useState<'buy' | 'sell'>('buy')
    const [amount, setAmount] = useState('')
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)

    const frequencyConfig = {
        daily: { label: 'Daily', icon: 'Sun', desc: 'Every 24 hours', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        weekly: { label: 'Weekly', icon: 'CalendarDays', desc: 'Every 7 days', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        monthly: { label: 'Monthly', icon: 'CalendarRange', desc: 'Every 30 days', color: 'text-purple-500', bg: 'bg-purple-500/10' }
    }

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
                setMessage(`Successfully started ${frequency} strategy`)
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
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Strategy Type Selector */}
            <div className="flex gap-1 p-1 bg-background rounded-xl border border-border/50 shadow-sm">
                <button
                    type="button"
                    onClick={() => setSide('buy')}
                    className={cn(
                        "relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex-1 justify-center",
                        side === 'buy'
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-[1.02]"
                            : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                    )}
                >
                    <TrendingDown className="h-4 w-4" />
                    <span>Buy</span>
                </button>
                <button
                    type="button"
                    onClick={() => setSide('sell')}
                    className={cn(
                        "relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex-1 justify-center",
                        side === 'sell'
                            ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-[1.02]"
                            : "text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                    )}
                >
                    <TrendingUp className="h-4 w-4" />
                    <span>Sell</span>
                </button>
            </div>

            <div className="space-y-4">
                {/* Amount Input */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center justify-between">
                        <span>Amount per order</span>
                        <span className="text-xs text-muted-foreground">Min: 0.1 kWh</span>
                    </Label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0.01"
                            step="0.01"
                            className={cn(
                                "h-14 rounded-xl border-border bg-muted/30 pr-14 text-right font-mono text-xl font-bold transition-colors duration-200",
                                "placeholder:text-muted-foreground/60",
                                "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
                                amount
                                    ? "text-primary bg-primary/5 border-primary/30"
                                    : "text-foreground bg-muted/30"
                            )}
                        />
                        <span className={cn(
                            "absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold transition-colors duration-200",
                            amount ? "text-primary/70" : "text-muted-foreground"
                        )}>
                            kWh
                        </span>
                    </div>
                </div>

                {/* Frequency */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        Frequency
                    </Label>
                    <div className="flex gap-2">
                        {(Object.keys(frequencyConfig) as Array<keyof typeof frequencyConfig>).map((key) => {
                            const config = frequencyConfig[key]
                            const isActive = frequency === key
                            const Icon = { Sun, CalendarDays, CalendarRange }[config.icon] || Sun
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFrequency(key)}
                                    className={cn(
                                        "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                                        isActive
                                            ? cn("border-primary bg-primary/5 shadow-md shadow-primary/10", config.color)
                                            : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                                        isActive ? config.bg : "bg-muted"
                                    )}>
                                        <Icon className={cn("h-5 w-5", isActive ? config.color : "text-muted-foreground")} />
                                    </div>
                                    <div className="text-center">
                                        <span className={cn(
                                            "block text-sm font-bold transition-colors",
                                            isActive ? "text-foreground" : "text-muted-foreground"
                                        )}>{config.label}</span>
                                        <span className="block text-[10px] text-muted-foreground mt-0.5">{config.desc}</span>
                                    </div>
                                    {isActive && (
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Strategy Summary Card */}
            <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Repeat className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">Strategy Summary</h4>
                        <p className="text-xs text-muted-foreground">Automated recurring orders</p>
                    </div>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Action</span>
                        <span className={cn(
                            "font-semibold",
                            side === 'buy' ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {side === 'buy' ? 'Buy' : 'Sell'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-mono font-semibold text-foreground">{amount || '0'} kWh</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Frequency</span>
                        <span className="font-semibold text-foreground capitalize">{frequencyConfig[frequency].label}</span>
                    </div>
                </div>
            </div>

            <Button
                type="submit"
                size="lg"
                className={cn(
                    "w-full h-14 font-semibold text-base shadow-xl transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 rounded-xl",
                    side === 'buy'
                        ? "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 focus-visible:ring-emerald-500/50"
                        : "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-rose-500/25 hover:from-rose-400 hover:to-rose-500 hover:shadow-rose-500/30 focus-visible:ring-rose-500/50"
                )}
                disabled={loading || !token || !amount}
            >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <div className="flex items-center gap-2">
                        <span>Start {side === 'buy' ? 'Buying' : 'Selling'} Strategy</span>
                        <ArrowRight className="h-4 w-4" />
                    </div>
                )}
            </Button>

            {message && (
                <div className={cn(
                    "flex items-start gap-3 rounded-xl p-4 text-sm",
                    isSuccess
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                        : "border border-rose-500/20 bg-rose-500/10 text-rose-700"
                )}>
                    {isSuccess ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                    ) : (
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
                    )}
                    <span className="leading-relaxed">{message}</span>
                </div>
            )}
        </form>
    )
}
