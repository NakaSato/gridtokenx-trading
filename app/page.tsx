'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import TradingViewTopNav from '@/components/TradingViewTopNav'
import { tokenList } from '@/lib/data/tokenlist'

const TradingPositionsPanel = dynamic(
  () => import('@/components/TradingPositionsPanel'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-40 animate-pulse rounded bg-secondary" />
          <div className="h-8 w-24 animate-pulse rounded bg-secondary" />
        </div>
        <div className="space-y-2">
          <div className="h-10 w-full animate-pulse rounded bg-secondary/30" />
          <div className="h-10 w-full animate-pulse rounded bg-secondary/30" />
          <div className="h-10 w-full animate-pulse rounded bg-secondary/30" />
        </div>
      </div>
    )
  }
)

import { usePythPrice } from '@/hooks/usePythPrice'
import { usePythMarketData } from '@/hooks/usePythMarketData'
import { Map } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'

const TradeHistory = dynamic(() => import('@/components/TradeHistory'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="h-5 w-32 animate-pulse rounded bg-secondary mb-4" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-secondary/50" />
            <div className="h-4 w-16 animate-pulse rounded bg-secondary/50" />
          </div>
        ))}
      </div>
    </div>
  )
})

const EnergyGridMapWrapper = dynamic(
  () => import('@/components/EnergyGridMapWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-secondary/20 rounded-lg flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
        <p className="text-secondary-foreground text-sm font-medium">Loading map...</p>
      </div>
    )
  }
)

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

const P2POrderForm = dynamic(
  () => import('@/components/p2p/OrderForm'),
  { ssr: false, loading: () => <div className="h-full animate-pulse bg-secondary/50 rounded-lg" /> }
)

const P2PStatus = dynamic(
  () => import('@/components/p2p/P2PStatus'),
  { ssr: false, loading: () => <div className="h-32 animate-pulse bg-secondary/50 rounded-lg mb-4" /> }
)

import type { EnergyNode } from '@/components/energy-grid/types'
import { CAMPUS_CONFIG } from '@/lib/constants'

export default function Homepage() {
  const [viewState, setViewState] = useState({
    longitude: CAMPUS_CONFIG.center.longitude,
    latitude: CAMPUS_CONFIG.center.latitude,
    zoom: CAMPUS_CONFIG.defaultZoom
  })

  const [selectedMeterNode, setSelectedMeterNode] = useState<EnergyNode | null>(null)
  const [tokenIdx, setTokenIdx] = useState(0)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('Crypto.GRX/THB')
  const [selectedLogo, setSelectedLogo] = useState<string>('/svgs/gridx.svg')

  const { priceData, loading: priceLoading } = usePythPrice(selectedSymbol)
  const { marketData, loading: marketLoading } = usePythMarketData(selectedSymbol)
  const { token } = useAuth()

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
      <div className="flex w-full flex-1 flex-col overflow-hidden pt-2 pb-4 min-h-0">
        {/* Mobile Layout */}
        <div className="flex flex-col h-full md:hidden">
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-700 border border-border rounded-lg bg-card shadow-sm">
            <EnergyGridMapWrapper
              onTradeFromNode={handleTradeFromNode}
              viewState={viewState}
              onViewStateChange={handleViewStateChange}
            />
          </div>
        </div>

        {/* Desktop Layout - Resizable Panels */}
        <div className="hidden md:flex h-full w-full">
          <ResizablePanelGroup direction="horizontal" className="h-full w-full rounded-lg" id="main-panel-group">
            {/* LEFT SIDEBAR - TRADING HISTORY */}
            <ResizablePanel id="left-sidebar" defaultSize={15} minSize={10} maxSize={25}>
              <div className="h-full flex-col overflow-y-auto flex animate-in fade-in slide-in-from-left-4 duration-700 pr-1">
                <div className="flex-1 h-full border border-border rounded-lg bg-card overflow-hidden shadow-sm">
                  <TradeHistory />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* CENTER - MAP & POSITIONS */}
            <ResizablePanel id="center-area" defaultSize={65} minSize={40}>
              <ResizablePanelGroup direction="vertical" className="h-full" id="center-vertical-group">
                {/* MAP */}
                <ResizablePanel id="center-map" defaultSize={75} minSize={30}>
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex-1 min-h-0 border border-border rounded-lg bg-card overflow-hidden shadow-sm">
                      <EnergyGridMapWrapper
                        onTradeFromNode={handleTradeFromNode}
                        viewState={viewState}
                        onViewStateChange={handleViewStateChange}
                      />
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* POSITIONS */}
                <ResizablePanel id="center-positions" defaultSize={25} minSize={15} maxSize={50}>
                  <div className="h-full overflow-y-auto pt-2">
                    <TradingPositionsPanel />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* RIGHT SIDEBAR */}
            <ResizablePanel id="right-sidebar" defaultSize={20} minSize={12} maxSize={30}>
              <div className="flex flex-col h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-700 pl-2 text-xs">
                <div className="flex-1 border border-border rounded-lg bg-card p-3 shadow-sm">
                  <P2POrderForm
                    selectedNode={selectedMeterNode}
                    onClearNode={handleClearNode}
                  />
                  {token && (
                    <>
                      <div className="py-2"></div>
                      <P2PStatus />
                    </>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </>
  )
}
