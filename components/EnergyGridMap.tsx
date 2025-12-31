'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Map, { NavigationControl, MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Activity, Maximize2, Minimize2, AlertTriangle, Zap, Radio, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
// import gsap from 'gsap' // Removed in favor of native Mapbox transitions

// Import from energy-grid sub-components
import {
  EnergyFlowLayers,
  LightweightMarker,
  ClusterMarker,
  GridStatsPanel,
  MapLegend,
  useWasmSimulation as useEnergySimulation, // Aliased to minimize code changes
  useMeterMapData,
  useMeterClusters,
  useGridStatus,
  useGridTopology,
} from './energy-grid'
import type { EnergyNode, EnergyTransfer, ClusterOrPoint } from './energy-grid'

// Load config
import energyGridConfig from '@/lib/data/energyGridConfig.json'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Check if token is properly configured
const hasValidToken = MAPBOX_TOKEN && MAPBOX_TOKEN !== 'YOUR_MAPBOX_TOKEN' && MAPBOX_TOKEN.length > 20

const { campus, energyNodes: configNodes, energyTransfers: configTransfers } = energyGridConfig
const staticEnergyNodes = configNodes as EnergyNode[]
const staticEnergyTransfers = configTransfers as EnergyTransfer[]

export default function EnergyGridMap() {
  // View state
  const [viewState, setViewState] = useState({
    longitude: campus.center.longitude,
    latitude: campus.center.latitude,
    zoom: campus.defaultZoom,
  })
  const [selectedNode, setSelectedNode] = useState<EnergyNode | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFlowLines, setShowFlowLines] = useState(true)
  const [showRealMeters, setShowRealMeters] = useState(true) // Toggle for real meters
  const [hoveredFlow, setHoveredFlow] = useState<{
    power: number
    description: string
    x: number
    y: number
  } | null>(null)
  // Track map bounds for clustering
  const [mapBounds, setMapBounds] = useState<[number, number, number, number] | undefined>(undefined)

  const mapRef = useRef<MapRef>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Fetch real meter data only (no static mock nodes)
  const { realMeterNodes, isLoading: metersLoading } = useMeterMapData({
    includeStaticNodes: false,
    refreshIntervalMs: 30000,
  })

  // Fetch aggregate grid status from the API
  const { status: apiGridStatus, isLoading: gridStatusLoading } = useGridStatus(10000)

  // Fetch dynamic grid topology (transformers and lines)
  const { transformers, transfers: topologyTransfers } = useGridTopology()

  // Combine real meters with transformers if showing real data
  const energyNodes = useMemo(() => {
    return showRealMeters
      ? [...realMeterNodes, ...transformers]
      : staticEnergyNodes
  }, [showRealMeters, realMeterNodes, transformers, staticEnergyNodes])

  // Use dynamic transfers if showing real meters, otherwise static config
  const energyTransfers = useMemo(() => {
    return showRealMeters ? topologyTransfers : staticEnergyTransfers
  }, [showRealMeters, topologyTransfers, staticEnergyTransfers])

  // Cluster markers for performance (266+ meters)
  const { clusters, getClusterExpansionZoom } = useMeterClusters({
    nodes: energyNodes,
    zoom: viewState.zoom,
    bounds: mapBounds,
    radius: 50,
    maxZoom: 16,
  })

  // Use the simulation hook with combined nodes
  const { liveNodeData, liveTransferData, gridTotals } = useEnergySimulation({
    energyNodes,
    energyTransfers,
    updateIntervalMs: 10000, // Optimized from 3000ms
  })

  // Handle flow line hover
  const handleFlowHover = useCallback((e: any) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0]
      setHoveredFlow({
        power: feature.properties?.power ?? 0,
        description: feature.properties?.description ?? '',
        x: e.point.x,
        y: e.point.y,
      })
    }
  }, [])

  const handleFlowLeave = useCallback(() => {
    setHoveredFlow(null)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNode) {
        setSelectedNode(null)
      }
      if (e.key === 'r' || e.key === 'R') {
        mapRef.current?.flyTo({
          center: [campus.center.longitude, campus.center.latitude],
          zoom: campus.defaultZoom,
          duration: 1000,
          essential: true
        })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedNode, viewState])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Double click to zoom
  const handleMarkerDoubleClick = (node: EnergyNode) => {
    mapRef.current?.flyTo({
      center: [node.longitude, node.latitude],
      zoom: 18,
      duration: 1000,
      essential: true
    })
    setSelectedNode(node)
  }

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    const element = mapContainerRef.current
    if (!element) return

    try {
      if (!isFullscreen) {
        await element.requestFullscreen?.()
      } else {
        await document.exitFullscreen?.()
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  // Show error if token is missing
  if (!hasValidToken) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-b-sm bg-secondary/20 p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <h3 className="font-semibold text-foreground">Mapbox Token Required</h3>
          <p className="text-sm text-secondary-foreground">
            Set <code className="rounded bg-secondary px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your environment
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={mapContainerRef} className="relative h-full w-full overflow-hidden rounded-b-sm">
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

      {/* Loading state - enhanced skeleton */}
      {(!mapLoaded || metersLoading) && !mapError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-foreground font-medium">
            {!mapLoaded ? 'Loading map...' : 'Loading meters...'}
          </p>
          {metersLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              Fetching {realMeterNodes.length > 0 ? realMeterNodes.length : ''} energy nodes
            </p>
          )}
          {/* Skeleton placeholder markers */}
          <div className="mt-6 flex gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-4 w-4 rounded-full bg-primary/20 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2 text-center p-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-secondary-foreground">{mapError}</p>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => {
          setViewState(evt.viewState)
          // Don't update bounds here to avoid re-clustering on every frame
        }}
        onMoveEnd={(evt) => {
          // Update bounds for clustering only when movement ends
          const bounds = evt.target.getBounds()
          if (bounds) {
            setMapBounds([
              bounds.getWest(),
              bounds.getSouth(),
              bounds.getEast(),
              bounds.getNorth(),
            ])
          }
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setMapLoaded(true)}
        onError={(e: any) => {
          console.error('Map error:', e?.error || e)
          setMapError(e?.error?.message || 'Failed to load map. Check your Mapbox token.')
        }}
        interactiveLayerIds={showFlowLines ? ['energy-flow-line', 'energy-flow-glow'] : []}
        onMouseMove={handleFlowHover}
        onMouseLeave={handleFlowLeave}
        cursor={hoveredFlow ? 'pointer' : 'grab'}
      >
        <NavigationControl position="top-right" />

        {/* Energy Flow Layers */}
        <EnergyFlowLayers
          energyNodes={energyNodes}
          energyTransfers={energyTransfers}
          liveTransferData={liveTransferData}
          visible={showFlowLines}
        />

        {/* Control Buttons */}
        <div className="absolute right-40 top-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 border bg-background/95 p-0 shadow-lg backdrop-blur-md hover:bg-background ${showRealMeters ? 'border-blue-500/50 text-blue-500' : 'border-primary/30 text-primary'
              }`}
            onClick={() => setShowRealMeters(!showRealMeters)}
            title={showRealMeters ? 'Hide my meters' : 'Show my meters'}
          >
            <Radio className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute right-28 top-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 border bg-background/95 p-0 shadow-lg backdrop-blur-md hover:bg-background ${showFlowLines ? 'border-green-500/50 text-green-500' : 'border-primary/30 text-primary'
              }`}
            onClick={() => setShowFlowLines(!showFlowLines)}
            title={showFlowLines ? 'Hide energy flow' : 'Show energy flow'}
          >
            <Activity className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute right-16 top-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 border border-primary/30 bg-background/95 p-0 shadow-lg backdrop-blur-md hover:bg-background"
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

        {/* Node Markers - Clustered for performance */}
        {clusters.map((clusterOrPoint) => {
          // Check if it's a cluster
          if (clusterOrPoint.properties.cluster) {
            return (
              <ClusterMarker
                key={`cluster-${clusterOrPoint.properties.cluster_id}`}
                cluster={clusterOrPoint as any}
                onClick={(clusterId, lng, lat) => {
                  const expansionZoom = getClusterExpansionZoom(clusterId)
                  mapRef.current?.flyTo({
                    center: [lng, lat],
                    zoom: expansionZoom,
                    duration: 500,
                    essential: true
                  })
                }}
              />
            )
          }
          // It's an individual point
          const node = clusterOrPoint.properties.node
          return (
            <LightweightMarker
              key={node.id}
              node={node}
              liveData={liveNodeData[node.id]}
              isSelected={selectedNode?.id === node.id}
              onSelect={setSelectedNode}
              onDoubleClick={handleMarkerDoubleClick}
            />
          )
        })}
      </Map>

      {/* Legend */}
      <MapLegend showFlowLines={showFlowLines} />

      {/* Grid Stats Panel */}
      <GridStatsPanel
        totalGeneration={apiGridStatus?.total_generation ?? gridTotals.totalGeneration}
        totalConsumption={apiGridStatus?.total_consumption ?? gridTotals.totalConsumption}
        avgStorage={gridTotals.avgStorage}
        co2Saved={apiGridStatus?.co2_saved_kg ?? gridTotals.co2Saved}
        activeMeters={apiGridStatus?.active_meters ?? gridTotals.activeMeters}
      />

      {/* Flow Line Hover Tooltip */}
      {hoveredFlow && (
        <div
          className="pointer-events-none absolute z-50 rounded border border-primary/40 bg-background/95 px-3 py-2 shadow-xl backdrop-blur-md"
          style={{
            left: hoveredFlow.x + 15,
            top: hoveredFlow.y - 10,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-bold text-foreground">
              {Math.round(hoveredFlow.power)} kW
            </span>
          </div>
          {hoveredFlow.description && hoveredFlow.description !== `${Math.round(hoveredFlow.power)} kW` && (
            <p className="mt-0.5 text-xs text-secondary-foreground">{hoveredFlow.description}</p>
          )}
        </div>
      )}
    </div>
  )
}

