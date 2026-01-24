'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { Loader2, CheckCircle2, AlertCircle, Calendar, Repeat, ArrowRight, Zap, TrendingUp, TrendingDown } from 'lucide-react'
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
        <Card className="rounded-sm border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="pb-3 pt-4 px-4 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-sm bg-primary/10 text-primary">
                            <Repeat className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-sm font-semibold">DCA Strategy</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-normal h-5 rounded-sm border-primary/20 text-primary bg-primary/5">
                        Automated
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Buy/Sell/Toggle */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-secondary rounded-sm">
                        <button
                            type="button"
                            onClick={() => setSide('buy')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2 rounded-sm text-sm font-medium transition-all duration-300",
                                side === 'buy'
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <TrendingUp size={14} /> Buy
                        </button>
                        <button
                            type="button"
                            onClick={() => setSide('sell')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2 rounded-sm text-sm font-medium transition-all duration-300",
                                side === 'sell'
                                    ? "bg-destructive text-destructive-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <TrendingDown size={14} /> Sell
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-secondary-foreground flex items-center justify-between">
                                <span>Amount per {frequency}</span>
                            </Label>
                            <div className="relative group">
                                <Zap className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-9 h-10 font-mono text-sm bg-secondary/30 border-secondary rounded-sm group-focus-within:border-primary group-focus-within:ring-1 group-focus-within:ring-primary/20 transition-all"
                                />
                                <div className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">
                                    kWh
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-secondary-foreground">Frequency</Label>
                            <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                                <SelectTrigger className="h-10 text-sm bg-secondary/30 border-secondary rounded-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily (24h)</SelectItem>
                                    <SelectItem value="weekly">Weekly (7d)</SelectItem>
                                    <SelectItem value="monthly">Monthly (30d)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Simple Summary */}
                    <div className="rounded-sm bg-primary/5 border border-primary/10 p-3">
                        <h4 className="text-[11px] font-semibold text-primary mb-1 flex items-center gap-1.5">
                            <Repeat className="h-3 w-3" /> Strategy Summary
                        </h4>
                        <div className="text-[11px] text-muted-foreground flex flex-col gap-1">
                            <div className="flex items-baseline gap-1.5">
                                <span className={cn(
                                    "font-bold",
                                    side === 'buy' ? "text-emerald-500" : "text-destructive"
                                )}>
                                    {side === 'buy' ? "Buy" : "Sell"}
                                </span>
                                <span className="font-mono font-medium text-foreground">{amount || "0"} kWh</span>
                                <span>every</span>
                                <span className="font-medium text-foreground capitalize">{frequency}</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className={cn(
                            "w-full h-10 font-semibold shadow-sm transition-all duration-300 rounded-sm",
                            side === 'buy'
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        )}
                        disabled={loading || !token || !amount}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>Start Strategy</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                        )}
                    </Button>

                    {message && (
                        <div className={cn(
                            "flex items-start gap-2.5 rounded-sm p-3 text-xs animate-in fade-in zoom-in-95",
                            isSuccess
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-destructive/10 text-destructive dark:text-destructive-foreground border border-destructive/20"
                        )}>
                            {isSuccess ? (
                                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                            ) : (
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 leading-snug">
                                {message}
                            </div>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
