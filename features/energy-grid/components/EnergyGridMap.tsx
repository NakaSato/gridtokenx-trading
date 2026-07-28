'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Map, { NavigationControl, MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Maximize2, Minimize2, AlertTriangle, Zap, Radio, Loader2, RefreshCw, Map as MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import throttle from 'lodash.throttle'

import { ZonePolygonLayers } from '@/features/energy-grid/components/ZonePolygonLayers'
import { LightweightMarker } from '@/features/energy-grid/components/LightweightMarker'
import { ClusterMarker } from '@/features/energy-grid/components/ClusterMarker'
import { GridStatsPanel } from '@/features/energy-grid/components/GridStatsPanel'
import { MapLegend } from '@/features/energy-grid/components/MapLegend'
import { useActiveTrades } from '@/features/energy-grid/hooks/useActiveTrades'
import { useLiveMeterData } from '@/features/energy-grid/hooks/useLiveMeterData'
import { useMeterMapData } from '@/features/energy-grid/hooks/useMeterMapData'
import { useMeterClusters } from '@/features/energy-grid/hooks/useMeterClusters'
import { useGridStatus } from '@/features/energy-grid/hooks/useGridStatus'
import { useGridTopology } from '@/features/energy-grid/hooks/useGridTopology'
import { useGridFlows } from '@/features/energy-grid/hooks/useGridFlows'
import { useMeterTelemetry } from '@/features/energy-grid/hooks/useMeterTelemetry'
import { useActiveOrderMeters } from '@/features/energy-grid/hooks/useActiveOrderMeters'
import { useMyMeterTotals } from '@/features/energy-grid/hooks/useMyMeterTotals'
import { useMyOwnedMeters } from '@/features/energy-grid/hooks/useMyOwnedMeters'
import { isAccountActive } from '@/features/energy-grid/hooks/utils'
import { useTopology } from '@/features/energy-grid/hooks/useTopology'
import type { EnergyNode } from '@/types/grid'
import type {
  ClusterOrPoint,
  ClusterFeature,
} from '@/features/energy-grid/hooks/useMeterClusters'
import { useAuth } from '@/features/auth/provider'

// Load config
import { CAMPUS_CONFIG } from '@/lib/constants'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Check if token is properly configured
const hasValidToken = MAPBOX_TOKEN && MAPBOX_TOKEN !== 'YOUR_MAPBOX_TOKEN' && MAPBOX_TOKEN.length > 20

interface EnergyGridMapProps {
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

export default function EnergyGridMap({ onTradeFromNode, viewState: propViewState, onViewStateChange }: EnergyGridMapProps) {
  // View state - local fallback if not controlled
  const initialViewState = useMemo(() => {
    return {
      longitude: CAMPUS_CONFIG.center.longitude,
      latitude: CAMPUS_CONFIG.center.latitude,
      zoom: CAMPUS_CONFIG.defaultZoom,
      ...propViewState,
    }
  }, [propViewState])

  const [localViewState, setLocalViewState] = useState(initialViewState)

  // Use controlled state if provided, otherwise local state
  const viewState = propViewState || localViewState

  // Throttled map move handler to prevent excessive re-renders during pan/zoom
  const handleMapMove = useMemo(
    () => throttle((evt: { viewState: { longitude: number; latitude: number; zoom: number } }) => {
      if (onViewStateChange) {
        onViewStateChange(evt.viewState)
      } else {
        setLocalViewState(evt.viewState)
      }
      // Don't update bounds here to avoid re-clustering on every frame
    }, 100, { leading: true, trailing: true }),
    [onViewStateChange]
  )

  const [selectedNode, setSelectedNode] = useState<EnergyNode | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showZones, setShowZones] = useState(true) // Toggle for zone polygons
  const [showRealMeters, setShowRealMeters] = useState(true) // Toggle for real meters
  // Show only meters with a resting buy/sell order. Off → every meter.
  const [showOnlyTradingMeters, setShowOnlyTradingMeters] = useState(true)
  // Track map bounds for clustering
  const [mapBounds, setMapBounds] = useState<[number, number, number, number] | undefined>(undefined)
  // Highlighted path state (array of node IDs for topology)

