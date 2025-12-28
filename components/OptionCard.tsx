'use client'

import { useContext, useEffect, useState } from 'react'
import {
  MoreHorizontal,
  Info,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StrikePriceDialog } from './StrikePriceDialog'
import { ExpirationDialog } from './ExpirationDialog'
import { addWeeks, format } from 'date-fns'
import { WalletIcon } from '@/public/svgs/icons'
import CardTokenList from './CardTokenList'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { usePyth24hChange, type PythPriceState } from '@/hooks/usePythPrice'
import type { MarketDataState } from '@/hooks/usePythMarketData'
import { formatPrice } from '@/utils/formatter'
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/contexts/AuthProvider'
import WalletModal from './WalletModal'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ContractContext } from '@/contexts/contractProvider'
import { WSOL_DECIMALS } from '@/utils/const'

interface OptionCardProps {
  orderType: 'market' | 'limit'
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
  onIdxChange: (idx: number) => void
  onExpiryChange: (date: Date) => void
  onStrikePriceChange: (amount: string) => void
  onPayAmountChange: (amount: string) => void
  onCurrencyChange: (currency: string) => void
  onContractTypeChange: (type: 'Call' | 'Put') => void
  active: number
  priceData: PythPriceState
  marketData: MarketDataState
  priceLoading: boolean
  marketLoading: boolean
}

