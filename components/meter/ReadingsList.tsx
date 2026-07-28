'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUpRight, ArrowDownRight, Loader2, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { MeterReading, MeterResponse } from '@/types/meter'
import Pagination from '@/components/Pagination'
import { P2P_CONFIG } from '@/lib/constants'

type StatusFilter = 'all' | 'minted' | 'pending'
type TypeFilter = 'all' | 'generation' | 'consumption'

interface ReadingsListProps {
    readings: MeterReading[]
    meters: MeterResponse[]
    loading: boolean
    onCopy: (text: string) => Promise<void>
    /** Server-side total (X-Total-Count); shown when more readings exist than the fetched page. */
    serverTotal?: number
    /** Server reports more readings beyond the fetched page (X-Has-More). */
    hasMoreOnServer?: boolean
}

export function ReadingsList({ readings, meters, loading, onCopy, serverTotal, hasMoreOnServer }: ReadingsListProps) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
    const [currentPage, setCurrentPage] = useState(1)

    const ITEMS_PER_PAGE = P2P_CONFIG.itemsPerPage

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, typeFilter])

    // Helper to get meter details
    const getMeterDetails = (serial: string) => {
        return meters.find(m => m.serial_number === serial)
    }

    // Per-meter telemetry interval, in seconds, derived from consecutive
    // timestamps.
    //
    // A row's `kwh` is the ENERGY accrued over one telemetry tick, not a rate —
    // at the simulator's 15 s tick a 7.4 kW array reports ~0.031 kWh, which
    // `.toFixed(2)` then flattened to a uniform "0.03" for every export row.
    // `meter_readings` carries no interval column (the aggregator does not
    // persist `interval_seconds`), so it is inferred here as the MEDIAN gap
    // between a meter's readings — median, not mean, so one gap across a
    // restart or a pagination boundary cannot skew it. A meter with fewer than
    // two readings on this page yields no interval, and its row falls back to
    // energy rather than inventing a rate.
    const intervalByMeter = useMemo(() => {
        const stamps = new Map<string, number[]>()
        for (const r of readings) {
            const t = new Date(r.timestamp).getTime()
            if (Number.isFinite(t)) {
                const list = stamps.get(r.meter_serial)
                if (list) list.push(t)
                else stamps.set(r.meter_serial, [t])
            }
        }
        const result = new Map<string, number>()
        for (const [serial, times] of stamps) {
            if (times.length < 2) continue
            times.sort((a, b) => a - b)
            const gaps: number[] = []
            for (let i = 1; i < times.length; i++) {
                const gap = (times[i] - times[i - 1]) / 1000
                if (gap > 0) gaps.push(gap)
            }
            if (!gaps.length) continue
            gaps.sort((a, b) => a - b)
            const median = gaps[Math.floor(gaps.length / 2)]
            if (median > 0) result.set(serial, median)
        }
        return result
    }, [readings])

    // Apply filters to readings
    const filteredReadings = useMemo(() => {
        return readings.filter(reading => {
            // Status filter
            if (statusFilter === 'minted' && reading.mint_status !== 'minted') return false
            if (statusFilter === 'pending' && reading.mint_status === 'minted') return false

            // Type filter  
            if (typeFilter === 'generation' && reading.kwh <= 0) return false
            if (typeFilter === 'consumption' && reading.kwh > 0) return false

            return true
        })
    }, [readings, statusFilter, typeFilter])

    // Calculate pagination
    const totalItems = filteredReadings.length
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
    const paginatedReadings = filteredReadings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-none p-3">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-base">Reading History</CardTitle>
                        <CardDescription className="text-xs">
                            Recent energy readings recorded on the blockchain.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                            <SelectTrigger className="h-8 w-[120px] text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="minted">Minted</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="generation">Generation</SelectItem>
                                <SelectItem value="consumption">Consumption</SelectItem>
                            </SelectContent>
                        </Select>

                        {(statusFilter !== 'all' || typeFilter !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setStatusFilter('all')
                                    setTypeFilter('all')
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 relative p-3 pt-0">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading readings...</span>
                    </div>
                ) : readings.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">No readings found. Generate some data!</div>
                ) : (
                    <div className="flex flex-col gap-3 h-full">
                        <div className="rounded-md border flex-1 flex flex-col min-h-0">
                            <div className="grid grid-cols-6 gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground flex-none">
                                <div>Time</div>
                                <div className="col-span-1">Meter</div>
                                <div>Type</div>
                                <div>Rate</div>
                                <div>Status</div>
                                <div>Tx Signature</div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {paginatedReadings.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-muted-foreground p-4">
                                        No readings match the selected filters.
                                    </div>
                                ) : (
                                    paginatedReadings.map((reading) => {
                                        const meter = getMeterDetails(reading.meter_serial)
                                        return (
                                            <div key={reading.id} className="grid grid-cols-6 gap-3 border-b px-3 py-2 text-sm last:border-0 hover:bg-muted/50">
                                                <div className="flex items-center text-xs font-mono">{format(new Date(reading.timestamp), 'HH:mm:ss')}</div>
                                                <div className="flex flex-col justify-center truncate col-span-1">
                                                    <div className="font-medium truncate text-xs" title={meter?.location || 'Unknown Location'}>
                                                        {meter?.location || 'Unknown Location'}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground font-mono truncate" title={reading.meter_serial}>
                                                        {meter?.meter_type.replace('_', ' ') || 'Meter'} ({reading.meter_serial.split('-').pop()})
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    {reading.kwh > 0 ? (
                                                        <span className="flex items-center text-green-500"><ArrowUpRight className="mr-1 h-3 w-3" /> Gen</span>
                                                    ) : (
                                                        <span className="flex items-center text-orange-500"><ArrowDownRight className="mr-1 h-3 w-3" /> Cons</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col justify-center font-medium">
                                                    {(() => {
                                                        const kwh = Math.abs(reading.kwh)
                                                        const interval = intervalByMeter.get(reading.meter_serial)
                                                        // No interval known -> show energy at a precision that
                                                        // survives a short tick, never a fabricated rate.
                                                        if (!interval) return <span>{kwh.toFixed(3)} kWh</span>
                                                        return (
                                                            <>
                                                                <span>{((kwh * 3600) / interval).toFixed(2)} kW</span>
                                                                <span className="text-[10px] text-muted-foreground font-normal">
                                                                    {kwh.toFixed(3)} kWh / {interval}s
                                                                </span>
                                                            </>
                                                        )
                                                    })()}
                                                </div>
                                                <div className="flex items-center">
                                                    {reading.mint_status === 'minted' ? (
                                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                                                            Minted
                                                        </span>
                                                    ) : reading.mint_status === 'denied' ? (
                                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
                                                            Denied
                                                        </span>
                                                    ) : reading.mint_status === 'not_applicable' ? (
                                                        <span
                                                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                            title="No mint — this billing window closed with net consumption"
                                                        >
                                                            N/A
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                                                    {reading.mint_tx_signature ? (
                                                        <>
                                                            <span className="truncate">{reading.mint_tx_signature.slice(0, 12)}...</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => onCopy(reading.mint_tx_signature!)}
                                                                className="h-5 w-5 p-0 hover:bg-accent"
                                                                title="Copy full signature"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </>
                                                    ) : '-'}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {(totalPages > 1 || hasMoreOnServer) && (
                            <div className="flex-none flex items-center justify-center gap-3">
                                {totalPages > 1 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalItems={totalItems}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                        onPageChange={setCurrentPage}
                                    />
                                )}
                                {hasMoreOnServer && (
                                    <span className="text-xs text-muted-foreground">
                                        Showing latest {readings.length}
                                        {serverTotal ? ` of ${serverTotal}` : ''} readings
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )

}

export const MemoizedReadingsList = React.memo(ReadingsList)
