'use client'
import { useEffect, useState } from 'react'

export default function EnergyGridMapWrapper() {
  const [MapComponent, setMapComponent] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Only import and render on client side after component is mounted
    if (typeof window !== 'undefined') {
      import('./EnergyGridMap')
        .then((mod) => {
          setMapComponent(() => mod.default)
        })
        .catch((err) => {
          console.error('Failed to load map:', err)
        })
    }
  }, [])

  if (!isMounted || !MapComponent) {
    return (
      <div className="bg-secondary/50 flex h-full w-full items-center justify-center rounded-b-sm border">
        <div className="text-center">
          <p className="text-sm text-secondary-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <MapComponent />
    </div>
  )
}
