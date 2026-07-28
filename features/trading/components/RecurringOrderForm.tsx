'use client'
import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/provider'
import { createApiClient } from '@/lib/api-client'
import {
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Sun,
  CalendarDays,
  CalendarRange,
  Hash,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import type { IntervalType } from '@/types/features'
import { Spinner } from '@/components/ui/spinner'

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

  // Quick amount presets (kWh)
  const amountPresets = ['10', '50', '100', '500']

  const frequencyConfig: Record<
    IntervalType,
    { label: string; icon: keyof typeof freqIcons; color: string; bg: string }
  > = {
    hourly: {
      label: 'Hourly',
      icon: 'Clock',
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
    },
    daily: {
      label: 'Daily',
      icon: 'Sun',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    weekly: {
      label: 'Weekly',
      icon: 'CalendarDays',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    monthly: {
      label: 'Monthly',
      icon: 'CalendarRange',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!token) return

    setLoading(true)

    try {
      const apiClient = createApiClient(token)
      const payload: any = {
        side,
        energy_amount: amount,
        interval_type: intervalType,
        interval_value: parseInt(intervalValue) || 1,
      }

      // Add price limit based on side
      if (priceLimit) {
        if (side === 'buy') {
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
        toast.error(response.error)
      } else {
        const data = response.data as any
        const nextRun = data?.next_execution_at
          ? new Date(data.next_execution_at).toLocaleString()
          : 'soon'
        toast.success(`DCA strategy created! First execution: ${nextRun}`, {
          duration: 5000,
        })
        setAmount('')
        setPriceLimit('')
        setName('')
      }
    } catch (err) {
      toast.error('Failed to schedule recurring order')
    } finally {
      setLoading(false)
    }
  }

  const intervalLabel =
    intervalType === 'hourly'
      ? 'hour'
      : intervalType === 'daily'
        ? 'day'
        : intervalType === 'weekly'
          ? 'week'
          : 'month'
  const isBuy = side === 'buy'

  return (
    <div className="flex h-full flex-col">
      <form
        onSubmit={handleSubmit}
        className="min-h-[380px] flex-1 space-y-5 overflow-y-auto"
      >
        {/* ─── Section 1: Strategy ─── */}
        <Section title="Strategy">
          {/* Side — explicit up front so the price-limit label (Max/Min) is coherent */}
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-secondary p-1">
            <button
              type="button"
              onClick={() => setSide('buy')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all duration-200',
                isBuy
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600'
              )}
            >
              <TrendingDown className="h-4 w-4" /> Buy
            </button>
            <button
              type="button"
              onClick={() => setSide('sell')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all duration-200',
                !isBuy
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600'
              )}
            >
              <TrendingUp className="h-4 w-4" /> Sell
            </button>
          </div>

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
                  'h-14 pr-14 text-right font-mono text-xl font-bold',
                  amount ? 'border-primary text-primary' : 'text-foreground'
                )}
              />
              <span
                className={cn(
                  'absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold',
                  amount ? 'text-primary/70' : 'text-muted-foreground'
                )}
              >
                kWh
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {amountPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={cn(
                    'h-7 rounded-md border font-mono text-[11px] font-semibold transition-colors',
                    amount === preset
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </Field>

          {/* Price Limit */}
          <Field
            label={isBuy ? 'Max Price' : 'Min Price'}
            hint={isBuy ? 'skip if higher' : 'skip if lower'}
          >
            <div className="relative">
              <Input
                type="number"
                placeholder="No limit"
                value={priceLimit}
                onChange={(e) => setPriceLimit(e.target.value)}
                min="0.01"
                step="0.01"
                className={cn(
                  inputBase,
                  'h-10 pr-16 text-right font-mono text-sm'
                )}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                ฿/kWh
              </span>
            </div>
          </Field>

          {/* Strategy Name — optional, so it sits last in the section */}
          <Field label="Strategy Name" hint="optional">
            <Input
              type="text"
              placeholder="e.g. Daily Solar Buy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(inputBase, 'h-10 text-sm')}
            />
          </Field>
        </Section>

        {/* ─── Section 2: Schedule ─── */}
        <Section title="Schedule">
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
                    'flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-all',
                    isActive
                      ? 'border-primary bg-background shadow-sm'
                      : 'border-border bg-secondary hover:border-muted'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                      isActive ? config.bg : 'bg-muted'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isActive ? config.color : 'text-muted-foreground'
                      )}
                    />
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-semibold',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {config.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Every N ${intervalLabel}s`} icon={Hash}>
              <Input
                type="number"
                value={intervalValue}
                onChange={(e) => setIntervalValue(e.target.value)}
                min="1"
                max="30"
                className={cn(inputBase, 'h-10 text-center font-mono text-sm')}
              />
            </Field>
            <Field label="Max Runs" hint="∞">
              <Input
                type="number"
                placeholder="∞"
                value={maxExecutions}
                onChange={(e) => setMaxExecutions(e.target.value)}
                min="1"
                className={cn(inputBase, 'h-10 text-center font-mono text-sm')}
              />
            </Field>
          </div>
        </Section>

        {/* Slide right to confirm; the thumb + fill take the selected side's color */}
        <SlideToConfirm
          side={side}
          loading={loading}
          disabled={loading || !token || !amount}
          idleHint={
            !token
              ? 'Sign in to trade'
              : !amount
                ? 'Enter an amount'
                : `Slide to start ${isBuy ? 'buying' : 'selling'}`
          }
          onConfirm={() =>
            handleSubmit({ preventDefault() {} } as React.SyntheticEvent)
          }
        />
      </form>
    </div>
  )
}

