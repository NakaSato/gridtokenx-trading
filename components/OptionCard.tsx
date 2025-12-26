'use client'

import { useContext, useEffect, useState } from 'react'
import {
  MoreHorizontal,
  Info,
  TrendingUp,
  TrendingDown,
  EllipsisVertical,
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
import toast from 'react-hot-toast'
import BuyOption from './toasts/BuyOption'

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
  marketData,
  marketLoading,
  onStrikePriceChange,
  onExpiryChange,
  onContractTypeChange,
  onCurrencyChange,
}: OptionCardProps) {
  const { connected } = useWallet()
  const { isAuthenticated, isLoading, user } = useAuth()
  const wallet = useAnchorWallet()

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
      <div className="flex w-full flex-grow flex-col space-y-4 rounded-sm rounded-t-none border border-t-0 bg-card p-6">
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
        <div className="space-y-2">
          <p className="text-sm text-secondary-foreground">Option Type:</p>
          <div className="grid grid-cols-11 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOption('Call')
                onContractTypeChange('Call')
              }}
              className={`group col-span-5 flex items-center justify-center space-x-2 rounded-sm border px-4 py-3 transition-all ${selectedOption === 'Call'
                  ? 'border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500/20'
                  : 'border-border/40 hover:border-green-500 hover:bg-green-500/20 hover:text-green-500'
                }`}
            >
              <TrendingUp
                className={`mr-2 h-4 w-4 ${selectedOption === 'Call'
                    ? 'text-green-500'
                    : 'text-muted-foreground group-hover:text-green-500'
                  }`}
              />
              Call
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOption('Put')
                onContractTypeChange('Put')
              }}
              className={`group col-span-5 flex items-center justify-center space-x-2 rounded-sm border px-4 py-3 transition-all ${selectedOption === 'Put'
                  ? 'border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'border-border/40 hover:border-red-500 hover:bg-red-500/20 hover:text-red-500'
                }`}
            >
              <TrendingDown
                className={`mr-2 h-4 w-4 ${selectedOption === 'Put'
                    ? 'text-red-500'
                    : 'text-muted-foreground group-hover:text-red-500'
                  }`}
              />
              Put
            </Button>
            <Button variant={'outline'} className="col-span-1">
              <EllipsisVertical />
            </Button>
          </div>
        </div>

        {/* Strike Price */}
        <div className="space-y-2">
          <label className="text-sm text-secondary-foreground">
            Strike price
          </label>
          <div className="grid grid-cols-4 gap-2">
            {isDefaultStrike ? (
              <>
                {defaultStrikePrices.map((price, idx) => (
                  <Button
                    key={idx}
                    onClick={() => {
                      setStrikePrice(price)
                      onStrikePriceChange(price)
                    }}
                    className={`flex-1 rounded-sm px-4 py-2 ${strikePrice === price
                        ? 'bg-primary text-backgroundSecondary hover:bg-gradient-primary'
                        : 'bg-backgroundSecondary text-foreground hover:bg-secondary'
                      }`}
                  >
                    {selectedSymbol === 'Crypto.BONK/USD'
                      ? '$' + formatPrice(parseFloat(price))
                      : formatStrikePrice(price)}
                  </Button>
                ))}
                <Button
                  className="rounded-sm bg-backgroundSecondary px-4 py-2 text-foreground hover:bg-secondary"
                  onClick={() => setShowStrikePriceModal(true)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  className="col-span-3 rounded-sm bg-gradient-primary px-4 py-2 text-backgroundSecondary"
                >
                  {formatStrikePrice(strikePrice)}
                </Button>
                <Button
                  className="rounded-sm bg-backgroundSecondary px-4 py-2 text-foreground hover:bg-secondary"
                  onClick={() => setShowStrikePriceModal(true)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Expiration */}
        <div className="space-y-2">
          <label className="text-sm text-secondary-foreground">
            Expiration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {isDefaultExpiration ? (
              <>
                {defaultExpirations.map((exp) => (
                  <Button
                    key={exp.label}
                    onClick={() => {
                      setExpiration(exp.value)
                      onExpiryChange(exp.value)
                    }}
                    className={`flex-1 rounded-sm px-4 py-2 ${format(expiration, 'yyyy-MM-dd') ===
                        format(exp.value, 'yyyy-MM-dd')
                        ? 'bg-primary text-backgroundSecondary hover:bg-gradient-primary'
                        : 'bg-backgroundSecondary text-foreground hover:bg-secondary'
                      }`}
                  >
                    {exp.label}
                  </Button>
                ))}
                <Button
                  className="rounded-sm bg-backgroundSecondary px-4 py-2 text-foreground hover:bg-secondary"
                  onClick={() => setShowExpirationModal(true)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button className="col-span-3 rounded-sm bg-gradient-primary px-4 py-2 text-backgroundSecondary">
                  {getExpirationLabel(expiration)}
                </Button>
                <Button
                  className="rounded-sm bg-backgroundSecondary px-4 py-2 text-foreground hover:bg-secondary"
                  onClick={() => setShowExpirationModal(true)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Option Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-secondary-foreground">
                Pay Amount
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-secondary-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter amount you want to invest</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-secondary-foreground">
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
              className="h-11 rounded-sm border-border pr-2 text-right text-base font-medium placeholder:text-secondary-foreground focus:border-primary"
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
