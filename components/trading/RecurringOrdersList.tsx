'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import type { RecurringOrder } from '@/types/phase3'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Repeat, Play, Pause, Trash2, Calendar } from 'lucide-react'
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
            <div className="flex flex-col items-center justify-center py-10 space-y-2 opacity-50">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Loading DCA strategy...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active DCA Strategies</h3>
            </div>

            {orders.length > 0 ? (
                <div className="grid gap-2">
                    {orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-sm border bg-muted/10 group transition-all hover:bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-full",
                                    order.side === 'buy' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                )}>
                                    <Repeat size={14} className={cn(order.status === 'active' && "animate-spin-slow")} />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold">{order.symbol}</span>
                                        <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase opacity-70">
                                            {order.frequency}
                                        </Badge>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                        {order.side === 'buy' ? 'Buying' : 'Selling'} {order.amount} units per interval
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-muted-foreground uppercase">Last run</span>
                                    <span className="text-[10px] font-mono">
                                        {order.last_run_at ? format(new Date(order.last_run_at), 'MMM dd, HH:mm') : 'Never'}
                                    </span>
                                </div>

                                <Badge variant={order.status === 'active' ? "secondary" : "outline"} className={cn(
                                    "text-[8px] h-4 px-1",
                                    order.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" : ""
                                )}>
                                    {order.status}
                                </Badge>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {order.status === 'active' ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/5"
                                            onClick={() => handleAction(order.id, 'pause')}
                                            disabled={!!actionLoading}
                                        >
                                            <Pause size={12} />
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-green-500 hover:bg-green-500/5"
                                            onClick={() => handleAction(order.id, 'resume')}
                                            disabled={!!actionLoading}
                                        >
                                            <Play size={12} />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/5"
                                        onClick={() => handleAction(order.id, 'cancel')}
                                        disabled={!!actionLoading}
                                    >
                                        <Trash2 size={12} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center border border-dashed rounded-sm bg-muted/5">
                    <div className="p-3 rounded-full bg-muted/10">
                        <Calendar size={24} className="text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">No DCA Strategy</p>
                        <p className="text-xs text-muted-foreground">Automate your trades by setting up a recurring order.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
