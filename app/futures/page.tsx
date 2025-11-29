'use client'

import CryptoNav from '@/components/CryptoNav'
import FutureCardContainer from '@/components/FutureCardContainer'
import FuturesPositions from '@/components/FuturesPositions'
import FuturesQuote from '@/components/FuturesQuote'
import TradingViewChart from '@/components/TradingViewChart'
import { Button } from '@/components/ui/button'
import { usePythMarketData } from '@/hooks/usePythMarketData'
import { usePythPrice } from '@/hooks/usePythPrice'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export default function Futures() {
  const [active, setActive] = useState('chart')
  const [tokenIdx, setTokenIdx] = useState(0)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('Crypto.SOL/USD')
  const [selectedLogo, setSelectedLogo] = useState<string>('/images/solana.png')
  const { priceData, loading: priceLoading } = usePythPrice(selectedSymbol)
  const { marketData, loading: marketLoading } =
    usePythMarketData(selectedSymbol)
  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol)
  }

  const handleIconChange = (newIcon: string) => {
    setSelectedLogo(newIcon)
  }
  const handleIndexChange = (newIdx: number) => {
    setTokenIdx(newIdx)
  }
  return (
    <main className="flex flex-col space-y-4">
      <div className="w-full">
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
          type="futures"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div
          className={`${
            active === 'chart'
              ? 'flex lg:col-span-8'
              : 'hidden lg:col-span-8 lg:flex'
          } flex-col gap-4`}
        >
          <div className="h-[538px] rounded-sm border-t">
            <TradingViewChart symbol={selectedSymbol} logo={selectedLogo} />
          </div>
          <FuturesPositions />
        </div>
        <div
          className={`${
            active === 'trade'
              ? 'flex lg:col-span-4'
              : 'hidden lg:col-span-4 lg:flex'
          } h-fit flex-col gap-4`}
        >
          <FutureCardContainer
            active={tokenIdx}
            selectedSymbol={selectedSymbol}
            onSymbolChange={handleSymbolChange}
            onIdxChange={handleIndexChange}
            priceData={priceData}
            marketData={marketData}
            priceLoading={priceLoading}
            marketLoading={marketLoading}
          />
          <FuturesQuote />
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
    </main>
  )
}
