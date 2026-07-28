"use client"

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { MeterRegistrationModal } from '@/features/meter/components/MeterRegistrationModal'
import { MeterHeader } from '@/features/meter/components/MeterHeader'
import { useSmartMeter } from '@/hooks/useSmartMeter'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import dynamic from 'next/dynamic'

// Lazy load heavy components with skeletons
const MeterStats = dynamic(
  () => import('@/features/meter/components/MeterStats').then(m => m.MemoizedMeterStats),
  {
    loading: () => (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

const ReadingsList = dynamic(
  () => import('@/features/meter/components/ReadingsList').then(m => m.MemoizedReadingsList),
  {
    loading: () => (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

const MeterList = dynamic(
  () => import('@/features/meter/components/MeterList').then(m => m.MemoizedMeterList),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

export default function SmartMeterPage() {
    const {
        meters,
        readings,
        totalReadings,
        hasMoreReadings,
        loading,
        refreshing,
        fetchData,
        copyToClipboard,
        lastRefreshed,
        stats
    } = useSmartMeter()

    const [activeTab, setActiveTab] = useState("readings")
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)

    return (
        <ProtectedRoute requireWallet={false} requireAuth={true}>
            <main className="flex h-[calc(100vh-4rem)] flex-1 flex-col gap-6 p-6 overflow-hidden">

                {/* Header */}
                <MeterHeader
                    meterCount={meters.length}
                    lastRefreshed={lastRefreshed}
                    refreshing={refreshing}
                    onRefresh={() => fetchData()}
                    onRegister={() => setIsRegisterOpen(true)}
                />

                <MeterRegistrationModal
                    isOpen={isRegisterOpen}
                    onClose={() => setIsRegisterOpen(false)}
                    onSuccess={fetchData}
                />

                <ErrorBoundary name="Meter Stats">
                    <MeterStats
                        totalGenerated={stats.totalGenerated}
                        totalMinted={stats.totalMinted}
                        mintedCount={stats.mintedCount}
                        pendingToMint={stats.pendingToMint}
                        pendingCount={stats.pendingCount}
                        netEnergy={stats.netEnergy}
                        meterCount={meters.length}
                        lastUpdate={stats.lastUpdate}
                        lastRefreshed={lastRefreshed}
                    />
                </ErrorBoundary>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center border-b pb-2 mb-4 flex-none">
                        <Button
                            variant={activeTab === 'readings' ? 'secondary' : 'ghost'}
                            onClick={() => setActiveTab('readings')}
                            className="mr-2 rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground"
                            data-state={activeTab === 'readings' ? 'active' : ''}
                        >
                            Recent Readings
                        </Button>
                        <Button
                            variant={activeTab === 'meters' ? 'secondary' : 'ghost'}
                            onClick={() => setActiveTab('meters')}
                            className="rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground"
                            data-state={activeTab === 'meters' ? 'active' : ''}
                        >
                            My Meters
                        </Button>
                    </div>

                    <ErrorBoundary name="Meter Lists">
                        {activeTab === 'readings' && (
                            <div className="flex-1 min-h-0 flex flex-col">
                                <ReadingsList
                                    readings={readings}
                                    meters={meters}
                                    loading={loading}
                                    onCopy={copyToClipboard}
                                    serverTotal={totalReadings}
                                    hasMoreOnServer={hasMoreReadings}
                                />
                            </div>
                        )}

                        {activeTab === 'meters' && (
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <MeterList
                                    meters={meters}
                                    loading={loading}
                                />
                            </div>
                        )}
                    </ErrorBoundary>
                </div>
            </main>
        </ProtectedRoute>
    )
}
