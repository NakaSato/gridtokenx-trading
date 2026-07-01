'use client'

import { useState, useMemo, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { Loader2, CheckCircle2, AlertCircle, Repeat, ArrowRight, TrendingUp, TrendingDown, Clock, Sun, CalendarDays, CalendarRange, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IntervalType } from '@/types/features'
import { P2PCostBreakdown } from './P2PCostBreakdown'
import { useMeters } from '@/hooks/useApi'

export function RecurringOrderForm() {
    const { token } = useAuth()
    const [side, setSide] = useState<'buy' | 'sell'>('buy')
    const [amount, setAmount] = useState('')
    const [priceLimit, setPriceLimit] = useState('')
    const [intervalType, setIntervalType] = useState<IntervalType>('daily')
    const [intervalValue, setIntervalValue] = useState('1')
    const [maxExecutions, setMaxExecutions] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const { meters } = useMeters(token ?? undefined)
    const [sellerZoneId, setSellerZoneId] = useState(1)

    // Quick amount presets (kWh)
    const amountPresets = ['10', '50', '100', '500']

    const buyerZoneId = useMemo(() => {
        const m = meters as any[] | null
        return m?.[0]?.zone_id || 1
    }, [meters])

    const frequencyConfig: Record<IntervalType, { label: string; icon: keyof typeof freqIcons; color: string; bg: string }> = {
        hourly: { label: 'Hourly', icon: 'Clock', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        daily: { label: 'Daily', icon: 'Sun', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        weekly: { label: 'Weekly', icon: 'CalendarDays', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        monthly: { label: 'Monthly', icon: 'CalendarRange', color: 'text-purple-500', bg: 'bg-purple-500/10' }
    }

    const handleSubmit = async (e: React.SyntheticEvent, sideOverride?: 'buy' | 'sell') => {
        e.preventDefault()
        if (!token) return

        const effSide = sideOverride ?? side
        if (sideOverride && sideOverride !== side) setSide(sideOverride)

        setLoading(true)
        setMessage('')
        setIsSuccess(false)

        try {
            const apiClient = createApiClient(token)
            const payload: any = {
                side: effSide,
                energy_amount: amount,
                interval_type: intervalType,
                interval_value: parseInt(intervalValue) || 1,
            }

            // Add price limit based on side
            if (priceLimit) {
                if (effSide === 'buy') {
                    payload.max_price_per_kwh = priceLimit
                } else {
                    payload.min_price_per_kwh = priceLimit
                }
            }

            if (maxExecutions) {
                payload.max_executions = parseInt(maxExecutions)
            }

            if (name.trim()) {
                payload.name = name.trim()
            }

            const response = await apiClient.createRecurringOrder(payload)

            if (response.error) {
                setMessage(response.error)
            } else {
                const data = response.data as any
                const nextRun = data?.next_execution_at
                    ? new Date(data.next_execution_at).toLocaleString()
                    : 'soon'
                setMessage(`DCA strategy created! First execution: ${nextRun}`)
                setIsSuccess(true)
                setAmount('')
                setPriceLimit('')
                setName('')
            }
        } catch (err) {
            setMessage('Failed to schedule recurring order')
        } finally {
            setLoading(false)
        }
    }

    const intervalLabel = intervalType === 'hourly' ? 'hour' : intervalType === 'daily' ? 'day' : intervalType === 'weekly' ? 'week' : 'month'
    const scheduleSummary = `Every ${intervalValue !== '1' ? `${intervalValue} ` : ''}${frequencyConfig[intervalType].label.toLowerCase()}${intervalValue !== '1' ? 's' : ''}`
    const isBuy = side === 'buy'

    return (
        <div className="flex flex-col h-full">
            {/* Header — title + subtitle; padding inherited from parent (matches Buy/Sell) */}
            <div className="flex items-center gap-3 pb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary">
                    <Repeat className="h-4 w-4 text-primary" />
                </span>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight text-foreground">DCA Strategy</span>
                    <span className="text-[11px] leading-tight text-muted-foreground">Automated recurring orders</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4" style={{ minHeight: '380px' }}>
                    {/* Strategy Name */}
                    <Field label="Strategy Name" hint="optional">
                        <Input
                            type="text"
                            placeholder="e.g. Daily Solar Buy"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={cn(inputBase, "h-10 text-sm")}
                        />
                    </Field>

                    {/* Amount */}
                    <Field label="Amount per execution" hint="min 0.1 kWh">
                        <div className="relative">
                            <Input
                                data-testid="dca-amount-input"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0.01"
                                step="0.01"
                                className={cn(
                                    inputBase,
                                    "h-14 pr-14 text-right font-mono text-xl font-bold",
                                    amount ? "text-primary border-primary" : "text-foreground"
                                )}
                            />
                            <span className={cn(
                                "absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold",
                                amount ? "text-primary/70" : "text-muted-foreground"
                            )}>kWh</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {amountPresets.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setAmount(preset)}
                                    className={cn(
                                        "h-7 rounded-md border text-[11px] font-semibold font-mono transition-colors",
                                        amount === preset
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                    )}
                                >{preset}</button>
                            ))}
                        </div>
                    </Field>

                    {/* Price Limit */}
                    <Field label={isBuy ? 'Max Price' : 'Min Price'} hint={isBuy ? 'skip if higher' : 'skip if lower'}>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder="No limit"
                                value={priceLimit}
                                onChange={(e) => setPriceLimit(e.target.value)}
                                min="0.01"
                                step="0.01"
                                className={cn(inputBase, "h-10 pr-16 text-right font-mono text-sm")}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">฿/kWh</span>
                        </div>
                    </Field>

                    {/* Frequency */}
                    <Field label="Frequency">
                        <div className="grid grid-cols-4 gap-2">
                            {(Object.keys(frequencyConfig) as IntervalType[]).map((key) => {
                                const config = frequencyConfig[key]
                                const isActive = intervalType === key
                                const Icon = freqIcons[config.icon]
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setIntervalType(key)}
                                        className={cn(
                                            "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all",
                                            isActive
                                                ? "border-primary bg-background shadow-sm"
                                                : "border-border bg-secondary hover:border-muted"
                                        )}
                                    >
                                        <span className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                                            isActive ? config.bg : "bg-muted"
                                        )}>
                                            <Icon className={cn("h-4 w-4", isActive ? config.color : "text-muted-foreground")} />
                                        </span>
                                        <span className={cn(
                                            "text-[11px] font-semibold",
                                            isActive ? "text-foreground" : "text-muted-foreground"
                                        )}>{config.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </Field>

                    {/* Interval value + Max executions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={`Every N ${intervalLabel}s`} icon={Hash}>
                            <Input
                                type="number"
                                value={intervalValue}
                                onChange={(e) => setIntervalValue(e.target.value)}
                                min="1"
                                max="30"
                                className={cn(inputBase, "h-10 text-center font-mono text-sm")}
                            />
                        </Field>
                        <Field label="Max Runs" hint="∞">
                            <Input
                                type="number"
                                placeholder="∞"
                                value={maxExecutions}
                                onChange={(e) => setMaxExecutions(e.target.value)}
                                min="1"
                                className={cn(inputBase, "h-10 text-center font-mono text-sm")}
                            />
                        </Field>
                    </div>

                    {/* Compact summary */}
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 space-y-1.5 text-xs">
                        <SummaryRow label="Action">
                            <span className={cn("font-semibold", isBuy ? "text-emerald-500" : "text-rose-500")}>
                                {isBuy ? 'Buy' : 'Sell'}
                            </span>
                        </SummaryRow>
                        <SummaryRow label="Amount">
                            <span className="font-mono font-semibold text-foreground">{amount || '0'} kWh</span>
                        </SummaryRow>
                        <SummaryRow label="Schedule">
                            <span className="font-semibold text-foreground">{scheduleSummary}</span>
                        </SummaryRow>
                        {priceLimit && (
                            <SummaryRow label={isBuy ? 'Max Price' : 'Min Price'}>
                                <span className="font-mono font-semibold text-foreground">฿{priceLimit}/kWh</span>
                            </SummaryRow>
                        )}
                        {maxExecutions && (
                            <SummaryRow label="Limit">
                                <span className="font-mono font-semibold text-foreground">{maxExecutions} runs</span>
                            </SummaryRow>
                        )}
                    </div>

                    {/* Matching scenario */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                            <span>Simulated Matching</span>
                            <span className="text-primary italic normal-case">Affects fees</span>
                        </Label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {[
                                { id: buyerZoneId, label: 'Intra-zone', desc: 'Neighbor' },
                                { id: (buyerZoneId % 3) + 1, label: 'Inter-zone', desc: 'Nearby' },
                                { id: 0, label: 'Main Grid', desc: 'Import' }
                            ].map((scenario) => (
                                <button
                                    key={scenario.label}
                                    type="button"
                                    onClick={() => setSellerZoneId(scenario.id)}
                                    className={cn(
                                        "flex flex-col items-center py-2 px-1 rounded-lg border transition-all",
                                        sellerZoneId === scenario.id
                                            ? "bg-primary/5 border-primary shadow-sm"
                                            : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <span className="text-[10px] font-bold">{scenario.label}</span>
                                    <span className="text-[9px] opacity-70 leading-none">{scenario.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cost breakdown */}
                    <P2PCostBreakdown
                        amount={parseFloat(amount) || 0}
                        agreedPrice={parseFloat(priceLimit) || undefined}
                        buyerZoneId={buyerZoneId}
                        sellerZoneId={sellerZoneId}
                    />

                    {/* Slide to confirm: right = Buy, left = Sell */}
                    <SlideToConfirm
                        loading={loading}
                        disabled={loading || !token || !amount}
                        onConfirm={(s) => handleSubmit({ preventDefault() {} } as React.SyntheticEvent, s)}
                    />

                    {message && <FormAlert success={isSuccess} message={message} />}
            </form>
        </div>
    )
}

const freqIcons = { Clock, Sun, CalendarDays, CalendarRange }

// Single alert style — one layout, accent swaps by success/error only
function FormAlert({ success, message }: { success: boolean; message: string }) {
    const Icon = success ? CheckCircle2 : AlertCircle
    const accent = success ? "text-emerald-500" : "text-rose-500"
    return (
        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary p-3 text-xs">
            <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", accent)} />
            <span className="leading-relaxed text-foreground">{message}</span>
        </div>
    )
}

// Shared input styling. NOTE: theme color vars are hex, so Tailwind alpha modifiers
// (bg-muted/30 etc.) compile to invalid CSS and get dropped -> inputs fall back to UA
// white. Use solid color utilities only.
const inputBase = "appearance-none rounded-xl border border-border bg-secondary text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary focus-visible:bg-background"

const THUMB_W = 48 // px, matches w-12
const SLIDE_THRESHOLD = 0.7 // fraction of max travel to trigger

function SlideToConfirm({ loading, disabled, onConfirm }: {
    loading: boolean
    disabled: boolean
    onConfirm: (side: 'buy' | 'sell') => void
}) {
    const trackRef = useRef<HTMLDivElement>(null)
    const drag = useRef({ startX: 0, max: 1, active: false })
    const [offset, setOffset] = useState(0)
    const [dragging, setDragging] = useState(false)
    const [maxPx, setMaxPx] = useState(1)

    const maxTravel = () => {
        const w = trackRef.current?.clientWidth ?? 0
        return Math.max(1, (w - THUMB_W) / 2 - 4)
    }

    const onDown = (e: React.PointerEvent) => {
        if (disabled || loading) return
        const max = maxTravel()
        drag.current = { startX: e.clientX, max, active: true }
        setMaxPx(max)
        setDragging(true)
        e.currentTarget.setPointerCapture(e.pointerId)
    }
    const onMove = (e: React.PointerEvent) => {
        if (!drag.current.active) return
        const { startX, max } = drag.current
        const dx = Math.max(-max, Math.min(max, e.clientX - startX))
        setOffset(dx)
    }
    const onUp = (e: React.PointerEvent) => {
        if (!drag.current.active) return
        drag.current.active = false
        setDragging(false)
        try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { }
        const ratio = offset / drag.current.max
        if (ratio >= SLIDE_THRESHOLD) onConfirm('buy')
        else if (ratio <= -SLIDE_THRESHOLD) onConfirm('sell')
        setOffset(0)
    }

    const ratio = offset / maxPx
    const towardBuy = offset > 0
    const intensity = Math.min(1, Math.abs(ratio))

    return (
        <div
            ref={trackRef}
            data-testid="slide-to-confirm-track"
            className={cn(
                "relative h-12 rounded-full border border-border/60 bg-muted/40 overflow-hidden select-none",
                disabled && "opacity-50"
            )}
        >
            {/* Fill that grows toward the dragged side */}
            <div
                className={cn(
                    "absolute inset-y-0 w-1/2 transition-colors",
                    towardBuy
                        ? "right-0 bg-gradient-to-r from-transparent to-emerald-500/30"
                        : "left-0 bg-gradient-to-l from-transparent to-rose-500/30"
                )}
                style={{ opacity: dragging ? intensity : 0 }}
            />

            {/* Side hints */}
            <div className="absolute inset-0 flex items-center justify-between px-5 text-xs font-semibold pointer-events-none">
                <span className={cn("flex items-center gap-1 transition-colors", !towardBuy && dragging ? "text-rose-500" : "text-muted-foreground")}>
                    <TrendingUp className="h-3.5 w-3.5" /> Sell
                </span>
                <span className={cn("flex items-center gap-1 transition-colors", towardBuy && dragging ? "text-emerald-500" : "text-muted-foreground")}>
                    Buy <TrendingDown className="h-3.5 w-3.5" />
                </span>
            </div>

            {/* Center label */}
            {!dragging && !loading && (
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-muted-foreground/70 pointer-events-none">
                    Slide to confirm
                </span>
            )}

            {/* Thumb */}
            <div
                data-testid="slide-to-confirm-thumb"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                className={cn(
                    "absolute top-1/2 left-1/2 flex h-10 w-12 -mt-5 -ml-6 items-center justify-center rounded-full shadow-lg touch-none",
                    disabled || loading ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
                    !dragging && "transition-transform duration-200",
                    towardBuy && dragging
                        ? "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white"
                        : !towardBuy && dragging
                            ? "bg-gradient-to-b from-rose-500 to-rose-600 text-white"
                            : "bg-primary text-primary-foreground"
                )}
                style={{ transform: `translateX(${offset}px)` }}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : towardBuy && dragging ? (
                    <ArrowRight className="h-4 w-4" />
                ) : !towardBuy && dragging ? (
                    <ArrowRight className="h-4 w-4 rotate-180" />
                ) : (
                    <span className="flex items-center text-muted-foreground/60">
                        <ArrowRight className="h-3.5 w-3.5 rotate-180 -mr-1" />
                        <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                )}
            </div>
        </div>
    )
}

function Field({ label, hint, icon: Icon, children }: {
    label: string
    hint?: string
    icon?: typeof Hash
    children: React.ReactNode
}) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                    {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                    {label}
                </span>
                {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
            </Label>
            {children}
        </div>
    )
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            {children}
        </div>
    )
}
