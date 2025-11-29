'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { ChevronDown } from 'lucide-react'
import FutureCard from './FutureCard'
import type { PythPriceState } from '@/hooks/usePythPrice'
import type { MarketDataState } from '@/hooks/usePythMarketData'

interface FutureCardContainerProps {
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
  onIdxChange: (idx: number) => void
  active: number
  priceData: PythPriceState
  marketData: MarketDataState
  priceLoading: boolean
  marketLoading: boolean
}

export default function FutureCardContainer({
  onSymbolChange,
  onIdxChange,
  active,
  selectedSymbol,
  priceData,
  marketData,
  priceLoading,
  marketLoading,
}: FutureCardContainerProps) {
  const [selectedTrade, setSelectedTrade] = useState<'perps' | 'dated'>('perps')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <section className="flex h-11 w-full items-center justify-between rounded-sm rounded-b-none border border-b-0 px-4">
        <div className="flex h-full space-x-2">
          <Button
            className={`h-full rounded-none border-b bg-inherit shadow-none ${selectedTrade === 'perps' ? 'border-primary text-primary' : 'border-transparent text-secondary-foreground hover:text-primary'}`}
            onClick={() => setSelectedTrade('perps')}
          >
            Perps
          </Button>
          <Button
            className={`h-full rounded-none border-b bg-inherit shadow-none ${selectedTrade === 'dated' ? 'border-primary text-primary' : 'border-transparent text-secondary-foreground hover:text-primary'}`}
            onClick={() => setSelectedTrade('dated')}
          >
            Dated
          </Button>
        </div>
        <Select
          defaultValue="market"
          onValueChange={(value) => {
            if (value === 'market' || value === 'limit') {
              setOrderType(value)
            }
          }}
        >
          <SelectTrigger className="w-fit space-x-2 border-0 bg-inherit focus:ring-0 focus:ring-offset-0">
            <SelectValue />
            <ChevronDown size={16} className="text-secondary-foreground" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="market">Market</SelectItem>
            <SelectItem value="limit">Limit</SelectItem>
          </SelectContent>
        </Select>
      </section>
      <FutureCard
        type={selectedTrade}
        orderType={orderType}
        selectedSymbol={selectedSymbol}
        onSymbolChange={onSymbolChange}
        onIdxChange={onIdxChange}
        active={active}
        priceData={priceData}
        marketData={marketData}
        priceLoading={priceLoading}
        marketLoading={marketLoading}
      />
    </div>
  )
}
