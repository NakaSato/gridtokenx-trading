'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth/provider'
import { createApiClient } from '@/lib/api-client'
import type { PriceAlert } from '@/types/features'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Loader2,
    Bell,
    BellOff,
    Trash2,
    TrendingUp,
    TrendingDown,
    Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

/**
 * Price-alert manager for the trading positions panel: compact header bar,
 * inline create form, scrollable alert list. All data via the REST API.
 */
export default function PriceAlerts() {
    const { token } = useAuth()
    const [alerts, setAlerts] = useState<PriceAlert[]>([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [newAlert, setNewAlert] = useState({
        symbol: 'GRX',
        target_price: '',
        condition: 'above' as 'above' | 'below',
    })
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchAlerts = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const apiClient = createApiClient(token)
            const response = await apiClient.listPriceAlerts()
            if (response.data) {
                setAlerts(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch price alerts:', error)
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchAlerts()
    }, [fetchAlerts])

    const createAlert = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token || !newAlert.target_price) return
        setActionLoading('create')
        try {
            const apiClient = createApiClient(token)
            const response = await apiClient.createPriceAlert({
                symbol: newAlert.symbol,
                target_price: newAlert.target_price,
                condition: newAlert.condition,
            })
            if (response.data) {
                setAlerts(prev => [response.data as PriceAlert, ...prev])
                setShowForm(false)
                setNewAlert({ symbol: 'GRX', target_price: '', condition: 'above' })
                toast.success('Price alert created')
            } else if (response.error) {
                toast.error(`Failed to create alert: ${response.error}`)
            }
        } catch (error) {
            console.error('Failed to create price alert:', error)
            toast.error('Failed to create alert')
        } finally {
            setActionLoading(null)
        }
    }

    const deleteAlert = async (id: string) => {
        if (!token) return
        setActionLoading(`delete-${id}`)
        try {
            const apiClient = createApiClient(token)
            await apiClient.deletePriceAlert(id)
            setAlerts(prev => prev.filter(a => a.id !== id))
            toast.success('Alert removed')
        } catch (error) {
            console.error('Failed to delete price alert:', error)
            toast.error('Failed to remove alert')
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            {/* Header bar */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-muted/10 px-3 py-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Price Alerts
                    </span>
                    {alerts.length > 0 && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                            {alerts.length}
                        </Badge>
                    )}
                </div>
                {!showForm && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-[10px] text-primary hover:bg-primary/5 hover:text-primary/80"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus size={11} />
                        New Alert
                    </Button>
                )}
            </div>

            {/* Inline create form */}
            {showForm && (
                <form
                    onSubmit={createAlert}
                    className="flex flex-shrink-0 flex-wrap items-end gap-2 border-b border-primary/20 bg-primary/5 px-3 py-2 duration-200 animate-in fade-in slide-in-from-top-1"
                >
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-semibold uppercase text-muted-foreground">
                            Condition
                        </label>
                        <div className="flex h-7 rounded-sm border bg-background p-0.5">
                            <button
                                type="button"
                                className={cn(
                                    'rounded-sm px-2 text-[10px] transition-all',
                                    newAlert.condition === 'above'
                                        ? 'bg-emerald-500 text-white shadow-sm'
                                        : 'hover:bg-muted'
                                )}
                                onClick={() =>
                                    setNewAlert(prev => ({ ...prev, condition: 'above' }))
                                }
                            >
                                Above
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    'rounded-sm px-2 text-[10px] transition-all',
                                    newAlert.condition === 'below'
                                        ? 'bg-destructive text-white shadow-sm'
                                        : 'hover:bg-muted'
                                )}
                                onClick={() =>
                                    setNewAlert(prev => ({ ...prev, condition: 'below' }))
                                }
                            >
                                Below
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-semibold uppercase text-muted-foreground">
                            {newAlert.symbol} target price
                        </label>
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                ฿
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="h-7 w-28 rounded-sm border bg-background pl-5 pr-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="0.00"
                                value={newAlert.target_price}
                                onChange={e =>
                                    setNewAlert(prev => ({
                                        ...prev,
                                        target_price: e.target.value,
                                    }))
                                }
                                autoFocus
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        size="sm"
                        className="h-7 gap-1 px-3 text-[10px]"
                        disabled={actionLoading === 'create' || !newAlert.target_price}
                    >
                        {actionLoading === 'create' ? (
                            <Loader2 size={11} className="animate-spin" />
                        ) : (
                            <Bell size={11} />
                        )}
                        Create
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px]"
                        onClick={() => setShowForm(false)}
                    >
                        Cancel
                    </Button>
                </form>
            )}

            {/* Alert list */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                {loading && alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-6 opacity-60">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">
                            Loading price alerts…
                        </span>
                    </div>
                ) : alerts.length > 0 ? (
                    <div className="divide-y divide-border/50">
                        {alerts.map((alert: PriceAlert) => (
                            <div
                                key={alert.id}
                                className="flex items-center justify-between px-3 py-1.5 transition-colors hover:bg-muted/10"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={cn(
                                            'flex h-6 w-6 items-center justify-center rounded-full',
                                            alert.condition === 'above'
                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                : 'bg-destructive/10 text-destructive'
                                        )}
                                    >
                                        {alert.condition === 'above' ? (
                                            <TrendingUp size={12} />
                                        ) : (
                                            <TrendingDown size={12} />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold">
                                            {alert.symbol}
                                        </span>
                                        <span className="text-[9px] uppercase text-muted-foreground">
                                            {alert.condition === 'above'
                                                ? 'Price crosses above'
                                                : 'Price falls below'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs font-semibold">
                                        ฿
                                        {parseFloat(alert.target_price).toLocaleString(
                                            undefined,
                                            { minimumFractionDigits: 2 }
                                        )}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'h-4 rounded-md border-0 px-1.5 text-[9px] font-normal',
                                            alert.is_active
                                                ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                                                : 'bg-muted text-muted-foreground ring-1 ring-border'
                                        )}
                                    >
                                        {alert.is_active ? 'Active' : 'Triggered'}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Delete alert"
                                        className="h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => deleteAlert(alert.id)}
                                        disabled={actionLoading === `delete-${alert.id}`}
                                    >
                                        {actionLoading === `delete-${alert.id}` ? (
                                            <Loader2 size={11} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={11} />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !showForm ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                            <BellOff className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium">No Alerts Set</p>
                            <p className="text-xs text-muted-foreground">
                                Get notified when tokens reach your target price.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 h-7 gap-1 text-xs"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus size={12} />
                            Set Your First Alert
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