const freqIcons = { Clock, Sun, CalendarDays, CalendarRange }

// Numbered form section: micro-label + hairline divider, compact enough for the sidebar
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  )
}

// Shared input styling. NOTE: theme color vars are hex, so Tailwind alpha modifiers
// (bg-muted/30 etc.) compile to invalid CSS and get dropped -> inputs fall back to UA
// white. Use solid color utilities only.
const inputBase =
  'appearance-none rounded-xl border border-border bg-secondary text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary focus-visible:bg-background'

const THUMB_W = 48 // px, matches w-12
const SLIDE_THRESHOLD = 0.7 // fraction of max travel to trigger

// Single-direction slide (left → right). Side is chosen explicitly in the form,
// so the slider only confirms — it no longer doubles as the buy/sell selector.
function SlideToConfirm({
  side,
  loading,
  disabled,
  idleHint = 'Slide to confirm',
  onConfirm,
}: {
  side: 'buy' | 'sell'
  loading: boolean
  disabled: boolean
  idleHint?: string
  onConfirm: () => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ startX: 0, max: 1, active: false })
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [maxPx, setMaxPx] = useState(1)

  const isBuy = side === 'buy'

  const maxTravel = () => {
    const w = trackRef.current?.clientWidth ?? 0
    return Math.max(1, w - THUMB_W - 8)
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
    const dx = Math.max(0, Math.min(max, e.clientX - startX))
    setOffset(dx)
  }
  const onUp = (e: React.PointerEvent) => {
    if (!drag.current.active) return
    drag.current.active = false
    setDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    if (offset / drag.current.max >= SLIDE_THRESHOLD) onConfirm()
    setOffset(0)
  }

  const intensity = Math.min(1, offset / maxPx)

  return (
    <div
      ref={trackRef}
      data-testid="slide-to-confirm-track"
      className={cn(
        'relative h-12 select-none overflow-hidden rounded-full border border-border/60 bg-muted/40',
        disabled && 'opacity-50'
      )}
    >
      {/* Fill trailing the thumb, in the selected side's color */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full',
          isBuy ? 'bg-emerald-500/20' : 'bg-rose-500/20'
        )}
        style={{
          width: THUMB_W + offset,
          opacity: dragging ? Math.max(0.35, intensity) : 0,
        }}
      />

      {/* Centered hint — thumb rests at the left edge, so this stays visible
                until the drag itself sweeps across it. Height reserved by the track. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium text-muted-foreground transition-opacity',
          (dragging || loading) && 'opacity-0'
        )}
      >
        {idleHint}
      </div>

      {/* Destination chevron */}
      <ChevronRight
        className={cn(
          'pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
          dragging
            ? isBuy
              ? 'text-emerald-500'
              : 'text-rose-500'
            : 'text-muted-foreground/50'
        )}
      />

      {/* Thumb */}
      <div
        data-testid="slide-to-confirm-thumb"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={cn(
          'absolute left-1 top-1/2 -mt-5 flex h-10 w-12 touch-none items-center justify-center rounded-full text-white shadow-lg',
          disabled || loading
            ? 'cursor-not-allowed'
            : 'cursor-grab active:cursor-grabbing',
          !dragging && 'transition-transform duration-200',
          isBuy
            ? 'bg-gradient-to-b from-emerald-500 to-emerald-600'
            : 'bg-gradient-to-b from-rose-500 to-rose-600'
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {loading ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <span className="flex items-center">
            <ChevronRight className="-mr-2 h-4 w-4" />
            <ChevronRight className="h-4 w-4 opacity-50" />
          </span>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string
  hint?: string
  icon?: typeof Hash
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center justify-between text-sm font-medium text-foreground">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          {label}
        </span>
        {hint && (
          <span className="text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </Label>
      {children}
    </div>
  )
}
