import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Battery, Zap } from 'lucide-react'
import { MeterStats as MeterStatsType } from '@/types/meter'
import { useMeterSocket } from '@/hooks/useMeterSocket'

interface MeterStatsProps {
    stats: MeterStatsType | null
}

export default function MeterStats({ stats: initialStats }: MeterStatsProps) {
    const [stats, setStats] = useState<MeterStatsType | null>(initialStats)

    useEffect(() => {
        setStats(initialStats)
    }, [initialStats])

    useMeterSocket({
        onReadingReceived: (data) => {
            if (!stats) return
            // Optimistically update total produced
            setStats(prev => {
                if (!prev) return null
                return {
                    ...prev,
                    total_produced: parseFloat(prev.total_produced.toString()) + data.kwh_amount,
                    // Note: pending_mint would also increase, but let's just update produced for visual feedback
                }
            })
        }
    })

    if (!stats) return null

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Produced</CardTitle>
                    <Zap className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{parseFloat(stats.total_produced.toString()).toFixed(2)} kWh</div>
                    <p className="text-xs text-muted-foreground">
                        Lifetime production
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tokens Minted</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{parseFloat(stats.total_minted.toString()).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                        Energy tokens earned
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Mint</CardTitle>
                    <Battery className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{parseFloat(stats.pending_mint.toString()).toFixed(2)} kWh</div>
                    <p className="text-xs text-muted-foreground">
                        Waiting for settlement
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
