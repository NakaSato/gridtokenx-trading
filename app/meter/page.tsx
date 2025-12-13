'use client'

import { useEffect, useState } from 'react'
import { defaultApiClient } from '@/lib/api-client'
import { MeterStats as MeterStatsType } from '@/types/meter'
import MeterStats from './components/MeterStats'
import SubmitReadingForm from './components/SubmitReadingForm'
import RecentReadings from './components/RecentReadings'

export default function MeterPage() {
    const [stats, setStats] = useState<MeterStatsType | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const fetchStats = async () => {
        try {
            const response = await defaultApiClient.getMeterStats()
            if (response.data) {
                setStats(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch meter stats:', error)
        }
    }

    const handleSuccess = () => {
        fetchStats()
        setRefreshKey(prev => prev + 1) // Trigger list refresh
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold">Smart Meter</h1>
                <p className="text-muted-foreground">
                    Manage your energy production and mint Energy Tokens.
                </p>
            </div>

            <MeterStats stats={stats} />

            <div className="grid gap-6 md:grid-cols-2">
                <SubmitReadingForm onSuccess={handleSuccess} />
                <RecentReadings key={refreshKey.toString()} />
            </div>
        </div>
    )
}
