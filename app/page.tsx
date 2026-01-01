'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import CryptoNav from '@/components/CryptoNav'
const TradingPositionsPanel = dynamic(
  () => import('@/components/TradingPositionsPanel'),
  { ssr: false }
)
import { usePythPrice } from '@/hooks/usePythPrice'
import { usePythMarketData } from '@/hooks/usePythMarketData'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { addWeeks } from 'date-fns'
import { Map, TrendingUp, BarChart3 } from 'lucide-react'

const TradingViewChartContainer = dynamic(
  () => import('@/components/TradingViewChartContainer'),
  { ssr: false }
)
const TradeHistory = dynamic(() => import('@/components/TradeHistory'), {
  ssr: false,
})
const EnergyGridMapWrapper = dynamic(
  () => import('@/components/EnergyGridMapWrapper'),
  { ssr: false }
)
import { useOptionsPricing } from '@/hooks/useOptionsPricing'
import { useGreeks } from '@/hooks/useGreeks'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,

} from '@/components/ui/resizable'
import P2POrderForm from '@/components/p2p/OrderForm'

export default function Homepage() {
  const [active, setActive] = useState('map')
  const [tokenIdx, setTokenIdx] = useState(0)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('Crypto.SOL/USD')
  const [positionType, setPositionType] = useState<string>('long')
  const [contractType, setContractType] = useState<'Call' | 'Put'>('Call')
  const [selectedLogo, setSelectedLogo] = useState<string>('/images/solana.png')
  const { priceData, loading: priceLoading } = usePythPrice(selectedSymbol)
  const { marketData, loading: marketLoading } =
    usePythMarketData(selectedSymbol)
  const [payAmount, setPayAmount] = useState('')
  const [strikePrice, setStrikePrice] = useState('')
  const [expiry, setExpiry] = useState<Date>(addWeeks(new Date(), 1))
  const [currency, setCurrency] = useState(selectedSymbol)
  const [transaction, setTransaction] = useState('buy')

  const handleSymbolChange = useCallback((newSymbol: string) => {
    setSelectedSymbol(newSymbol)
  }, [])

  const handleIconChange = useCallback((newIcon: string) => {
    setSelectedLogo(newIcon)
  }, [])

  const handleIndexChange = useCallback((newIdx: number) => {
    setTokenIdx(newIdx)
  }, [])

  const s = priceData.price ?? 0
  const k = parseFloat(strikePrice)

  const premium = useOptionsPricing({
    type: contractType,
    currentPrice: s,
    strikePrice: k,
    expiryDate: expiry,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const greeks = useGreeks({
    type: contractType,
    currentPrice: s,
    strikePrice: k,
    expiryDate: expiry,
  })

  return (
    <>
      <CryptoNav
        onSymbolChange={handleSymbolChange}
        onIconChange={handleIconChange}
        onIdxChange={handleIndexChange}
        active={tokenIdx}
        selectedSymbol={selectedSymbol}
        priceData={priceData}
        marketData={marketData}
        priceLoading={priceLoading}
        marketLoading={marketLoading}
        type="options"
      />
      <div
        className={cn(
          active === 'trade' ? 'space-y-0' : 'space-y-2 md:space-y-4',
          'flex w-full flex-1 flex-col overflow-hidden pb-4 min-h-0'
        )}
      >
        {/* Mobile Layout - Grid */}
        <div className="flex flex-col h-full pt-4 md:hidden">
          {active === 'map' ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-700">
              <EnergyGridMapWrapper />
            </div>
          ) : active === 'chart' ? (
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto animate-in fade-in zoom-in-95 duration-700">
              <div className="min-h-0 flex-1 flex flex-col">
                <TradingViewChartContainer
                  symbol={selectedSymbol}
                  logo={selectedLogo}
                  premium={premium.premium.toString()}
                  investment={payAmount}
                  strikePrice={strikePrice}
                  currentPrice={priceData.price!}
                  positionType={positionType}
                  contractType={contractType}
                  expiry={expiry}
                />
              </div>
              <TradingPositionsPanel />
            </div>
          ) : active === 'pnl' ? (
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-700 p-2">
              <TradeHistory />
            </div>
          ) : null}
        </div>

        {/* Desktop Layout - Resizable Panels */}
        <div className="hidden md:flex h-full w-full">
          <ResizablePanelGroup direction="horizontal" className="h-full w-full rounded-lg" id="main-panel-group">
            {/* LEFT SIDEBAR - TRADING HISTORY */}
            <ResizablePanel id="left-sidebar" defaultSize={15} minSize={10} maxSize={25}>
              <div className="h-full flex-col space-y-4 overflow-y-auto flex animate-in fade-in slide-in-from-left-4 duration-700 pr-2">
                <TradeHistory />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* CENTER - CHART & POSITIONS */}
            <ResizablePanel id="center-area" defaultSize={60} minSize={40}>
              <ResizablePanelGroup direction="vertical" className="h-full" id="center-vertical-group">
                {/* CHART */}
                <ResizablePanel id="center-chart" defaultSize={70} minSize={30}>
                  <div className="flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-95 duration-700 px-2">
                    <div className="flex-1 min-h-0">
                      {active === 'map' ? (
                        <EnergyGridMapWrapper />
                      ) : (
                        <TradingViewChartContainer
                          symbol={selectedSymbol}
                          logo={selectedLogo}
                          premium={premium.premium.toString()}
                          investment={payAmount}
                          strikePrice={strikePrice}
                          currentPrice={priceData.price!}
                          positionType={positionType}
                          contractType={contractType}
                          expiry={expiry}
                        />
                      )}
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* POSITIONS */}
                <ResizablePanel id="center-positions" defaultSize={30} minSize={15} maxSize={50}>
                  <div className="h-full overflow-y-auto px-2 pt-2">
                    <TradingPositionsPanel />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* RIGHT SIDEBAR */}
            <ResizablePanel id="right-sidebar" defaultSize={20} minSize={12} maxSize={30}>
              <div className="flex flex-col space-y-2 h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-700 pl-1 pr-1 text-xs">
                <P2POrderForm />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div >
      <div className="sticky bottom-0 z-10 w-full border-t bg-background p-3 pb-10 lg:hidden">
        <div className="grid grid-cols-3 gap-2">
          <Button
            className={cn(
              active === 'map'
                ? 'border-primary text-primary bg-primary/10'
                : 'text-secondary-foreground',
              'w-full rounded-sm border bg-inherit px-2 py-[6px] text-xs flex items-center justify-center gap-1.5'
            )}
            onClick={() => setActive('map')}
          >
            <Map size={14} />
            Map
          </Button>
          <Button
            className={cn(
              active === 'chart'
                ? 'border-primary text-primary bg-primary/10'
                : 'text-secondary-foreground',
              'w-full rounded-sm border bg-inherit px-2 py-[6px] text-xs flex items-center justify-center gap-1.5'
            )}
            onClick={() => setActive('chart')}
          >
            <TrendingUp size={14} />
            Chart
          </Button>
          <Button
            className={cn(
              active === 'pnl'
                ? 'border-primary text-primary bg-primary/10'
                : 'text-secondary-foreground',
              'w-full rounded-sm border bg-inherit px-2 py-[6px] text-xs flex items-center justify-center gap-1.5'
            )}
            onClick={() => setActive('pnl')}
          >
            <BarChart3 size={14} />
            P&L
          </Button>
        </div>
      </div>
    </>
  )
}
