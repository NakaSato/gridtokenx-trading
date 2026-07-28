'use client'

import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Activity,
    ShieldCheck,
    ArrowRight,
    AlertCircle,
    Clock,
    Ban,
    Minus,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { useGridStatus } from '@/features/energy-grid/hooks/useGridStatus'
import type { MeterReading } from '@/types/meter'
import { useOrderFill } from '@/features/p2p/order-fill-context'
import { useSidebar } from '@/components/shared/SidebarContext'
import { toast } from 'react-hot-toast'

const READINGS_POLL_MS = 15000

/**
 * Format a possibly-missing numeric field. The grid-status payload is not
 * guaranteed to carry every field (partial WS pushes, older backends), so
 * never call .toLocaleString() on it unguarded.
 */
function fmtNum(
    n: number | undefined | null,
    { digits = 1, unit = '', signed = false }: { digits?: number; unit?: string; signed?: boolean } = {}
) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '—'
    const sign = signed && n >= 0 ? '+' : ''
    return `${sign}${n.toLocaleString(undefined, { maximumFractionDigits: digits })}${unit}`
}

/** One label/value pair in the compact stat bar. */
function Stat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-[9px] font-medium uppercase text-muted-foreground">{label}</span>
            <span className={cn('font-mono text-xs font-semibold text-foreground', valueClass)}>
                {value}
            </span>
        </div>
    )
}

/** Mint-status badge per reading — real backend state, not a decorative label. */
const MINT_BADGES: Record<
    MeterReading['mint_status'],
    { label: string; icon: typeof ShieldCheck; className: string }
> = {
    minted: {
        label: 'Minted',
        icon: ShieldCheck,
        className: 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20',
    },
    pending: {
        label: 'Pending',
        icon: Clock,
        className: 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20',
    },
    denied: {
        label: 'Denied',
        icon: Ban,
        className: 'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
    },
    not_applicable: {
        label: 'N/A',
        icon: Minus,
        className: 'bg-muted text-muted-foreground ring-1 ring-border',
    },
}

/**
 * Live grid view, API-only: aggregate grid stats from the public grid-status
 * API (+ gateway WS updates via useGridStatus) and the caller's own meter
 * readings from the meter API. No direct on-chain reads — all blockchain
 * state (mint status, tx signatures) arrives via the backend.
 */
