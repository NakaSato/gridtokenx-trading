'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { formatDistanceToNow } from 'date-fns'
import { MeterReading } from '@/types/meter'
import { Badge } from '@/components/ui/badge'
import { useMeterSocket } from '@/hooks/useMeterSocket'

interface RecentReadingsProps {
    key?: string // Force refresh
}

export default function RecentReadings({ key }: RecentReadingsProps) {
    const [readings, setReadings] = useState<MeterReading[]>([])
    const [loading, setLoading] = useState(true)

    const fetchReadings = async () => {
        try {
            const response = await defaultApiClient.getMyReadings(5, 0)
            if (response.data) {
                setReadings(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch readings:', error)
        } finally {
            setLoading(false)
        }
    }

    useMeterSocket({
        onReadingReceived: (data) => {
            // Prepend new reading
            // Note: data from WS might not have all fields like 'id', 'minted' etc in the same format.
            // But we can construct a pessimistic object or just refetch.
            // Refetching is safer to ensure consistency.
            fetchReadings()
        }
    })

    useEffect(() => {
        fetchReadings()
        // Poll for updates (to see minting status change)
        const interval = setInterval(fetchReadings, 5000)
        return () => clearInterval(interval)
    }, [key])

    if (loading && readings.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">Loading readings...</div>
    }

    if (readings.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Readings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No readings submitted yet.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Readings</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {readings.map((reading) => (
                        <div key={reading.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                            <div>
                                <div className="font-semibold">
                                    {parseFloat(reading.kwh_amount).toFixed(2)} kWh
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(reading.reading_timestamp), { addSuffix: true })}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <Badge variant={reading.minted ? "default" : "secondary"}>
                                    {reading.minted ? "Minted" : "Processing"}
                                </Badge>
                                {reading.minted && reading.mint_tx_signature && (
                                    <span className="text-[10px] text-muted-foreground mt-1 max-w-[100px] truncate" title={reading.mint_tx_signature}>
                                        Tx: {reading.mint_tx_signature.substring(0, 8)}...
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