  const mapRef = useRef<MapRef>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Fetch real meter data only (no static mock nodes)
  const { realMeterNodes: displayMeterNodes, isLoading: displayLoading, error: displayError, refresh: refreshMeters } = useMeterMapData({
    includeStaticNodes: false,
    refreshIntervalMs: 30000,
  })

  // Combined API error state for retry
  const metersError = displayError

  // Fetch aggregate grid status from the API
  const { status: apiGridStatus, isLoading: gridStatusLoading, error: gridStatusError, refresh: refreshGridStatus } = useGridStatus(10000)

  // Combined API error state
  const apiError = metersError || gridStatusError
  const handleRetry = () => {
    if (metersError) refreshMeters()
    if (gridStatusError) refreshGridStatus()
  }

  // Fetch real grid topology (transformers + zones) from the backend.
  const { transformers: displayTransformers } = useGridTopology()

  // Real instantaneous line flows from the backend (no synthetic routing).
  const { transfers: realEnergyTransfers } = useGridFlows(30000)

  // Use WASM topology for path finding
  const { isLoaded: topologyLoaded, loadNetwork } = useTopology()

  // Which meters currently have a resting buy/sell order (auth-gated).
  const { bySerial: tradingMeters, isFilterable: tradingFilterable } = useActiveOrderMeters(30000)

  // Owner filter: the map shows only meters the viewer owns, and only when the
  // viewer's account is activated. Auth-gated — logged out / loading keeps the
  // public fleet (see useMyOwnedMeters.isFilterable).
  const { user } = useAuth()
  const accountActive = isAccountActive(user?.status)
  const { ownedIds, isFilterable: ownedFilterable } = useMyOwnedMeters(30000)

  // Meters actually placed on the map. Two independent auth-gated filters:
  //  1. Owner+active — only the viewer's own meters, only if their account is
  //     activated. A logged-in but not-yet-active account shows none of its own.
  //  2. Trading — only meters with a resting buy/sell order.
  // When a filter can't be applied (logged out, loading, or the request failed)
  // it is skipped — an unknown answer must not read as "you own nothing" /
  // "nothing is trading".
  const visibleMeterNodes = useMemo(() => {
    let nodes = displayMeterNodes
    if (ownedFilterable) {
      nodes = accountActive
        ? nodes.filter((n) => ownedIds.has(n.id) || (n.serial != null && ownedIds.has(n.serial)))
        : []
    }
    if (showOnlyTradingMeters && tradingFilterable) {
      nodes = nodes.filter((n) => tradingMeters.has(n.id))
    }
    return nodes
  }, [displayMeterNodes, ownedFilterable, accountActive, ownedIds, showOnlyTradingMeters, tradingFilterable, tradingMeters])

  // Combine meters with transformers if showing real data
  const energyNodes = useMemo(() => {
    if (!showRealMeters) return []
    const nodes = [...visibleMeterNodes, ...displayTransformers]

    // Grid flows target `transformer-<zone>` and are silently dropped when
    // that node is missing. The topology endpoint doesn't describe zones yet,
    // so synthesize a transformer node at the centroid of each zone's meters.
    // Centroids come from the unfiltered meter set: a transformer anchors its
    // zone's flow lines, so it must not drift (or vanish) just because the
    // trading filter hid the meters around it.
    // (plain record — `Map` is shadowed by the react-map-gl component import)
    const have = new Set(nodes.map((n) => n.id))
    const zoneAccum: Record<number, { lat: number; lng: number; count: number }> = {}
    displayMeterNodes.forEach((m) => {
      if (m.zoneId == null) return
      const z = zoneAccum[m.zoneId] ?? { lat: 0, lng: 0, count: 0 }
      z.lat += m.latitude
      z.lng += m.longitude
      z.count += 1
      zoneAccum[m.zoneId] = z
    })
    Object.entries(zoneAccum).forEach(([zone, z]) => {
      const zoneId = Number(zone)
      const id = `transformer-${zoneId}`
      if (have.has(id)) return
      nodes.push({
        id,
        name: `Transformer Zone ${zoneId}`,
        buildingCode: `TR-${zoneId}`,
        type: 'transformer',
        latitude: z.lat / z.count,
        longitude: z.lng / z.count,
        capacity: '',
        status: 'active',
        zoneId,
      })
    })
    return nodes
  }, [showRealMeters, visibleMeterNodes, displayMeterNodes, displayTransformers])

