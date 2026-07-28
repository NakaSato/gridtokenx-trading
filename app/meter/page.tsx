'use client'
import { useState } from 'react'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import { Button } from '@/components/ui/button'

import { MeterRegistrationModal } from '@/features/meter/components/MeterRegistrationModal'
import { MeterHeader } from '@/features/meter/components/MeterHeader'
import { useSmartMeter } from '@/features/meter/hooks/useSmartMeter'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import dynamic from 'next/dynamic'
import { Spinner } from '@/components/ui/spinner'

// Lazy load heavy components with skeletons
const MeterStats = dynamic(
  () =>
    import('@/features/meter/components/MeterStats').then(
      (m) => m.MemoizedMeterStats
    ),
  {
    loading: () => (
      <div className="flex h-32 items-center justify-center">
        <Spinner className="h-6 w-6 text-muted-foreground" />
      </div>
    ),
  }
)

const ReadingsList = dynamic(
  () =>
    import('@/features/meter/components/ReadingsList').then(
      (m) => m.MemoizedReadingsList
    ),
  {
    loading: () => (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="h-6 w-6 text-muted-foreground" />
      </div>
    ),
  }
)

const MeterList = dynamic(
  () =>
    import('@/features/meter/components/MeterList').then(
      (m) => m.MemoizedMeterList
    ),
  {
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-muted-foreground" />
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
    stats,
  } = useSmartMeter()

  const [activeTab, setActiveTab] = useState('readings')
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  return (
    <ProtectedRoute requireWallet={false} requireAuth={true}>
      <main className="flex h-[calc(100vh-4rem)] flex-1 flex-col gap-6 overflow-hidden p-6">
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

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-4 flex flex-none items-center border-b pb-2">
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
              <div className="flex min-h-0 flex-1 flex-col">
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
              <div className="min-h-0 flex-1 overflow-y-auto">
                <MeterList meters={meters} loading={loading} />
              </div>
            )}
          </ErrorBoundary>
        </div>
      </main>
    </ProtectedRoute>
  )
}
