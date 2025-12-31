'use client'

import Image from 'next/image'
import { ChevronDown, Diff, Search, TableColumnsSplit } from 'lucide-react'
import { Separator } from './ui/separator'
import { PythIcon, SortIcon } from '@/public/svgs/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Input } from './ui/input'
import { formatPrice } from '@/utils/formatter'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import TokenList from './TokenList'
import MarketDetails from './MarketDetails'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import { HoverCard, HoverCardContent } from './ui/hover-card'
import { HoverCardTrigger } from '@radix-ui/react-hover-card'
import { Progress } from './ui/progress'
import CircularProgressBar from './ui/circular-progress-bar'
import { RatioBar } from './RatioBar'

type CryptoData = {
  id: string
  name: string
  symbol: string
  iconPath: string
  pythSymbol: string
  category: {
    crypto: boolean
    memes: boolean
    forex: boolean
    ai: boolean
    metals: boolean
    commodities: boolean
    equities: boolean
    fixed: boolean
  }
}

type MarketChanges = {
  [key: string]: number | null
}

interface TradingViewTopNavProps {
  symbol: string | null
  pythSymbol: string
  logo: string
  tokens: CryptoData[]
  marketChanges: MarketChanges
  onTokenSelect: (token: CryptoData) => void
  priceData: any
  marketData: any
  priceLoading: boolean
  marketLoading: boolean
  type: string
  onNavigate?: (idx: number) => void
}

