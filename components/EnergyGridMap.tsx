'use client'
import { useState, useEffect, useRef } from 'react'
import Map, {
  Marker,
  NavigationControl,
  Source,
  Layer,
} from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  Zap,
  Battery,
  BatteryCharging,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import energyGridConfig from '@/lib/data/energyGridConfig.json'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import gsap from 'gsap'

interface EnergyNode {
  id: string
  name: string
  buildingCode?: string
  type: 'generator' | 'storage' | 'consumer'
  longitude: number
  latitude: number
  capacity: string
  status: 'active' | 'idle' | 'maintenance'
  // Generator specific
  currentOutput?: string
  solarPanels?: number
  panelType?: string
  efficiency?: string
  peakGeneration?: string
  tiltAngle?: string
  orientation?: string
  // Storage specific
  currentCharge?: string
  batteryType?: string
  batteryPacks?: number
  chargeRate?: string
  dischargeRate?: string
  cycleCount?: number
  temperature?: string
  // Consumer specific
  currentLoad?: string
  floors?: number
  area?: string
  occupancy?: string
  hvacSystem?: string
  lighting?: string
  avgDailyConsumption?: string
  peakDemand?: string
  laboratories?: number
  studySeats?: number
  specialEquipment?: string
  // Common
  installDate?: string
  lastMaintenance?: string
  lastUpgrade?: string
}