  // Telemetry-derived flows (surplus/deficit) when showing real meters.
  const energyTransfers = useMemo(() => {
    if (!showRealMeters) return []
    return realEnergyTransfers
  }, [showRealMeters, realEnergyTransfers])

  // Cluster markers for performance (266+ meters)
  const { clusters, getClusterExpansionZoom } = useMeterClusters({
    nodes: energyNodes,
    zoom: viewState.zoom,
    bounds: mapBounds,
    radius: 50,
    maxZoom: 16,
  })

  // Live per-meter telemetry from WS (empty until backend emits it).
  const meterTelemetry = useMeterTelemetry()

  // Map real meter telemetry to live marker/flow data (no client simulation).
  const { liveNodeData, liveTransferData, gridTotals } = useLiveMeterData({
    energyNodes,
    energyTransfers,
    telemetry: meterTelemetry,
  })

  // Gen/Con/Balance scoped to the viewer's OWN meters. Computed from the
  // unfiltered meter list so hiding markers (trading filter) never shrinks the
  // viewer's totals. Null when logged out / no owned meters on the map.
  const { totals: myMeterTotals } = useMyMeterTotals({
    nodes: displayMeterNodes,
    telemetry: meterTelemetry,
  })

  // Load topology network when nodes/transfers change
  useEffect(() => {
    if (topologyLoaded && energyNodes.length > 0) {
      loadNetwork(energyNodes, energyTransfers)
    }
  }, [topologyLoaded, energyNodes, energyTransfers, loadNetwork])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNode) {
        setSelectedNode(null)
      }
      if (e.key === 'r' || e.key === 'R') {
        mapRef.current?.flyTo({
          center: [CAMPUS_CONFIG.center.longitude, CAMPUS_CONFIG.center.latitude],
          zoom: CAMPUS_CONFIG.defaultZoom,
          duration: 1000,
          essential: true
        })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      handleMapMove.cancel() // Cancel pending throttled calls
    }
  }, [selectedNode, viewState, handleMapMove])

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

  // Handle dynamic map resizing (fix for ResizablePanel)
  useEffect(() => {
    if (!mapContainerRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to avoid "ResizeObserver loop limit exceeded"
      // and prevent flickering by aligning with the paint cycle
      if (mapRef.current) {
        requestAnimationFrame(() => {
          mapRef.current?.resize()
        })
      }
    })

    resizeObserver.observe(mapContainerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

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
      {(!mapLoaded || displayLoading) && !mapError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-foreground font-medium">
            {!mapLoaded ? 'Loading map...' : 'Loading meters...'}
          </p>
          {displayLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              Fetching {displayMeterNodes.length > 0 ? displayMeterNodes.length : ''} energy nodes
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

      {/* API Error Banner */}
      {displayError && !mapError && (
        <div className="absolute top-20 sm:top-16 left-1/2 -translate-x-1/2 z-40 w-[90%] sm:w-auto animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 px-3 sm:px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 backdrop-blur-md shadow-lg">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-[11px] sm:text-sm text-red-200">{displayError}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-medium rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewState}
        reuseMaps
        onMove={handleMapMove}
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
        onError={(e: { error?: { message?: string } }) => {
          console.error('Map error:', e?.error || e)
          setMapError(e?.error?.message || 'Failed to load map. Check your Mapbox token.')
        }}
        cursor="grab"
      >
        <NavigationControl position="top-right" />

        {/* Zone Polygon Background Layers */}
        <ZonePolygonLayersWrapper
          energyNodes={energyNodes}
          visible={showZones}
        />

        {/* Control Buttons Group */}
        <div className="absolute right-10 top-2 z-10 flex flex-col sm:flex-row gap-2 sm:right-16 sm:top-4">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 border bg-background/95 p-0 shadow-lg backdrop-blur-md hover:bg-background ${showZones ? 'border-purple-500/50 text-purple-500' : 'border-primary/30 text-primary'
              }`}
            onClick={() => setShowZones(!showZones)}
            title={showZones ? 'Hide zone areas' : 'Show zone areas'}
          >
            <MapIcon className="h-4 w-4" />
          </Button>

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

          {tradingFilterable && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 border bg-background/95 p-0 shadow-lg backdrop-blur-md hover:bg-background ${showOnlyTradingMeters ? 'border-amber-500/50 text-amber-500' : 'border-primary/30 text-primary'
                }`}
              onClick={() => setShowOnlyTradingMeters(!showOnlyTradingMeters)}
              title={showOnlyTradingMeters ? 'Show all meters' : 'Show only meters with open buy/sell orders'}
            >
              <Zap className="h-4 w-4" />
            </Button>
          )}

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

        {/* Node Markers - Clustered and Virtualized for performance */}
        {clusters
          // Viewport virtualization: only render markers within visible bounds + buffer
          .filter((clusterOrPoint) => {
            if (!mapBounds) return true // Render all if bounds not yet available
            const coords = clusterOrPoint.geometry.coordinates
            const [lng, lat] = coords
            // Add 10% buffer around visible bounds to prevent pop-in
            const bufferLng = (mapBounds[2] - mapBounds[0]) * 0.1
            const bufferLat = (mapBounds[3] - mapBounds[1]) * 0.1
            return (
              lng >= mapBounds[0] - bufferLng &&
              lng <= mapBounds[2] + bufferLng &&
              lat >= mapBounds[1] - bufferLat &&
              lat <= mapBounds[3] + bufferLat
            )
          })
          .map((clusterOrPoint) => {
            // Check if it's a cluster
            if (clusterOrPoint.properties.cluster) {
              return (
                <ClusterMarker
                  key={`cluster-${clusterOrPoint.properties.cluster_id}`}
                  cluster={clusterOrPoint as ClusterFeature}
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
                onTradeClick={onTradeFromNode}
              />
            )
          })}
      </Map>

      {/* Legend */}
      <MapLegend
        showZones={showZones}
      />

      {/* Grid Stats Panel */}
      <GridStatsPanel
        totalGeneration={myMeterTotals?.totalGeneration ?? apiGridStatus?.total_generation ?? gridTotals.totalGeneration}
        totalConsumption={myMeterTotals?.totalConsumption ?? apiGridStatus?.total_consumption ?? gridTotals.totalConsumption}
        scope={myMeterTotals ? 'personal' : 'grid'}
        scopedMeterCount={myMeterTotals?.meterCount}
        avgStorage={gridTotals.avgStorage}
        co2Saved={apiGridStatus?.co2_saved_kg ?? gridTotals.co2Saved}
        activeMeters={apiGridStatus?.active_meters ?? gridTotals.activeMeters}
        zones={apiGridStatus?.zones}
        frequency={apiGridStatus?.frequency}
        islandStatus={apiGridStatus?.island_status}
        healthScore={apiGridStatus?.health_score}
        isUnderAttack={apiGridStatus?.is_under_attack}
        tariff={apiGridStatus?.tariff}
        adrEvent={apiGridStatus?.adr_event}
        loadForecast={apiGridStatus?.load_forecast}
        evFleet={apiGridStatus?.ev_fleet}
        peakCapacityKw={apiGridStatus?.peak_capacity_kw}
      />

    </div>
  )
}

// Wrapper component for ZonePolygonLayers that passes active trades
function ZonePolygonLayersWrapper({
  energyNodes,
  visible
}: {
  energyNodes: EnergyNode[]
  visible: boolean
}) {
  const { trades } = useActiveTrades()

  return (
    <ZonePolygonLayers
      energyNodes={energyNodes}
      visible={visible}
      activeTrades={trades}
    />
  )
}