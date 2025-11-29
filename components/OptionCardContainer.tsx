'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import OptionCard from '@/components/OptionCard'
import SellCard from '@/components/SellCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown } from 'lucide-react'
import type { PythPriceState } from '@/hooks/usePythPrice'
import type { MarketDataState } from '@/hooks/usePythMarketData'

interface OptionCardContainerProps {
  selectedSymbol: string
  onExpiryChange: (date: Date) => void
  onSymbolChange: (symbol: string) => void
  onIdxChange: (idx: number) => void
  onStrikePriceChange: (amount: string) => void
  onPayAmountChange: (amount: string) => void
  onCurrencyChange: (currency: string) => void
  onContractTypeChange: (type: 'Call' | 'Put') => void
  onTransactionChange: (type: string) => void
  index: number
  priceData: PythPriceState
  marketData: MarketDataState
  priceLoading: boolean
  marketLoading: boolean
}

export default function OptionCardContainer({
  onIdxChange,
  onSymbolChange,
  onPayAmountChange,
  onStrikePriceChange,
  onExpiryChange,
  onContractTypeChange,
  onCurrencyChange,
  onTransactionChange,
  index,
  selectedSymbol,
  priceData,
  marketData,
  priceLoading,
  marketLoading,
}: OptionCardContainerProps) {
  const [active, setActive] = useState('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')

  const handleTransaction = (tx: string) => {
    setActive(tx)
    onTransactionChange(tx)
  }

  return (
    <div className="flex h-[540px] w-full flex-col space-y-0">
      <div className="flex h-[42px] w-full items-center justify-between rounded-sm rounded-b-none border px-4 py-1">
        <div className="flex gap-4">
          <Button
            className={`h-[42px] w-full rounded-none border-b bg-inherit shadow-none hover:text-primary ${active === 'buy' ? 'border-primary text-primary' : 'border-transparent text-secondary-foreground'}`}
            onClick={() => handleTransaction('buy')}
          >
            Buy
          </Button>
          <Button
            className={`h-[42px] w-full rounded-none border-b bg-inherit shadow-none hover:text-primary ${active === 'sell' ? 'border-primary text-primary' : 'border-transparent text-secondary-foreground'}`}
            onClick={() => handleTransaction('sell')}
          >
            Sell
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
          <SelectTrigger className="h-[42px] w-fit gap-3 bg-inherit px-3 text-secondary-foreground focus:border-primary">
            <SelectValue />
            <ChevronDown size={12} />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="market">Market</SelectItem>
            <SelectItem value="limit">Limit</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {active === 'buy' && (
        <OptionCard
          selectedSymbol={selectedSymbol}
          onSymbolChange={onSymbolChange}
          onIdxChange={onIdxChange}
          onExpiryChange={onExpiryChange}
          onStrikePriceChange={onStrikePriceChange}
          onPayAmountChange={onPayAmountChange}
          onContractTypeChange={onContractTypeChange}
          onCurrencyChange={onCurrencyChange}
          active={index}
          orderType={orderType}
          priceData={priceData}
          marketData={marketData}
          priceLoading={priceLoading}
          marketLoading={marketLoading}
        />
      )}
      {active === 'sell' && <SellCard />}
    </div>
  )
}
