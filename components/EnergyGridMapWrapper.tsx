'use client'
import dynamic from 'next/dynamic'
import ErrorBoundary from './ui/ErrorBoundary'

const MapComponent = dynamic(() => import('./EnergyGridMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-secondary/50 flex h-full w-full items-center justify-center rounded-b-sm border">
      <div className="text-center">
        <p className="text-sm text-secondary-foreground">Loading map...</p>
      </div>
    </div>
  ),
})

export default function EnergyGridMapWrapper() {
  return (
    <div className="h-full w-full">
      <ErrorBoundary name="Energy Grid Map">
        <MapComponent />
      </ErrorBoundary>
    </div>
  )
}
