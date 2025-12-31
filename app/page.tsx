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

const TradingViewChartContainer = dynamic(
  () => import('@/components/TradingViewChartContainer'),
  { ssr: false }
)
const TradeHistory = dynamic(() => import('@/components/TradeHistory'), {
  ssr: false,
})
import { useOptionsPricing } from '@/hooks/useOptionsPricing'
import { useGreeks } from '@/hooks/useGreeks'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,

} from '@/components/ui/resizable'

// P2P Imports
const OrderBook = dynamic(() => import('@/components/OrderBook'), { ssr: false })
const P2POrderForm = dynamic(() => import('@/components/p2p/OrderForm'), { ssr: false })
const UserOrders = dynamic(() => import('@/components/p2p/UserOrders'), { ssr: false })
const TransactionHistory = dynamic(() => import('@/components/TransactionHistory'), { ssr: false })

export default function Homepage() {
  const [active, setActive] = useState('chart')
  const [tokenIdx, setTokenIdx] = useState(0)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('Crypto.SOL/USD')
  const [positionType, setPositionType] = useState<string>('long')
  const [contractType, setContractType] = useState<'Call' | 'Put'>('Call')
  const [currency, setCurrency] = useState(selectedSymbol)
  const [selectedLogo, setSelectedLogo] = useState<string>('/images/solana.png')
  const { priceData, loading: priceLoading } = usePythPrice(selectedSymbol)
  const { marketData, loading: marketLoading } =
    usePythMarketData(selectedSymbol)
  const [payAmount, setPayAmount] = useState('')
  const [strikePrice, setStrikePrice] = useState('')
  const [expiry, setExpiry] = useState<Date>(addWeeks(new Date(), 1))

  const [transaction, setTransaction] = useState('buy')
  const [tradingMode, setTradingMode] = useState<'derivatives' | 'p2p' | 'transaction'>('derivatives')

  const handleSymbolChange = useCallback((newSymbol: string) => {
    setSelectedSymbol(newSymbol)
  }, [])

  const handleIconChange = useCallback((newIcon: string) => {
    setSelectedLogo(newIcon)
  }, [])

  const handleIndexChange = useCallback((newIdx: number) => {
    if (newIdx === -1) {
      setTradingMode('transaction')
      // Reset active tab for mobile bottom nav if needed
      setActive('transactions')
      return
    }

    // Default behavior for positive indices (switching tokens)
    setTradingMode('derivatives')
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
          {active === 'chart' ? (
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
          ) : active === 'trade' ? (
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-700">
              <P2POrderForm />
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-700 p-2">
              <TradeHistory />
            </div>
          )}
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

            {/* CENTER - CHART & POSITIONS OR P2P ORDERBOOK */}
            <ResizablePanel id="center-area" defaultSize={60} minSize={40}>
              {tradingMode === 'derivatives' ? (
                <ResizablePanelGroup direction="vertical" className="h-full" id="center-vertical-group">
                  {/* CHART */}
                  <ResizablePanel id="center-chart" defaultSize={70} minSize={30}>
                    <div className="flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-95 duration-700 px-2">
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
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* POSITIONS */}
                  <ResizablePanel id="center-positions" defaultSize={30} minSize={15} maxSize={50}>
                    <div className="h-full overflow-y-auto px-2 pt-2">
                      <TradingPositionsPanel />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : tradingMode === 'p2p' ? (
                <div className="flex h-full flex-col space-y-4 overflow-y-auto p-4">
                  <OrderBook />
                  <UserOrders />
                </div>
              ) : (
                <div className="flex h-full flex-col space-y-4 overflow-y-auto p-4 animate-in fade-in zoom-in-95 duration-500">
                  <TransactionHistory />
                </div>
              )}
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
        <div className="grid grid-cols-3 space-x-2">
          <Button
            className={cn(
              active === 'chart'
                ? 'border-primary text-primary'
                : 'text-secondary-foreground',
              'w-full rounded-sm border bg-inherit px-2 py-[6px] text-xs'
            )}
            onClick={() => setActive('chart')}
          >
            Chart
          </Button>
          <Button
            className={cn(
              active === 'trade'
                ? 'border-primary text-primary'
                : 'text-secondary-foreground',
              'w-full rounded-sm border bg-inherit px-2 py-[6px] text-xs'
            )}
            onClick={() => {
              setActive('trade')
              setTradingMode('p2p')
            }}
          >
            Trade
          </Button>
          <Button
            className={cn(
              active === 'transactions'
                ? 'border-primary text-primary'
                : 'text-secondary-foreground',
              'w-full rounded-sm border bg-inherit px-2 py-[6px] text-xs'
            )}
            onClick={() => {
              setActive('transactions')
              setTradingMode('transaction')
            }}
          >
            Transactions
          </Button>
        </div>
      </div>
    </>
  )
}

