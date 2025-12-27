'use client'
import { useState, useEffect } from 'react'
import CryptoNav from '@/components/CryptoNav'
import TradingViewChartContainer from '@/components/TradingViewChartContainer'
import ProtectedRoute from '@/components/ProtectedRoute'
import TradingPositionsFallback from '@/components/TradingPositionsFallback'
import TradingPositions from '@/components/TradingPositions'
import PriceQuote from '@/components/PriceQuote'
import GreekPopup from '@/components/GreekPopup'
import TradeHistory from '@/components/TradeHistory'
import { usePythPrice } from '@/hooks/usePythPrice'
import { usePythMarketData } from '@/hooks/usePythMarketData'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import OptionCardContainer from '@/components/OptionCardContainer'
import { addWeeks } from 'date-fns'
import { useOptionsPricing } from '@/hooks/useOptionsPricing'
import { useGreeks } from '@/hooks/useGreeks'

export default function Homepage() {
  const [active, setActive] = useState('chart')
  const [centerTab, setCenterTab] = useState<'chart' | 'map'>('chart')
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

  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol)
  }

  const handleIconChange = (newIcon: string) => {
    setSelectedLogo(newIcon)
  }

  const handleIndexChange = (newIdx: number) => {
    setTokenIdx(newIdx)
  }

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
        <div className="grid w-full h-full grid-cols-1 gap-4 pt-4 md:grid-cols-12">
          {/* LEFT SIDEBAR - TRADING HISTORY */}
          <div className="hidden h-full flex-col space-y-4 overflow-y-auto md:col-span-3 lg:col-span-2 md:flex animate-in fade-in slide-in-from-left-4 duration-700">
            <TradeHistory />
          </div>

          {/* CENTER - CHART */}
          <div
            className={cn(
              active === 'chart' ? 'flex w-full' : 'hidden',
              'flex-col space-y-4 md:col-span-9 lg:col-span-7 h-full overflow-y-auto animate-in fade-in zoom-in-95 duration-700'
            )}
          >
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
            <div className="w-full flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <ProtectedRoute fallback={<TradingPositionsFallback />}>
                <TradingPositions />
              </ProtectedRoute>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div
            className={cn(
              active === 'trade' ? 'w-full' : 'hidden',
              'flex-col space-y-4 md:col-span-12 lg:col-span-3 lg:flex h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-700'
            )}
          >
            <OptionCardContainer
              selectedSymbol={selectedSymbol}
              onSymbolChange={handleSymbolChange}
              onIdxChange={handleIndexChange}
              index={tokenIdx}
              onStrikePriceChange={setStrikePrice}
              onExpiryChange={setExpiry}
              onPayAmountChange={setPayAmount}
              onContractTypeChange={setContractType}
              onCurrencyChange={setCurrency}
              priceData={priceData}
              marketData={marketData}
              priceLoading={priceLoading}
              marketLoading={marketLoading}
              onTransactionChange={setTransaction}
            />
            <div
              className={`${transaction === 'sell' ? 'hidden' : 'flex'
                } w-full flex-col space-y-4`}
            >
              <PriceQuote
                active={tokenIdx}
                currency={currency}
                value={payAmount}
                priceData={priceData}
                premium={premium.premium}
                contractType={contractType}
              />
              <GreekPopup
                value={payAmount}
                delta={greeks.delta}
                gamma={greeks.gamma}
                theta={greeks.theta}
                vega={greeks.vega}
                rho={greeks.rho}
              />
              {active === 'trade' && (
                <ProtectedRoute fallback={<TradingPositionsFallback />}>
                  <TradingPositions />
                </ProtectedRoute>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 z-10 w-full border-t bg-background p-3 pb-10 lg:hidden">
        <div className="grid grid-cols-2 space-x-2">
          <Button
            className={cn(
              active === 'chart'
                ? 'border-primary text-primary'
                : 'text-secondary-foreground',
              'w-full rounded-sm border bg-inherit px-5 py-[6px]'
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
              'w-full rounded-sm border bg-inherit px-5 py-[6px]'
            )}
            onClick={() => setActive('trade')}
          >
            Trade
          </Button>
        </div>
      </div>
    </>
  )
}

