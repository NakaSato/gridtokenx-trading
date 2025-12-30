import { useEffect, useState, useCallback, useMemo } from 'react'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { MeterResponse, MeterReading } from '@/types/meter'
import toast from 'react-hot-toast'

export function useSmartMeter() {
    const { token } = useAuth()
    const [meters, setMeters] = useState<MeterResponse[]>([])
    const [readings, setReadings] = useState<MeterReading[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [mintingReadingId, setMintingReadingId] = useState<string | null>(null)

    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
    const [fetchedStats, setFetchedStats] = useState<import('@/types/meter').MeterStats | null>(null)

    const fetchData = useCallback(async (silent = false) => {
        if (!token) return

        try {
            if (!silent) setRefreshing(true)
            const client = createApiClient(token)

            const [metersRes, readingsRes, statsRes] = await Promise.all([
                client.getMyMeters(),
                // Add simple cache busting or use headers if supported by client method (client methods don't take opts yet)
                // Since client helper methods don't accept custom headers easily without modifying api-client, 
                // we rely on the fact that we are in a dynamic app. 
                // However, to be extra safe, we can rebuild the client or just trust that fetch in browser 
                // doesn't aggressively cache API calls unless instructed. 
                // Note: The previous api-client analysis showed it uses native fetch.
                // We will rely on default behavior but ensure state updates trigger re-renders.
                client.getMyReadings(50, 0), // Optimized: fetch 50 instead of 1000
                client.getMeterStats()
            ])

            if (metersRes.error) {
                if (!silent) console.error("Meters API Error:", metersRes.error)
                if (!silent) toast.error(`Failed to fetch meters: ${metersRes.error}`)
            } else if (metersRes.data) {
                // Check if data actually changed to avoid unnecessary re-renders if we were using memo,
                // but here we simply set it. React handles strict equality checks.
                setMeters(metersRes.data)
            }

            if (readingsRes.error) {
                if (!silent) console.error("Readings API Error:", readingsRes.error)
                if (!silent) toast.error(`Failed to fetch readings: ${readingsRes.error}`)
            } else if (readingsRes.data) {
                setReadings(readingsRes.data)
            }

            if (statsRes.data) {
                setFetchedStats(statsRes.data)
            } else if (statsRes.error && !silent) {
                console.error("Stats API Error:", statsRes.error)
            }
            setLastRefreshed(new Date())

        } catch (error) {
            console.error("Error fetching meter data:", error)
            if (!silent) toast.error("An error occurred while fetching data")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [token])

    const handleMintTokens = async (readingId: string) => {
        if (!token) return

        setMintingReadingId(readingId)
        try {
            const client = createApiClient(token)
            const result = await client.mintReading(readingId)

            if (result.data) {
                toast.success(
                    `Successfully minted ${result.data.kwh_amount} GRX tokens!`,
                    { duration: 5000 }
                )
                // Refresh data to update the UI
                await fetchData()
            } else if (result.error) {
                toast.error(result.error || 'Failed to mint tokens')
            }
        } catch (error) {
            console.error('Minting error:', error)
            const errorMessage = error instanceof Error ? error.message : 'An error occurred while minting'
            toast.error(errorMessage)
        } finally {
            setMintingReadingId(null)
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success('Tx signature copied to clipboard!')
        } catch (err) {
            toast.error('Failed to copy')
        }
    }

    useEffect(() => {
        if (token) {
            fetchData()

            // Setup real-time polling (optimized: 30s instead of 5s)
            const intervalId = setInterval(() => {
                fetchData(true) // Silent refresh
            }, 30000) // Poll every 30 seconds (was 5s)

            return () => clearInterval(intervalId)
        }
    }, [token, fetchData])

    // Calculate Stats
    const stats = useMemo(() => {
        const totalGenerated = readings.reduce((acc, r) => r.kwh > 0 ? acc + r.kwh : acc, 0)
        const totalConsumed = readings.reduce((acc, r) => r.kwh < 0 ? acc + Math.abs(r.kwh) : acc, 0)
        const netEnergy = totalGenerated - totalConsumed

        // Minting stats
        const mintedReadings = readings.filter(r => r.minted)
        const pendingReadings = readings.filter(r => !r.minted && r.kwh > 0)
        const totalMinted = mintedReadings.reduce((acc, r) => acc + r.kwh, 0)
        const pendingToMint = pendingReadings.reduce((acc, r) => acc + r.kwh, 0)

        const lastUpdate = readings.length > 0 ? new Date(readings[0].timestamp) : null

        return {
            totalGenerated: fetchedStats?.total_produced ?? totalGenerated,
            totalConsumed: fetchedStats?.total_consumed ?? totalConsumed,
            netEnergy: fetchedStats ? (fetchedStats.total_produced - fetchedStats.total_consumed) : netEnergy,
            totalMinted: fetchedStats?.total_minted ?? totalMinted,
            pendingToMint: fetchedStats?.pending_mint ?? pendingToMint,
            mintedCount: fetchedStats?.total_minted_count ?? mintedReadings.length,
            pendingCount: fetchedStats?.pending_mint_count ?? pendingReadings.length,
            lastUpdate
        }
    }, [readings, fetchedStats])

    return {
        meters,
        readings,
        loading,
        refreshing,
        mintingReadingId,
        fetchData,
        handleMintTokens,
        copyToClipboard,
        lastRefreshed,
        stats
    }
}