interface EnergyTransfer {
  from: string
  to: string
  power: number // in kW
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN'

// Load energy grid data from config
const {
  campus,
  energyNodes: configNodes,
  energyTransfers: configTransfers,
} = energyGridConfig
const energyNodes = configNodes as EnergyNode[]
const energyTransfers = configTransfers as EnergyTransfer[]

export default function EnergyGridMap() {
  const [viewState, setViewState] = useState({
    longitude: campus.center.longitude,
    latitude: campus.center.latitude,
    zoom: campus.defaultZoom,
  })
  const [selectedNode, setSelectedNode] = useState<EnergyNode | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNode) {
        setSelectedNode(null)
      }
      if (e.key === 'r' || e.key === 'R') {
        // Animate reset view with GSAP
        gsap.to(viewState, {
          longitude: campus.center.longitude,
          latitude: campus.center.latitude,
          zoom: campus.defaultZoom,
          duration: 1,
          ease: 'power2.inOut',
          onUpdate: () => {
            setViewState({ ...viewState })
          },
        })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedNode, viewState])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Double click on marker to zoom
  const handleMarkerDoubleClick = (node: EnergyNode) => {
    // Animate zoom with GSAP
    const newZoom = 18
    gsap.to(viewState, {
      longitude: node.longitude,
      latitude: node.latitude,
      zoom: newZoom,
      duration: 1,
      ease: 'power2.inOut',
      onUpdate: () => {
        setViewState({ ...viewState })
      },
    })
    setSelectedNode(node)
  }

  const toggleFullscreen = async () => {
    const element = mapContainerRef.current

    if (!element) return

    try {
      if (!isFullscreen) {
        if (element.requestFullscreen) {
          await element.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'generator':
        return <Zap className="h-4 w-4 text-yellow-500" />
      case 'storage':
        return <BatteryCharging className="h-4 w-4 text-green-500" />
      case 'consumer':
        return <Battery className="h-4 w-4 text-blue-500" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      case 'maintenance':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div
      ref={mapContainerRef}
      className="relative h-full w-full overflow-hidden rounded-b-sm"
    >
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary-rgb, 59, 130, 246), 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary-rgb, 59, 130, 246), 0.7);
        }
      `}</style>
      {!mapLoaded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
          <p className="text-foreground">Loading map...</p>
        </div>
      )}
      <Map
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => {
          console.log('Map loaded successfully')
          setMapLoaded(true)
        }}
        onError={(e: any) => console.error('Map error:', e)}
      >
        <NavigationControl position="top-right" />

        {/* Fullscreen Toggle Button */}
        <div className="absolute right-16 top-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="bg-background/95 h-8 w-8 border border-primary/30 p-0 shadow-lg backdrop-blur-md hover:bg-background"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 text-primary" />
            ) : (
              <Maximize2 className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>

        {energyNodes.map((node) => (
          <Marker
            key={node.id}
            longitude={node.longitude}
            latitude={node.latitude}
          >
            <Popover
              open={selectedNode?.id === node.id}
              onOpenChange={(open) => {
                if (!open) setSelectedNode(null)
              }}
            >
              <PopoverTrigger asChild>
                <div
                  className="group relative cursor-pointer transition-all duration-300 hover:scale-125"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    setSelectedNode(node)
                  }}
                  onDoubleClick={(e: any) => {
                    e.stopPropagation()
                    handleMarkerDoubleClick(node)
                  }}
                  title={`${node.name} - Double click to zoom`}
                >
                  {/* Pulsing outer ring */}
                  <div
                    className={`absolute inset-0 rounded-full ${getStatusColor(
                      node.status
                    )} animate-ping opacity-30`}
                  />
                  {/* Status indicator */}
                  <div
                    className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${getStatusColor(
                      node.status
                    )} z-10 animate-pulse border border-background`}
                  />
                  {/* Main marker */}
                  <div className="from-background/95 to-background/80 relative rounded-full border border-primary/60 bg-gradient-to-br p-2 shadow-xl backdrop-blur-md transition-all group-hover:border-primary group-hover:shadow-primary/50">
                    {getMarkerIcon(node.type)}
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
                </div>
              </PopoverTrigger>
              {selectedNode?.id === node.id && (
                <PopoverContent
                  className="min-w-[280px] max-w-[320px] border border-primary/40 p-0"
                  side="top"
                  align="center"
                  sideOffset={10}
                >
                  <div className="to-background/95 relative bg-gradient-to-br from-background p-4 text-foreground">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-6 w-6 p-0"
                      onClick={() => setSelectedNode(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <h3 className="mb-2 flex items-center gap-2 pr-8 text-base font-bold text-primary">
                      {getMarkerIcon(selectedNode.type)}
                      <span className="flex-1">{selectedNode.name}</span>
                    </h3>
                    {selectedNode.buildingCode && (
                      <p className="mb-3 font-mono text-xs text-secondary-foreground">
                        {selectedNode.buildingCode}
                      </p>
                    )}

                    <div className="custom-scrollbar max-h-[400px] space-y-1 overflow-y-auto text-xs">
                      {/* Status Section */}
                      <div className="bg-secondary/20 space-y-1 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-secondary-foreground">
                            Type:
                          </span>
                          <span className="font-semibold capitalize text-foreground">
                            {selectedNode.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-secondary-foreground">
                            Status:
                          </span>
                          <span className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${getStatusColor(
                                selectedNode.status
                              )} animate-pulse`}
                            />
                            <span className="font-semibold capitalize text-foreground">
                              {selectedNode.status}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-secondary-foreground">
                            Capacity:
                          </span>
                          <span className="font-semibold text-foreground">
                            {selectedNode.capacity}
                          </span>
                        </div>
                      </div>

                      {/* Building Details */}
                      {(selectedNode.floors ||
                        selectedNode.area ||
                        selectedNode.occupancy) && (
                        <div className="bg-secondary/20 space-y-1.5 rounded-lg p-2">
                          <h4 className="mb-1 font-semibold text-foreground">
                            Building Info
                          </h4>
                          {selectedNode.floors && (
                            <div className="flex items-center justify-between">
                              <span className="text-secondary-foreground">
                                Floors:
                              </span>
                              <span className="font-semibold text-foreground">
                                {selectedNode.floors}
                              </span>
                            </div>
                          )}
                          {selectedNode.area && (
                            <div className="flex items-center justify-between">
                              <span className="text-secondary-foreground">
                                Area:
                              </span>
                              <span className="font-semibold text-foreground">
                                {selectedNode.area}
                              </span>
                            </div>
                          )}
                          {selectedNode.occupancy && (
                            <div className="flex items-center justify-between">
                              <span className="text-secondary-foreground">
                                Use:
                              </span>
                              <span className="font-semibold text-foreground">
                                {selectedNode.occupancy}
                              </span>
                            </div>
                          )}
                          {selectedNode.studySeats && (
                            <div className="flex items-center justify-between">
                              <span className="text-secondary-foreground">
                                Seats:
                              </span>
                              <span className="font-semibold text-foreground">
                                {selectedNode.studySeats}
                              </span>
                            </div>
                          )}
                          {selectedNode.laboratories && (
                            <div className="flex items-center justify-between">
                              <span className="text-secondary-foreground">
                                Labs:
                              </span>
                              <span className="font-semibold text-foreground">
                                {selectedNode.laboratories}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              )}
            </Popover>
          </Marker>
        ))}
      </Map>

      {/* Legend */}
      <div className="from-background/95 to-background/90 absolute bottom-8 left-2 rounded border border-primary/30 bg-gradient-to-br p-2 text-xs shadow-xl backdrop-blur-md">
        <h4 className="mb-1 text-[10px] font-bold text-foreground">Legend</h4>
        <div className="space-y-0.5">
          <div className="hover:bg-secondary/20 flex cursor-pointer items-center gap-1 rounded p-0.5 transition-colors">
            <div className="rounded-full border border-yellow-500/40 bg-yellow-500/20 p-0.5">
              <Zap className="h-2 w-2 text-yellow-500" />
            </div>
            <span className="text-[9px] font-medium text-secondary-foreground">
              Prosumer
            </span>
          </div>
          <div className="hover:bg-secondary/20 flex cursor-pointer items-center gap-1 rounded p-0.5 transition-colors">
            <div className="rounded-full border border-green-500/40 bg-green-500/20 p-0.5">
              <BatteryCharging className="h-2 w-2 text-green-500" />
            </div>
            <span className="text-[9px] font-medium text-secondary-foreground">
              Storage
            </span>
          </div>
          <div className="hover:bg-secondary/20 flex cursor-pointer items-center gap-1 rounded p-0.5 transition-colors">
            <div className="rounded-full border border-blue-500/40 bg-blue-500/20 p-0.5">
              <Battery className="h-2 w-2 text-blue-500" />
            </div>
            <span className="text-[9px] font-medium text-secondary-foreground">
              Consumer
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