export default function TradingViewTopNav({
  symbol,
  pythSymbol,
  logo,
  tokens,
  marketChanges,
  onTokenSelect,
  priceData,
  marketData,
  priceLoading,
  marketLoading,
  type,
  onNavigate,
}: TradingViewTopNavProps) {
  const [active, setActive] = useState<
    | 'all'
    | 'crypto'
    | 'memes'
    | 'forex'
    | 'ai'
    | 'metals'
    | 'commodities'
    | 'equities'
    | 'fixed'
  >('all')
  const router = useRouter()
  const [query, setQuery] = useState('')

  return (
    <div className="flex h-fit w-full rounded-b-sm border border-t-0 py-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="group flex cursor-pointer items-center space-x-6 px-2 py-1 lg:space-x-2">
            <div className="flex items-center space-x-[6px]">
              <Image
                src={logo}
                alt={symbol!}
                width={18}
                height={18}
                className="rounded-full"
              />
              <span className="text-sm font-medium text-foreground hover:text-primary group-hover:text-primary">
                {symbol}/USDC
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-secondary-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="flex w-fit flex-col space-y-2 rounded-sm bg-accent px-1 py-2"
          align="start"
        >
          <div className="flex w-full flex-col space-y-2 px-1">
            <div className="flex h-fit w-full items-center space-x-2 rounded-sm bg-secondary px-3 py-2 text-xs text-secondary-foreground">
              <Input
                type="text"
                name="query"
                placeholder="Search for a coin"
                className="h-fit rounded-none border-none p-0 text-foreground shadow-none placeholder:text-secondary-foreground"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search size={14} className="h-[14px] w-[14px] text-foreground" />
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex w-full justify-between border-b py-[2px] text-xs font-medium text-secondary-foreground">
                <button
                  className={cn(
                    active === 'all' ? 'text-primary' : '',
                    'relative px-1'
                  )}
                  onClick={() => setActive('all')}
                >
                  <span>All</span>
                  {active === 'all' && (
                    <div className="absolute -bottom-[3px] left-0 right-0 h-[1px] bg-primary" />
                  )}
                </button>
                <button
                  className={cn(
                    active === 'memes' ? 'text-primary' : '',
                    'relative px-1'
                  )}
                  onClick={() => setActive('memes')}
                >
                  <span>Memes</span>
                  {active === 'memes' && (
                    <div className="absolute -bottom-[3px] left-0 right-0 h-[1px] bg-primary" />
                  )}
                </button>
                <button
                  className={cn(
                    active === 'forex' ? 'text-primary' : '',
                    'relative px-1'
                  )}
                  onClick={() => setActive('forex')}
                >
                  <span>Forex</span>
                  {active === 'forex' && (
                    <div className="absolute -bottom-[3px] left-0 right-0 h-[1px] bg-primary" />
                  )}
                </button>
                <button
                  className={cn(
                    active === 'ai' ? 'text-primary' : '',
                    'relative px-1'
                  )}
                  onClick={() => setActive('ai')}
                >
                  <span>AI</span>
                  {active === 'ai' && (
                    <div className="absolute -bottom-[3px] left-0 right-0 h-[1px] bg-primary" />
                  )}
                </button>
                <button
                  className={cn(
                    active === 'metals' ? 'text-primary' : '',
                    'relative px-1'
                  )}
                  onClick={() => setActive('metals')}
                >
                  <span>Metals</span>
                  {active === 'metals' && (
                    <div className="absolute -bottom-[3px] left-0 right-0 h-[1px] bg-primary" />
                  )}
                </button>
                <button
                  className={cn(
                    active === 'commodities' ? 'text-primary' : '',
                    'relative px-1'
                  )}
                  onClick={() => setActive('commodities')}
                >
                  <span>Commodities</span>
                  {active === 'commodities' && (
                    <div className="absolute -bottom-[3px] left-0 right-0 h-[1px] bg-primary" />
                  )}
                </button>
                <button
                  className={cn(
                    active === 'equities' ? 'text-primary' : '',
                    'relative px-1'
                  )}
                  onClick={() => setActive('equities')}
                >
                  <span>Equities</span>
                  {active === 'equities' && (
                    <div className="absolute -bottom-[3px] left-0 right-0 h-[1px] bg-primary" />
                  )}
                </button>
                <button
                  className={cn(
                    active === 'fixed' ? 'text-primary' : '',
                    'relative px-1'
                  )}
                  onClick={() => setActive('fixed')}
                >
                  <span>Fixed Income</span>
                  {active === 'fixed' && (
                    <div className="absolute -bottom-[3px] left-0 right-0 h-[1px] bg-primary" />
                  )}
                </button>
              </div>
              <div className="grid w-full grid-cols-3 gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">Symbols</span>
                  <SortIcon />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">Price</span>
                  <SortIcon />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">24h%</span>
                  <SortIcon />
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col">
            <TokenList
              tokens={tokens}
              category={active}
              marketChanges={marketChanges}
              onTokenSelect={onTokenSelect}
              query={query}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className={`${type === 'futures' ? 'hidden' : 'hidden'}`}>
        <div className="px-4 py-1">
          <Separator orientation="vertical" />
        </div>
        <div className="flex items-center py-1">
          <Button
            className={`flex h-fit w-fit items-center gap-[6px] bg-inherit p-0 ${type === 'options' ? 'text-foreground hover:text-primary' : 'text-primary hover:text-foreground'}`}
            onClick={() =>
              router.push(`${type === 'options' ? '/options-chain' : '/'}`)
            }
          >
            <TableColumnsSplit />
            <span className="hidden text-sm font-medium md:flex">
              Options Chain
            </span>
          </Button>
        </div>
      </div>

      {/* Transaction Tab */}
      <div className="hidden lg:flex items-center">
        <div className="px-4 py-1">
          <Separator orientation="vertical" />
        </div>
        <Button
          variant="ghost"
          className={`flex h-fit w-fit items-center gap-[6px] bg-inherit p-0 hover:bg-transparent ${type === 'Transaction' ? 'text-primary font-bold' : 'text-secondary-foreground hover:text-foreground'}`}
          onClick={() => {
            if (onNavigate) {
              onNavigate(-1)
            }
          }}
        >
          <span className="text-sm font-medium">Transaction</span>
        </Button>
      </div>
      <div className="hidden lg:flex">
        <div className="hidden px-4 py-1 md:flex">
          <Separator orientation="vertical" />
        </div>
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="hidden cursor-pointer flex-col md:flex">
              <span className="h-3 text-[10px] font-normal text-secondary-foreground">
                Oracle Price
              </span>
              <div className="flex space-x-0.5">
                <span>
                  <PythIcon />
                </span>
                <span className="text-xs font-medium text-foreground">
                  {priceData.price
                    ? formatPrice(priceData.price)
                    : priceLoading}
                </span>
              </div>
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            align="start"
            className="flex w-fit flex-col justify-center space-y-4 rounded-sm bg-accent p-2"
          >
            <div className="flex flex-col gap-2 text-xs text-foreground">
              <div className="flex flex-col">
                <span>The current Oracle Price of the selected asset</span>
                <span>({symbol}).</span>
              </div>

              <span className="flex items-center gap-1">
                {priceData.price ? formatPrice(priceData.price) : priceLoading}
                <Diff size={12} />
              </span>
            </div>
            <div className="flex flex-col text-xs text-foreground">
              <span>
                Oracle Provide by{' '}
                <a className="text-primary" href="">
                  Pyth
                </a>
                .
              </span>
              <span>Last Pull: 6 slots ago</span>
            </div>
          </HoverCardContent>
        </HoverCard>

        <div className="px-4 py-1">
          <Separator orientation="vertical" />
        </div>
        <div className="flex flex-col">
          <span className="h-3 text-[10px] font-normal text-secondary-foreground">
            24h high
          </span>
          <span className="text-xs font-medium text-foreground">
            $
            {marketData.high24h
              ? formatPrice(marketData.high24h)
              : marketLoading}
          </span>
        </div>
        <div className="px-4 py-1">
          <Separator orientation="vertical" />
        </div>
        <div className="flex flex-col">
          <span className="h-3 text-[10px] font-normal text-secondary-foreground">
            24h low
          </span>
          <span className="text-xs font-medium text-foreground">
            $
            {marketData.low24h ? formatPrice(marketData.low24h) : marketLoading}
          </span>
        </div>
        <div className="px-4 py-1">
          <Separator orientation="vertical" />
        </div>
        <div className="flex flex-col">
          <span className="h-3 text-[10px] font-normal text-secondary-foreground">
            24h volume
          </span>
          <span className="text-xs font-medium text-foreground">$</span>
        </div>
        <div className="px-4 py-1">
          <Separator orientation="vertical" />
        </div>
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex flex-grow cursor-pointer flex-col justify-start space-y-1.5">
              <span className="h-3 text-[10px] font-normal text-secondary-foreground">
                SOL Utilization
              </span>
              <Progress value={66} className="h-1" />
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            align="center"
            className="flex flex-col justify-center gap-2 rounded-sm bg-accent p-2"
          >
            <div className="flex justify-center">
              <CircularProgressBar />
            </div>
            <div>
              <div className="flex justify-between text-xs font-normal text-secondary-foreground">
                <span>Call Open Interests</span>
                <span className="text-foreground">XXX</span>
              </div>
              <div className="flex justify-between text-xs font-normal text-secondary-foreground">
                <span>Call Available Liquidity</span>
                <span className="text-foreground">XXX</span>
              </div>
              <div className="flex justify-between text-xs font-normal text-secondary-foreground">
                <span>Call Intereset Rate</span>
                <span className="text-foreground">XXX</span>
              </div>
              <div className="flex justify-between text-xs font-normal text-secondary-foreground">
                <span>Call Volatility</span>
                <span className="text-foreground">XXX</span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        <div className="px-4 py-1">
          <Separator orientation="vertical" />
        </div>
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex flex-grow cursor-pointer flex-col justify-start space-y-1.5">
              <span className="h-3 text-[10px] font-normal text-secondary-foreground">
                USDC Utilization
              </span>
              <Progress value={66} className="h-1" />
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            align="center"
            className="flex flex-col justify-center gap-2 rounded-sm bg-accent p-2"
          >
            <div className="flex justify-center">
              <CircularProgressBar />
            </div>
            <div>
              <div className="flex justify-between text-xs font-normal text-secondary-foreground">
                <span>Put Open Interests</span>
                <span className="text-foreground">XXX</span>
              </div>
              <div className="flex justify-between text-xs font-normal text-secondary-foreground">
                <span>Put Available Liquidity</span>
                <span className="text-foreground">XXX</span>
              </div>
              <div className="flex justify-between text-xs font-normal text-secondary-foreground">
                <span>Put Intereset Rate</span>
                <span className="text-foreground">XXX</span>
              </div>
              <div className="flex justify-between text-xs font-normal text-secondary-foreground">
                <span>Put Volatility</span>
                <span className="text-foreground">XXX</span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        <div className="px-4 py-1">
          <Separator orientation="vertical" />
        </div>
        {type === 'options' && (
          <>
            <div className="flex flex-col">
              <span className="h-3 text-[10px] font-normal text-secondary-foreground">
                Call Volatility
              </span>
              <span className="text-xs font-medium text-foreground"></span>
            </div>
            <div className="px-4 py-1">
              <Separator orientation="vertical" />
            </div>
            <div className="flex flex-col">
              <span className="h-3 text-[10px] font-normal text-secondary-foreground">
                Put Volatility
              </span>
              <span className="text-xs font-medium text-foreground"></span>
            </div>
            <div className="px-4 py-1">
              <Separator orientation="vertical" />
            </div>
          </>
        )}
        {/* <div className="flex lg:w-56 xl:w-80 space-x-3 items-center">
                    <span className="text-xs">
                        Call
                    </span>
                    <RatioBar 
                        symbol={symbol!}
                        leftPercentage={60}
                        rightPercentage={40}
                    />
                    <span className="text-xs">
                        Put
                    </span>
                </div>
                <div className="px-4 py-1">
                    <Separator orientation="vertical"/>
                </div> */}
        <div className="flex gap-1">
          <div className="flex flex-col items-center rounded-sm bg-green-500/10 px-2">
            <span className="h-3 text-[10px] font-normal text-green-500">
              {type === 'options' ? 'Call' : 'Long'}
            </span>
            <span className="text-xs font-medium text-green-500">6</span>
          </div>
          <div className="flex flex-col items-center rounded-sm bg-red-500/10 px-2">
            <span className="h-3 text-[10px] font-normal text-red-500">
              {type === 'options' ? 'Put' : 'Short'}
            </span>
            <span className="text-xs font-medium text-red-500">4</span>
          </div>
        </div>
        <div className="px-4 py-1">
          <Separator orientation="vertical" />
        </div>
      </div>
      <div className="flex w-full justify-end px-2 lg:hidden">
        <MarketDetails
          logo={logo}
          symbol={symbol!}
          tokenPrice={priceData.price}
          high={marketData.high24h}
          low={marketData.low24h}
        />
      </div>
    </div>
  )
}
