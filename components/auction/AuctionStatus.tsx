"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Lock, CheckCircle, Activity } from "lucide-react"

interface AuctionStatusProps {
    status: number // 0: Open, 1: Locked, 2: Cleared, 3: Settled
    startTime: number
    endTime: number
    batchId: string
}

export function AuctionStatus({ status, startTime, endTime, batchId }: AuctionStatusProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [progress, setProgress] = useState<number>(0)

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000)
            const totalDuration = endTime - startTime
            const elapsed = now - startTime
            const remaining = Math.max(0, endTime - now)

            setTimeLeft(remaining)
            setProgress(Math.min(100, (elapsed / totalDuration) * 100))
        }, 1000)

        return () => clearInterval(interval)
    }, [startTime, endTime])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const getStatusBadge = () => {
        switch (status) {
            case 0: return <Badge className="bg-green-500"><Activity className="w-3 h-3 mr-1" /> Open</Badge>
            case 1: return <Badge className="bg-yellow-500"><Lock className="w-3 h-3 mr-1" /> Locked</Badge>
            case 2: return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" /> Cleared</Badge>
            case 3: return <Badge variant="secondary">Settled</Badge>
            default: return <Badge variant="outline">Unknown</Badge>
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auction Batch #{batchId.slice(0, 8)}...</CardTitle>
                {getStatusBadge()}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                    {status === 0 ? formatTime(timeLeft) : "00:00"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {status === 0 ? "Time remaining in current round" : "Round ended"}
                </p>
                <Progress value={status === 0 ? progress : 100} className="mt-4" />
            </CardContent>
        </Card>
    )
}
