import { useMemo, useEffect } from 'react'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export function useSmartMeter() {
    const { token } = useAuth()
    const queryClient = useQueryClient()

    // Fetch all meter data
    const {
        data: meterData = { meters: [], readings: [], fetchedStats: null, totalReadings: 0, hasMoreReadings: false },
        isLoading: loading,
        isRefetching: refreshing,
        refetch: fetchData,
        dataUpdatedAt
    } = useQuery({
        queryKey: ['smartMeter', token],
        queryFn: async () => {
            if (!token) return { meters: [], readings: [], fetchedStats: null, totalReadings: 0, hasMoreReadings: false }

            const client = createApiClient(token)
            const [metersRes, readingsRes, statsRes] = await Promise.all([
                client.getMyMeters(),
                client.getMyReadingsPage(50, 0),
                client.getMeterStats()
            ])

            if (metersRes.error) toast.error(`Meters: ${metersRes.error}`)
            if (readingsRes.error) toast.error(`Readings: ${readingsRes.error}`)

            return {
                meters: metersRes.data || [],
                readings: readingsRes.data?.readings || [],
                fetchedStats: statsRes.data || null,
                totalReadings: readingsRes.data?.total ?? 0,
                hasMoreReadings: readingsRes.data?.hasMore ?? false
            }
        },
        enabled: !!token,
        refetchInterval: 15000, // Poll every 15s (fallback; WS push invalidates instantly)
        refetchIntervalInBackground: false, // pause polling when tab hidden
        refetchOnWindowFocus: true, // refresh when user returns to the tab
        refetchOnReconnect: true, // refresh after network/WS reconnect
        staleTime: 5000,
    })

    const { meters, readings, fetchedStats, totalReadings, hasMoreReadings } = meterData

    // Minting is fully automatic: the Aggregator Bridge mints surplus server-side
    // per 15-min billing bin (aggregator-signed, via Chain Bridge). The UI is
    // read-only for mint state — it surfaces mint_status but never triggers a mint.

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success('Tx signature copied to clipboard!')
        } catch (err) {
            toast.error('Failed to copy')
        }
    }

    // Query's own fetch timestamp — 0 until the first fetch resolves.
    const lastRefreshed = useMemo(
        () => (dataUpdatedAt ? new Date(dataUpdatedAt) : new Date()),
        [dataUpdatedAt]
    )

    // WebSocket real-time updates
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const meterEvents = [
                'MeterReadingReceived',
                'TokensMinted',
                'GridStatusUpdated'
            ]

            if (meterEvents.includes(message.type)) {
                queryClient.invalidateQueries({ queryKey: ['smartMeter'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    // Calculate Stats
    const stats = useMemo(() => {
        const totalProduced = readings.reduce((acc, r) => r.kwh > 0 ? acc + r.kwh : acc, 0)
        const totalConsumed = readings.reduce((acc, r) => r.kwh < 0 ? acc + Math.abs(r.kwh) : acc, 0)
        const netEnergy = totalProduced - totalConsumed

        const mintedReadings = readings.filter(r => r.mint_status === 'minted')
        const pendingReadings = readings.filter(r => r.mint_status === 'pending' && r.kwh > 0)
        const totalMinted = mintedReadings.reduce((acc, r) => acc + r.kwh, 0)
        const pendingToMint = pendingReadings.reduce((acc, r) => acc + r.kwh, 0)

        const lastUpdate = readings.length > 0 ? new Date(readings[0].timestamp) : null

        return {
            totalGenerated: fetchedStats?.total_produced ?? totalProduced,
            totalConsumed: fetchedStats?.total_consumed ?? totalConsumed,
            netEnergy: fetchedStats ? (fetchedStats.total_produced - fetchedStats.total_consumed) : netEnergy,
            // meter-service stats expose counts only; kWh sums stay client-derived.
            totalMinted,
            pendingToMint,
            mintedCount: fetchedStats?.minted_count ?? mintedReadings.length,
            pendingCount: fetchedStats?.pending_count ?? pendingReadings.length,
            lastUpdate
        }
    }, [readings, fetchedStats])

    // On-Chain Data Fetching
    // We can fetch the MeterAccount from Registry to compare with DB
    /*
    useEffect(() => {
        if (registryProgram && meters.length > 0) {
            // Fetch meter account
            // const meterId = meters[0].id
            // Derive PDA...
            // registryProgram.account.meterAccount.fetch(pda).then(...)
        }
    }, [registryProgram, meters])
    */

    return {
        meters,
        readings,
        totalReadings,
        hasMoreReadings,
        loading,
        refreshing: refreshing && !loading, // Show refreshing only if not initial loading
        fetchData: () => fetchData(),
        copyToClipboard,
        lastRefreshed,
        stats
    }
}
