'use client'
import { useState, useEffect } from 'react'
import CryptoNav from '@/components/CryptoNav'
import TradingViewChartContainer from '@/components/TradingViewChartContainer'
import ProtectedRoute from '@/components/ProtectedRoute'
import TradingPositionsFallback from '@/components/TradingPositionsFallback'
import TradingPositions from '@/components/TradingPositions'
import PriceQuote from '@/components/PriceQuote'
import GreekPopup from '@/components/GreekPopup'
import { usePythPrice } from '@/hooks/usePythPrice'
import { usePythMarketData } from '@/hooks/usePythMarketData'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import OptionCardContainer from '@/components/OptionCardContainer'
import { addWeeks, format } from 'date-fns'
import { useOptionsPricing } from '@/hooks/useOptionsPricing'
import { useGreeks } from '@/hooks/useGreeks'

interface Transaction {
  id: string
  type: 'BUY ENERGY' | 'SELL ENERGY' | 'TRADE ENERGY' | 'STAKE GRIDX'
  amount: string
  price: string
  pnl: number
  timestamp: Date
}

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
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([
    {
      id: '1',
      type: 'BUY ENERGY',
      amount: '500 kWh',
      price: '150 GRIDX',
      pnl: 450,
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: '2',
      type: 'SELL ENERGY',
      amount: '300 kWh',
      price: '95 GRIDX',
      pnl: -85,
      timestamp: new Date(Date.now() - 5400000),
    },
    {
      id: '3',
      type: 'TRADE ENERGY',
      amount: '750 kWh',
      price: '220 GRIDX',
      pnl: 680,
      timestamp: new Date(Date.now() - 9000000),
    },
    {
      id: '4',
      type: 'STAKE GRIDX',
      amount: '1000 GRIDX',
      price: 'Staking Pool',
      pnl: 125,
      timestamp: new Date(Date.now() - 14400000),
    },
    {
      id: '5',
      type: 'BUY ENERGY',
      amount: '400 kWh',
      price: '120 GRIDX',
      pnl: 320,
      timestamp: new Date(Date.now() - 18000000),
    },
  ])

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
          active === 'trade' ? 'space-y-0' : 'space-y-4',
          'flex h-full w-full flex-col pb-4'
        )}
      >
        <div className="grid w-full flex-1 grid-cols-1 justify-between gap-4 overflow-hidden pt-4 md:grid-cols-12">
          {/* LEFT SIDEBAR - TRANSACTION HISTORY */}
          <div className="hidden h-full flex-col space-y-4 md:col-span-2 md:flex">
            <div className="bg-secondary/50 flex h-full flex-col rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold text-primary">
                Energy Trading History
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {transactionHistory.length === 0 ? (
                  <div className="py-4 text-center text-xs text-secondary-foreground">
                    No transactions yet
                  </div>
                ) : (
                  transactionHistory.map((txn, index) => (
                    <div
                      key={txn.id}
                      className={cn(
                        'border-b border-secondary pb-2 last:border-b-0',
                        index === 0 && 'animate-pulse'
                      )}
                    >
                      <div className="mb-1 flex items-start justify-between">
                        <span className="text-xs font-medium">{txn.type}</span>
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            txn.pnl > 0 ? 'text-green-500' : 'text-red-500'
                          )}
                        >
                          {txn.pnl > 0 ? '+' : ''}
                          {txn.pnl} GRIDX
                        </span>
                      </div>
                      <div className="mb-1 text-xs text-secondary-foreground">
                        {txn.amount} • {txn.price}
                      </div>
                      <div className="text-xs text-secondary-foreground">
                        {format(txn.timestamp, 'MMM d, h:mm a')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* CENTER - CHART */}
          <div
            className={cn(
              active === 'chart' ? 'w-full' : 'hidden',
              'h-full flex-col space-y-4 md:col-span-7 md:flex'
            )}
          >
            <div className="min-h-0 flex-1">
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
            <div className="w-full flex-shrink-0">
              <ProtectedRoute fallback={<TradingPositionsFallback />}>
                <TradingPositions />
              </ProtectedRoute>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div
            className={cn(
              active === 'trade' ? 'w-full' : 'hidden',
              'flex-col space-y-4 md:col-span-3 md:flex'
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
              className={`${
                transaction === 'sell' ? 'hidden' : 'flex'
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
