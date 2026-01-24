'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import type { RecurringOrder } from '@/types/phase3'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Repeat, Play, Pause, Trash2, Calendar, TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function RecurringOrdersList() {
    const { token } = useAuth()
    const [orders, setOrders] = useState<RecurringOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchOrders = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const apiClient = createApiClient(token)
            const response = await apiClient.listRecurringOrders()
            if (response.data) {
                setOrders(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch recurring orders:', error)
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    const handleAction = async (id: string, action: 'cancel' | 'pause' | 'resume') => {
        if (!token) return
        setActionLoading(`${action}-${id}`)
        try {
            const apiClient = createApiClient(token)
            let res;
            if (action === 'cancel') res = await apiClient.cancelRecurringOrder(id)
            else if (action === 'pause') res = await apiClient.pauseRecurringOrder(id)
            else res = await apiClient.resumeRecurringOrder(id)

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(`Order ${action}ed successfully`)
                if (action === 'cancel') {
                    setOrders(prev => prev.filter(o => o.id !== id))
                } else {
                    setOrders(prev => prev.map(o =>
                        o.id === id ? { ...o, status: action === 'pause' ? 'paused' : 'active' } : o
                    ))
                }
            }
        } catch (error) {
            toast.error(`Failed to ${action} order`)
        } finally {
            setActionLoading(null)
        }
    }

    if (loading && orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 opacity-50">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <Loader2 className="h-6 w-6 animate-spin text-primary relative z-10" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Loading strategies...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3 w-3" /> Active Strategies
                </h3>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal bg-secondary rounded-sm">
                    {orders.length} Active
                </Badge>
            </div>

            {orders.length > 0 ? (
                <div className="grid gap-2.5">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="group relative flex flex-col gap-2 p-3 rounded-sm border border-border bg-card hover:border-primary/20 transition-all duration-300 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-sm transition-colors",
                                        order.side === 'buy'
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : "bg-destructive/10 text-destructive"
                                    )}>
                                        {order.side === 'buy' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold tracking-tight">{order.symbol}</span>
                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 uppercase opacity-70 border-primary/20 text-primary rounded-sm">
                                                {order.frequency}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span className={cn(
                                                "font-medium",
                                                order.side === 'buy' ? "text-emerald-500" : "text-destructive"
                                            )}>
                                                {order.side === 'buy' ? 'Buy' : 'Sell'}
                                            </span>
                                            <span className="font-mono font-medium text-foreground">{order.amount} kWh</span>
                                        </div>
                                    </div>
                                </div>

                                <Badge variant="outline" className={cn(
                                    "text-[9px] h-5 px-2 font-medium border-0 ring-1 ring-inset rounded-sm",
                                    order.status === 'active'
                                        ? "bg-emerald-500/5 text-emerald-500 ring-emerald-500/20"
                                        : "bg-amber-500/5 text-amber-500 ring-amber-500/20"
                                )}>
                                    <span className={cn(
                                        "mr-1.5 h-1.5 w-1.5 rounded-full inline-block",
                                        order.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                    )} />
                                    {order.status}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>Last run:</span>
                                    <span className="font-mono text-foreground">
                                        {order.last_run_at ? format(new Date(order.last_run_at), 'MMM dd, HH:mm') : 'Pending'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    {order.status === 'active' ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-sm"
                                            onClick={() => handleAction(order.id, 'pause')}
                                            disabled={!!actionLoading}
                                            title="Pause Strategy"
                                        >
                                            {actionLoading === `pause-${order.id}` ? (
                                                <Loader2 size={10} className="animate-spin" />
                                            ) : (
                                                <Pause size={12} />
                                            )}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-sm"
                                            onClick={() => handleAction(order.id, 'resume')}
                                            disabled={!!actionLoading}
                                            title="Resume Strategy"
                                        >
                                            {actionLoading === `resume-${order.id}` ? (
                                                <Loader2 size={10} className="animate-spin" />
                                            ) : (
                                                <Play size={12} />
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm"
                                        onClick={() => handleAction(order.id, 'cancel')}
                                        disabled={!!actionLoading}
                                        title="Cancel Strategy"
                                    >
                                        {actionLoading === `cancel-${order.id}` ? (
                                            <Loader2 size={10} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={12} />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center border border-dashed border-border rounded-sm bg-muted/5">
                    <div className="p-3 rounded-full bg-primary/5">
                        <Repeat size={20} className="text-primary/50" />
                    </div>
                    <div className="space-y-1 px-4">
                        <p className="text-xs font-semibold">No Active Strategies</p>
                        <p className="text-[10px] text-muted-foreground">
                            Create a DCA strategy above to automate your trading and mitigate volatility.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