export default function OptionCard({
  orderType,
  onIdxChange,
  onSymbolChange,
  active,
  onPayAmountChange,
  selectedSymbol,
  priceData,
  priceLoading,
  onStrikePriceChange,
  onExpiryChange,
  onContractTypeChange,
  onCurrencyChange,
}: OptionCardProps) {
  const { connected } = useWallet()
  const { isAuthenticated } = useAuth()

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [optionSize, setOptionSize] = useState('0.1')
  const [selectedOption, setSelectedOption] = useState<'Call' | 'Put'>('Call')
  const [strikePrice, setStrikePrice] = useState('0')
  const [expiration, setExpiration] = useState<Date>(addWeeks(new Date(), 1))
  const [payAmount, setPayAmount] = useState('')
  const [payCurrency, setPayCurrency] = useState(selectedSymbol)
  const [showStrikePriceModal, setShowStrikePriceModal] = useState(false)
  const [showExpirationModal, setShowExpirationModal] = useState(false)
  const [limitPrice, setLimitPrice] = useState('')
  const [hasSetInitialStrike, setHasSetInitialStrike] = useState(false)
  const [defaultStrikePrices, setDefaultStrikePrices] = useState([
    '0',
    '0',
    '0',
  ])

  const { percentChange } = usePyth24hChange(selectedSymbol)
  const isPositive = percentChange !== null && percentChange > 0

  // console.log(defaultStrikePrices)

  useEffect(() => {
    onCurrencyChange(payCurrency)
  }, [payCurrency, onCurrencyChange])

  useEffect(() => {
    setHasSetInitialStrike(false)
    setStrikePrice('0')
    setDefaultStrikePrices(['0', '0', '0'])
  }, [selectedSymbol])

  useEffect(() => {
    if (!selectedSymbol) return

    let firstStrike = defaultStrikePrices[0]
    const isValidStrike = firstStrike && parseFloat(firstStrike) > 0

    if (priceData.price && !hasSetInitialStrike && isValidStrike) {
      setStrikePrice(firstStrike)
      onStrikePriceChange(firstStrike)
      setHasSetInitialStrike(true)
    }
  }, [
    selectedSymbol,
    priceData.price,
    defaultStrikePrices,
    hasSetInitialStrike,
    onStrikePriceChange,
  ])

  // Close wallet modal when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && isWalletModalOpen) {
      setIsWalletModalOpen(false)
    }
  }, [isAuthenticated, isWalletModalOpen])

  const defaultExpirations = [
    { label: '1 week', value: addWeeks(new Date(), 1) },
    { label: '2 weeks', value: addWeeks(new Date(), 2) },
    { label: '3 weeks', value: addWeeks(new Date(), 3) },
  ]

  const isDefaultStrike = defaultStrikePrices.includes(strikePrice)

  const isDefaultExpiration = defaultExpirations.some(
    (exp) =>
      format(exp.value, 'yyyy-MM-dd') === format(expiration, 'yyyy-MM-dd')
  )

  const formatStrikePrice = (price: string) => {
    const num = parseFloat(price)
    return `$${num.toLocaleString()}`
  }

  const handleExpirationSelect = (newExpiration: Date) => {
    setExpiration(newExpiration)
    onExpiryChange(newExpiration)
  }

  const getExpirationLabel = (date: Date): string => {
    const matchingDefault = defaultExpirations.find(
      (exp) => format(exp.value, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
    return matchingDefault ? matchingDefault.label : format(date, 'dd MMM yyyy')
  }
  const sc = useContext(ContractContext)

  const buyOptionHandler = async () => {
    const currentTime = Math.floor(Date.now() / 1000)
    const expTime = Math.floor(expiration.getTime() / 1000)
    const period = Math.floor((expTime - currentTime) / (3600 * 24)) + 1

    // Determine quote token
    let quoteToken: 'USDC' | 'THB' = 'USDC';
    if (payCurrency === 'THB') {
      quoteToken = 'THB';
    } else if (payCurrency === 'USDC') {
      quoteToken = 'USDC';
    } else {
      if (selectedSymbol.includes('THB')) {
        quoteToken = 'THB';
      }
    }

    await sc.onOpenOption(
      parseFloat(optionSize) * 10 ** WSOL_DECIMALS,
      parseFloat(strikePrice),
      period,
      expTime,
      selectedOption == 'Call' ? true : false,
      true,
      quoteToken
    )
  }

  const formatChange = (change: number | null) => {
    if (change === null) return '0.00'
    return Math.abs(change).toFixed(2)
  }

  return (
    <ProtectedRoute
      fallback={
        <div className="h-12 w-full animate-pulse rounded bg-muted"></div>
      }
    >
      <div className="flex w-full flex-grow flex-col space-y-5 rounded-sm rounded-t-none border border-t-0 bg-card p-5">
        {/* Token Selection */}
        <div className="flex items-start justify-between gap-3">
          <CardTokenList
            onSymbolChange={onSymbolChange}
            onPaymentTokenChange={setPayCurrency}
            onIdxChange={onIdxChange}
            active={active}
            type="chart"
          />
          {orderType === 'market' ? (
            <div className="h-12 text-right">
              <div className="text-2xl font-semibold tracking-tight">
                ${priceData.price ? formatPrice(priceData.price) : priceLoading}
              </div>
              <div
                className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'
                  }`}
              >
                {isPositive ? '+' : '-'}
                {formatChange(percentChange)}%
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex h-12 w-32 flex-col items-start justify-center rounded-sm border p-2 focus-within:border-primary">
                <span className="text-xs text-secondary-foreground">
                  Limit Price:
                </span>
                <Input
                  type="text"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="h-fit w-32 border-none text-left"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
        </div>

        {/* Trading Direction */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Option Type</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOption('Call')
                onContractTypeChange('Call')
              }}
              className={`group relative flex h-auto flex-col items-center justify-center space-y-1 rounded-md border px-4 py-3 transition-all ${selectedOption === 'Call'
                ? 'border-green-500/50 bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-500'
                : 'border-border/60 hover:border-green-500/50 hover:bg-green-500/5 hover:text-green-500'
                }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp
                  className={`h-4 w-4 ${selectedOption === 'Call'
                    ? 'text-green-500'
                    : 'text-muted-foreground group-hover:text-green-500'
                    }`}
                />
                <span className="font-semibold">Call</span>
              </div>
              <span className="text-xs opacity-70">Price will go up</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOption('Put')
                onContractTypeChange('Put')
              }}
              className={`group relative flex h-auto flex-col items-center justify-center space-y-1 rounded-md border px-4 py-3 transition-all ${selectedOption === 'Put'
                ? 'border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500'
                : 'border-border/60 hover:border-red-500/50 hover:bg-red-500/5 hover:text-red-500'
                }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingDown
                  className={`h-4 w-4 ${selectedOption === 'Put'
                    ? 'text-red-500'
                    : 'text-muted-foreground group-hover:text-red-500'
                    }`}
                />
                <span className="font-semibold">Put</span>
              </div>
              <span className="text-xs opacity-70">Price will go down</span>
            </Button>
          </div>
        </div>

        {/* Strike Price */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Strike Price
          </label>
          <div className="grid grid-cols-4 gap-2">
            {isDefaultStrike ? (
              <>
                {defaultStrikePrices.map((price, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    onClick={() => {
                      setStrikePrice(price)
                      onStrikePriceChange(price)
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-sm transition-colors ${strikePrice === price
                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border-border/60 bg-transparent text-foreground hover:bg-accent'
                      }`}
                  >
                    {selectedSymbol === 'Crypto.BONK/USD'
                      ? '$' + formatPrice(parseFloat(price))
                      : formatStrikePrice(price)}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="rounded-md border-border/60 bg-transparent px-3 py-2 text-foreground hover:bg-accent"
                  onClick={() => setShowStrikePriceModal(true)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  className="col-span-3 rounded-md bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90"
                >
                  {formatStrikePrice(strikePrice)}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-md border-border/60 bg-transparent px-3 py-2 text-foreground hover:bg-accent"
                  onClick={() => setShowStrikePriceModal(true)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Expiration */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Expiration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {isDefaultExpiration ? (
              <>
                {defaultExpirations.map((exp) => (
                  <Button
                    key={exp.label}
                    variant="outline"
                    onClick={() => {
                      setExpiration(exp.value)
                      onExpiryChange(exp.value)
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-sm transition-colors ${format(expiration, 'yyyy-MM-dd') ===
                      format(exp.value, 'yyyy-MM-dd')
                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border-border/60 bg-transparent text-foreground hover:bg-accent'
                      }`}
                  >
                    {exp.label}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="rounded-md border-border/60 bg-transparent px-3 py-2 text-foreground hover:bg-accent"
                  onClick={() => setShowExpirationModal(true)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button className="col-span-3 rounded-md bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90">
                  {getExpirationLabel(expiration)}
                </Button>
                <Button
                  className="rounded-md border-border/60 bg-transparent px-3 py-2 text-foreground hover:bg-accent"
                  onClick={() => setShowExpirationModal(true)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Option Size */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Pay Amount
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter amount you want to invest</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-xs text-muted-foreground">
              Balance: 0 SOL
            </span>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center space-x-2">
              <CardTokenList
                onSymbolChange={onSymbolChange}
                onPaymentTokenChange={setPayCurrency}
                onIdxChange={onIdxChange}
                active={active}
                type="paying"
              />
            </div>
            <Input
              type="number"
              value={payAmount}
              onChange={(e) => {
                setPayAmount(e.target.value)
                onPayAmountChange(e.target.value)
                setOptionSize(e.target.value)
              }}
              placeholder="0.00"
              className="h-12 rounded-md border-border/60 bg-accent/20 pr-4 text-right text-lg font-medium placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
              step="0.1"
              min="0.1"
            />
          </div>
        </div>

        {/* Submit Button */}
        {isAuthenticated ? (
          <Button
            onClick={() => buyOptionHandler()}
            className="w-full rounded-sm bg-gradient-primary text-black"
            size="lg"
          >
            Buy Option
          </Button>
        ) : connected && !isAuthenticated ? (
          <Button
            onClick={() => setIsWalletModalOpen(true)}
            className="w-full rounded-sm bg-gradient-primary text-black"
            size="lg"
          >
            <WalletIcon />
            <span className="text-base font-medium">Sign In</span>
          </Button>
        ) : (
          <Button
            onClick={() => setIsWalletModalOpen(true)}
            className="w-full rounded-sm bg-gradient-primary text-black"
            size="lg"
          >
            <WalletIcon />
            <span className="text-base font-medium">Connect Wallet</span>
          </Button>
        )}

        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
        />

        {/* Modals */}
        <StrikePriceDialog
          open={showStrikePriceModal}
          onOpenChange={setShowStrikePriceModal}
          onSelectPrice={setStrikePrice}
          onDefaultStrikePrices={setDefaultStrikePrices}
          onStrikePriceChange={onStrikePriceChange}
          currentPrice={strikePrice}
          marketPrice={priceData.price || 0}
        />
        <ExpirationDialog
          open={showExpirationModal}
          onOpenChange={setShowExpirationModal}
          onSelectExpiration={handleExpirationSelect}
          currentExpiration={expiration}
        />
      </div>
    </ProtectedRoute>
  )
}
