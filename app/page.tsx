'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import TradingViewTopNav from '@/features/trading/components/TradingViewTopNav'
import { tokenList } from '@/lib/data/tokenlist'
import { useSidebar } from '@/components/shared/SidebarContext'

const TradingPositionsPanel = dynamic(
  () => import('@/features/trading/components/TradingPositionsPanel'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-40 animate-pulse rounded bg-secondary" />
          <div className="h-8 w-24 animate-pulse rounded bg-secondary" />
        </div>
        <div className="space-y-2">
          <div className="bg-secondary/30 h-10 w-full animate-pulse rounded" />
          <div className="bg-secondary/30 h-10 w-full animate-pulse rounded" />
          <div className="bg-secondary/30 h-10 w-full animate-pulse rounded" />
        </div>
      </div>
    ),
  }
)

import { usePythPrice } from '@/features/trading/hooks/usePythPrice'
import { usePythMarketData } from '@/features/trading/hooks/usePythMarketData'

const TradeHistory = dynamic(() => import('@/features/trading/components/TradeHistory'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 h-5 w-32 animate-pulse rounded bg-secondary" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="bg-secondary/50 h-4 w-24 animate-pulse rounded" />
            <div className="bg-secondary/50 h-4 w-16 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  ),
})

const EnergyGridMapWrapper = dynamic(
  () => import('@/features/energy-grid/components/EnergyGridMapWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-secondary/20 flex h-full w-full animate-pulse flex-col items-center justify-center rounded-lg">
        <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-secondary-foreground">
          Loading map...
        </p>
      </div>
    ),
  }
)

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

const P2POrderForm = dynamic(() => import('@/features/p2p/components/OrderForm'), {
  ssr: false,
  loading: () => (
    <div className="bg-secondary/50 h-full animate-pulse rounded-lg" />
  ),
})

import type { EnergyNode } from '@/types/grid'
import { CAMPUS_CONFIG } from '@/lib/constants'

export default function Homepage() {
  const [viewState, setViewState] = useState({
    longitude: CAMPUS_CONFIG.center.longitude,
    latitude: CAMPUS_CONFIG.center.latitude,
    zoom: CAMPUS_CONFIG.defaultZoom,
  })

  const [selectedMeterNode, setSelectedMeterNode] = useState<EnergyNode | null>(
    null
  )
  const [tokenIdx, setTokenIdx] = useState(0)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('Crypto.GRX/THB')
  const [selectedLogo, setSelectedLogo] = useState<string>('/svgs/gridx.svg')

  const { showLeftSidebar, showRightSidebar, showPositionsPanel, toggleLeftSidebar, toggleRightSidebar, togglePositionsPanel } = useSidebar()
  const { priceData, loading: priceLoading } = usePythPrice(selectedSymbol)
  const { marketData, loading: marketLoading } =
    usePythMarketData(selectedSymbol)

  const handleViewStateChange = useCallback((newViewState: any) => {
    setViewState(newViewState)
  }, [])

  const handleTradeFromNode = useCallback((node: EnergyNode) => {
    setSelectedMeterNode(node)
  }, [])

  const handleClearNode = useCallback(() => {
    setSelectedMeterNode(null)
  }, [])

  return (
    <>
      <TradingViewTopNav
        symbol={selectedSymbol}
        pythSymbol={tokenList[tokenIdx].pythSymbol}
        logo={selectedLogo}
        priceData={priceData}
        marketData={marketData}
        priceLoading={priceLoading}
        marketLoading={marketLoading}
        type="options"
      />
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden pb-4 pt-2">
        {/* Mobile Layout */}
        <div className="flex h-full flex-col md:hidden">
          <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm duration-700 animate-in fade-in zoom-in-95">
            <EnergyGridMapWrapper
              onTradeFromNode={handleTradeFromNode}
              viewState={viewState}
              onViewStateChange={handleViewStateChange}
            />
          </div>
        </div>

        {/* Desktop Layout - Resizable Panels */}
        <div className="hidden h-full w-full md:flex">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full w-full rounded-lg"
            id="main-panel-group"
          >
            {/* LEFT SIDEBAR - TRADING HISTORY */}
            {showLeftSidebar && (
              <>
                <ResizablePanel
                  id="left-sidebar"
                  order={1}
                  defaultSize={15}
                  minSize={10}
                  maxSize={25}
                >
                  <div className="flex h-full flex-col overflow-y-auto pr-1 duration-700 animate-in fade-in slide-in-from-left-4">
                    <div className="h-full flex-1 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                      <TradeHistory />
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />
              </>
            )}

            {/* CENTER - MAP & POSITIONS */}
            <ResizablePanel
              id="center-area"
              order={2}
              defaultSize={showLeftSidebar && showRightSidebar ? 60 : showLeftSidebar || showRightSidebar ? 80 : 100}
              minSize={40}
            >
              <ResizablePanelGroup
                direction="vertical"
                className="h-full"
                id="center-vertical-group"
              >
                {/* MAP - No Tabs */}
                <ResizablePanel
                  id="center-map"
                  order={1}
                  defaultSize={showPositionsPanel ? 75 : 100}
                  minSize={30}
                >
                  <div className="flex h-full flex-col overflow-hidden">
                    <div className="relative mt-1 min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                      <EnergyGridMapWrapper
                        onTradeFromNode={handleTradeFromNode}
                        viewState={viewState}
                        onViewStateChange={handleViewStateChange}
                      />
                    </div>
                  </div>
                </ResizablePanel>

                {showPositionsPanel && (
                  <>
                    <ResizableHandle withHandle />

                    {/* POSITIONS */}
                    <ResizablePanel
                      id="center-positions"
                      order={2}
                      defaultSize={25}
                      minSize={10}
                      maxSize={40}
                    >
                      <div className="h-full overflow-y-auto pt-2">
                        <TradingPositionsPanel />
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            {showRightSidebar && (
              <>
                <ResizableHandle withHandle />

                {/* RIGHT SIDEBAR */}
                <ResizablePanel
                  id="right-sidebar"
                  order={3}
                  defaultSize={20}
                  minSize={12}
                  maxSize={30}
                >
                  <div className="flex h-full flex-col overflow-y-auto pl-2 text-xs duration-700 animate-in fade-in slide-in-from-right-4">
                    <div id="p2p-order-form" className="flex-1">
                      <P2POrderForm
                        selectedNode={selectedMeterNode}
                        onClearNode={handleClearNode}
                      />
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    </>
  )
}