export default function LiveGridStats() {
    const { token } = useAuth()
    const { status: grid, error: gridError } = useGridStatus(READINGS_POLL_MS)
    const { setActiveOrderFill } = useOrderFill()
    const { showRightSidebar, toggleRightSidebar } = useSidebar()

    const { data: readings = [], error: readingsQueryError } = useQuery<MeterReading[]>({
        queryKey: ['my-meter-readings'],
        queryFn: async () => {
            const apiClient = createApiClient(token!)
            const response = await apiClient.getMyReadings(50)
            if (response.error) throw new Error(response.error)
            return response.data || []
        },
        enabled: !!token,
        refetchInterval: READINGS_POLL_MS,
    })
    const readingsError = readingsQueryError
        ? (readingsQueryError as Error).message
        : null

    const handleSell = (reading: MeterReading) => {
        const amount = reading.surplus_energy ?? reading.energy_generated ?? 0
        if (amount <= 0) {
            toast.error('No surplus energy to sell for this reading')
            return
        }
        setActiveOrderFill({
            amount,
            price: 4.5, // Default/Suggested price
        })
        toast.success(`Pre-filled sell order for ${amount} kWh`)
        // Reveal the order form the fill just landed in
        if (!showRightSidebar) toggleRightSidebar()
        requestAnimationFrame(() => {
            document
                .getElementById('p2p-order-form')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
    }

    const gridLive = !gridError && grid != null
    const error = gridError || readingsError

    return (
        <div className="flex h-full min-h-0 flex-col">
            {/* Stat bar — aggregate grid status */}
            <div className="flex flex-shrink-0 items-center gap-3 overflow-x-auto border-b border-border bg-muted/10 px-3 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="relative flex h-2 w-2">
                        {gridLive && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                        )}
                        <span
                            className={cn(
                                'relative inline-flex h-2 w-2 rounded-full',
                                gridLive ? 'bg-emerald-500' : 'bg-destructive'
                            )}
                        />
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Grid
                    </span>
                    <Badge
                        variant="outline"
                        className={cn(
                            'h-4 rounded-md border-0 px-1.5 text-[9px] font-normal',
                            gridLive
                                ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                                : 'bg-destructive/10 text-destructive ring-1 ring-destructive/20'
                        )}
                    >
                        {gridLive ? 'Live' : 'Offline'}
                    </Badge>
                </div>

                <div className="h-3 w-px flex-shrink-0 bg-border" />
                <Stat
                    label="Generation"
                    value={fmtNum(grid?.total_generation, { unit: ' kW' })}
                    valueClass="text-emerald-500"
                />
                <div className="h-3 w-px flex-shrink-0 bg-border" />
                <Stat
                    label="Consumption"
                    value={fmtNum(grid?.total_consumption, { unit: ' kW' })}
                />
                <div className="h-3 w-px flex-shrink-0 bg-border" />
                <Stat
                    label="Net"
                    value={fmtNum(grid?.net_balance, { unit: ' kW', signed: true })}
                    valueClass={
                        typeof grid?.net_balance === 'number'
                            ? grid.net_balance >= 0
                                ? 'text-emerald-500'
                                : 'text-destructive'
                            : undefined
                    }
                />
                <div className="h-3 w-px flex-shrink-0 bg-border" />
                <Stat
                    label="Meters"
                    value={fmtNum(grid?.active_meters, { digits: 0 })}
                />

                <span className="ml-auto whitespace-nowrap text-[9px] text-muted-foreground">
                    {typeof grid?.co2_saved_kg === 'number'
                        ? `CO₂ saved ${fmtNum(grid.co2_saved_kg, { digits: 0, unit: ' kg' })}`
                        : ''}
                </span>
            </div>

            {/* API errors surface here, not in the console */}
            {error && (
                <div className="flex flex-shrink-0 items-start gap-1.5 border-b border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] text-amber-600 dark:text-amber-400">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="leading-tight">{error}</span>
                </div>
            )}

            {/* My meter readings feed */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="sticky top-0 z-10 grid grid-cols-6 gap-2 border-b border-border bg-card px-3 py-1.5 text-[9px] font-bold uppercase text-muted-foreground">
                    <div>Meter</div>
                    <div className="text-right">Generated</div>
                    <div className="text-right">Consumed</div>
                    <div className="text-right">Time</div>
                    <div className="text-center">Mint</div>
                    <div className="text-center">Action</div>
                </div>

                {!token ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
                        <Activity className="h-5 w-5 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground">
                            Sign in to see your meter readings.
                        </p>
                    </div>
                ) : readings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
                        <Activity className="h-5 w-5 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground">
                            No meter readings yet — rows appear as your meters submit data.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {readings.map((reading) => {
                            const badge = MINT_BADGES[reading.mint_status] ?? MINT_BADGES.pending
                            const BadgeIcon = badge.icon
                            const surplus = reading.surplus_energy ?? reading.energy_generated ?? 0
                            return (
                                <div
                                    key={reading.id}
                                    className="group grid grid-cols-6 items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-muted/10"
                                >
                                    <div
                                        className="truncate font-mono text-primary"
                                        title={reading.meter_serial}
                                    >
                                        {reading.meter_serial}
                                    </div>
                                    <div className="text-right font-mono font-semibold text-emerald-500">
                                        {(reading.energy_generated ?? reading.kwh).toFixed(2)}
                                        <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">
                                            kWh
                                        </span>
                                    </div>
                                    <div className="text-right font-mono text-destructive">
                                        {reading.energy_consumed != null
                                            ? reading.energy_consumed.toFixed(2)
                                            : '—'}
                                        {reading.energy_consumed != null && (
                                            <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">
                                                kWh
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right font-mono text-muted-foreground">
                                        {format(new Date(reading.timestamp), 'HH:mm:ss')}
                                    </div>
                                    <div className="flex justify-center">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'h-4 rounded-md border-0 px-1.5 text-[9px] font-normal',
                                                badge.className
                                            )}
                                            title={reading.mint_tx_signature}
                                        >
                                            <BadgeIcon size={10} className="mr-0.5" /> {badge.label}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-center">
                                        {surplus > 0 ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 border-emerald-500/30 px-2 text-[10px] text-emerald-500 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-500"
                                                onClick={() => handleSell(reading)}
                                            >
                                                Sell <ArrowRight size={10} className="ml-1" />
                                            </Button>
                                        ) : (
                                            <span className="text-[9px] text-muted-foreground">—</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
