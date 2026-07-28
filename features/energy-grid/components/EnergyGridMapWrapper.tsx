'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import type { EnergyNode } from '@/types/grid'

const MapComponent = dynamic(
  () => import('@/features/energy-grid/components/EnergyGridMap'),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-b-sm bg-background/50">
        {/* Map Control Skeletons */}
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 w-8 rounded bg-secondary/80 backdrop-blur-sm"
            />
          ))}
        </div>

        {/* Legend Skeleton */}
        <Skeleton className="absolute bottom-6 right-6 z-10 h-32 w-48 rounded-lg bg-secondary/80 backdrop-blur-sm" />

        {/* Stats Panel Skeleton */}
        <Skeleton className="absolute bottom-6 left-6 z-10 h-24 w-80 rounded-lg bg-secondary/80 backdrop-blur-sm" />

        {/* Center content */}
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="animate-pulse text-sm font-medium text-secondary-foreground">
              Initializing Grid...
            </p>
          </div>
        </div>
      </div>
    ),
  }
)

interface EnergyGridMapWrapperProps {
  onTradeFromNode?: (node: EnergyNode) => void
  viewState?: {
    longitude: number
    latitude: number
    zoom: number
  }
  onViewStateChange?: (viewState: {
    longitude: number
    latitude: number
    zoom: number
  }) => void
}

const EnergyGridMapWrapper = React.memo(function EnergyGridMapWrapper({
  onTradeFromNode,
  viewState,
  onViewStateChange,
}: EnergyGridMapWrapperProps) {
  return (
    <div className="h-full w-full">
      <ErrorBoundary name="Energy Grid Map">
        <MapComponent
          onTradeFromNode={onTradeFromNode}
          viewState={viewState}
          onViewStateChange={onViewStateChange}
        />
      </ErrorBoundary>
    </div>
  )
})

export default EnergyGridMapWrapper
