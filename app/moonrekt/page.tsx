'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Image from 'next/image'

interface TradingPool {
  id: string
  symbol: string
  timeframe: string
  lockedPrice: number
  currentPrice: number
  moonPayout: number
  moonMultiplier: string
  rektPayout: number
  rektMultiplier: string
  totalPool: number
  participants: number
  status: 'live' | 'upcoming' | 'expired'
  timeLeft: number
  result?: 'moon' | 'rekt'
  resAmount?: number
  closedPrice?: number
  lastPrice?: number
}

const initialPools: TradingPool[] = [
  {
    id: '1',
    symbol: 'Crypto.BTC/USD 6GicWQMD',
    timeframe: '1m',
    lockedPrice: 27352.059,
    currentPrice: 27354.756,
    moonPayout: 351.09,
    moonMultiplier: '1.37x',
    rektPayout: 150.56,
    rektMultiplier: '3.18x',
    totalPool: 501.65,
    participants: 12,
    status: 'expired',
    result: 'moon',
    resAmount: 123.45,
    timeLeft: 0,
    closedPrice: 27354.756,
  },
  {
    id: '2',
    symbol: 'Crypto.BTC/USD HiYQJAPX',
    timeframe: '1m',
    lockedPrice: 27354.756,
    currentPrice: 27363.918,
    moonPayout: 248.81,
    moonMultiplier: '1.93x',
    rektPayout: 253.82,
    rektMultiplier: '1.89x',
    totalPool: 502.63,
    participants: 18,
    status: 'expired',
    timeLeft: 0,
    result: 'rekt',
    resAmount: 123.45,
    closedPrice: 27363.918,
  },
  {
    id: '3',
    symbol: 'Crypto.BTC/USD HjndbB5A',
    timeframe: '1m',
    lockedPrice: 27365.008,
    currentPrice: 27366.674,
    moonPayout: 277.01,
    moonMultiplier: '1.73x',
    rektPayout: 225.61,
    rektMultiplier: '2.13x',
    totalPool: 502.62,
    participants: 24,
    resAmount: 123.45,
    status: 'live',
    timeLeft: 13,
    lastPrice: 27366.674,
  },
  {
    id: '4',
    symbol: 'Crypto.BTC/USD FkL8Ghmz',
    timeframe: '2m',
    lockedPrice: 0,
    currentPrice: 27366.674,
    moonPayout: 151.55,
    moonMultiplier: '1.90x',
    rektPayout: 150.1,
    rektMultiplier: '1.92x',
    totalPool: 301.65,
    participants: 8,
    status: 'upcoming',
    timeLeft: 13,
  },
  {
    id: '5',
    symbol: 'Crypto.BTC/USD 437H3tkt',
    timeframe: '5m',
    lockedPrice: 0,
    currentPrice: 27366.674,
    moonPayout: 150.0,
    moonMultiplier: '1.91x',
    rektPayout: 150.0,
    rektMultiplier: '1.91x',
    totalPool: 300.0,
    participants: 5,
    status: 'upcoming',
    timeLeft: 73,
  },
  {
    id: '6',
    symbol: 'Crypto.BTC/USD 437H3tkt',
    timeframe: '5m',
    lockedPrice: 0,
    currentPrice: 27366.674,
    moonPayout: 150.0,
    moonMultiplier: '1.91x',
    rektPayout: 150.0,
    rektMultiplier: '1.91x',
    totalPool: 300.0,
    participants: 5,
    status: 'upcoming',
    timeLeft: 73,
  },
]

export default function MoonRektPage() {
  const [currentPrice, setCurrentPrice] = useState(27366.674)
  const [selectedAsset, setSelectedAsset] = useState('BTC')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1 minute')
  const [pools, setPools] = useState<TradingPool[]>(initialPools)
  const [currentPoolIndex, setCurrentPoolIndex] = useState(0)

  console.log(currentPoolIndex)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice((prev) => {
        const change = (Math.random() - 0.5) * 20
        return Math.max(27000, Math.min(28000, prev + change))
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPools((prev) =>
        prev.map((pool) => ({
          ...pool,
          timeLeft: Math.max(0, pool.timeLeft - 1),
        }))
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const visiblePools = pools.slice(currentPoolIndex, currentPoolIndex + 5)

  const nextPools = () => {
    setCurrentPoolIndex((prev) => Math.min(prev + 1, pools.length - 5))
  }

  const prevPools = () => {
    setCurrentPoolIndex((prev) => Math.max(prev - 1, 0))
  }

  return (
    <div className="text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex flex-col gap-4">
            <h1 className="bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-3xl font-bold text-transparent">
              MoonRekt
            </h1>
            <div className="max-w-md text-sm text-foreground">
              MoonRekt allows you to take a bullish or bearish position on
              popular coins like Bitcoin in standardized and familiar technical
              timeframes. There is four easy steps to play:
            </div>
          </div>
        </div>

        {/* Current Price Display */}
        <div className="text-center">
          <div className="mb-2 text-5xl font-bold text-foreground">
            ${currentPrice.toFixed(2)}
          </div>
          <div className="font-mono text-2xl text-secondary-foreground">
            00:00:00
          </div>
        </div>

        {/* Trading Pools */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between">
            {/* Asset Selection */}
            <div className="flex space-x-2">
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger asChild>
                  <Button variant={'outline'} className="w-40 bg-inherit">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold">
                        ₿
                      </div>
                      <SelectValue />
                    </div>
                    <ChevronDown />
                  </Button>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="ADA">ADA</SelectItem>
                  <SelectItem value="SOL">SOL</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedTimeframe}
                onValueChange={setSelectedTimeframe}
              >
                <SelectTrigger asChild>
                  <Button variant={'outline'} className="w-40 bg-inherit">
                    <SelectValue />
                    <ChevronDown />
                  </Button>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 minute">1 minute</SelectItem>
                  <SelectItem value="5 minutes">5 minutes</SelectItem>
                  <SelectItem value="15 minutes">15 minutes</SelectItem>
                  <SelectItem value="1 hour">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={prevPools}
                disabled={currentPoolIndex === 0}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={nextPools}
                disabled={currentPoolIndex >= pools.length - 5}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="w-full gap-2">
            {/* <Button
                            onClick={prevPools}
                            disabled={currentPoolIndex === 0}
                            className='cursor-pointer disabled:cursor-not-allowed rounded-full w-10 h-10 bg-foreground'
                        >
                            <ChevronLeft className="w-4 h-4 text-background" />
                        </Button> */}

            <div className="grid grid-cols-5 gap-4">
              {visiblePools.map((pool) => (
                <div key={pool.id} className="rounded-sm border">
                  {/* Header */}
                  <div className="mb-4">
                    <div className="mb-1 flex h-fit items-center justify-between border-b py-0.5 text-xs text-secondary-foreground">
                      <span className="whitespace-nowrap px-2">
                        {pool.symbol}
                      </span>
                      <span
                        className={`whitespace-nowrap px-2 text-xs font-medium ${pool.status === 'live' ? 'text-green-500' : 'text-foreground'}`}
                      >
                        {pool.status === 'live'
                          ? 'Live'
                          : pool.status === 'upcoming'
                            ? 'Upcoming'
                            : 'Expired'}
                      </span>
                    </div>
                    <div className="flex h-fit items-center justify-between border-b py-0.5">
                      <div className="flex items-center gap-2 px-2">
                        <span className="text-xs text-foreground">Pool</span>
                        <Image
                          src={'/images/usdc.png'}
                          alt="usdc logo"
                          width={12}
                          height={12}
                        />
                        <span className="text-xs text-foreground">
                          {pool.totalPool.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-2">
                        {pool.status !== 'expired' && (
                          <span
                            className={`text-xs ${pool.status === 'live' ? 'text-green-500' : 'text-secondary-foreground'}`}
                          >
                            {formatTime(pool.timeLeft)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payout Badges */}
                  <div className="mb-4 space-y-0 px-4">
                    {/* Moon Payout */}
                    <div className="relative px-3">
                      <div
                        className={` ${
                          pool.result === 'moon'
                            ? 'bg-gradient-to-r from-green-500 to-green-400'
                            : 'bg-gradient-to-r from-green-500 to-green-400 opacity-30'
                        } relative flex h-20 items-end justify-center gap-3 px-4 py-2 text-center text-sm font-bold text-black`}
                        style={{
                          clipPath:
                            'polygon(0 100%, 100% 100%, 100% 60%, 50% 0%, 50% 0%, 0 60%)',
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <Image
                            src={'/images/usdc.png'}
                            alt="usdc logo"
                            width={12}
                            height={12}
                            className="h-fit w-fit"
                          />
                          <span>{pool.moonPayout.toFixed(2)}</span>
                        </div>
                        <span>{pool.moonMultiplier} Payout</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {pool.status === 'upcoming' && (
                      <div className="space-y-2">
                        <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 py-2 text-sm font-bold text-black hover:from-green-600 hover:to-green-700">
                          Enter Moon
                        </Button>
                        <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-2 text-sm font-bold text-white hover:from-pink-600 hover:to-purple-700">
                          Enter Rekt
                        </Button>
                      </div>
                    )}

                    {/* Price Information */}
                    {pool.status !== 'upcoming' && (
                      <div className="mb-4 space-y-2 rounded-sm bg-backgroundSecondary p-2 text-xs">
                        {pool.status && (
                          <div className="flex justify-between text-gray-400">
                            <span>Locked Price</span>
                            <span>${pool.lockedPrice.toFixed(3)}</span>
                          </div>
                        )}

                        {pool.resAmount && (
                          <div className="flex justify-between">
                            <span
                              className={` ${pool.result === 'moon' ? 'text-green-400' : 'text-red-400'}`}
                            >
                              {pool.result === 'moon' ? 'Moon' : 'Rekt'} by
                            </span>
                            <span
                              className={` ${pool.result === 'moon' ? 'text-green-400' : 'text-red-400'}`}
                            >
                              ${pool.resAmount.toFixed(3)}
                            </span>
                          </div>
                        )}

                        {pool.closedPrice && pool.status === 'expired' && (
                          <div className="flex justify-between text-gray-400">
                            <span>Closed Price</span>
                            <span>${pool.closedPrice.toFixed(3)}</span>
                          </div>
                        )}

                        {pool.lastPrice && (
                          <div className="flex justify-between text-gray-400">
                            <span>Last Price</span>
                            <span>${pool.lastPrice.toFixed(3)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rekt Payout */}
                    <div className="relative px-3">
                      <div
                        className={` ${
                          pool.result === 'rekt'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                            : 'bg-gradient-to-r from-pink-500 to-purple-600 opacity-30'
                        } relative flex h-20 items-start justify-center gap-3 px-4 py-2 text-center text-sm font-bold text-white`}
                        style={{
                          clipPath:
                            'polygon(0 0, 100% 0, 100% 30%, 50% 100%, 0 30%)',
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <Image
                            src={'/images/usdc.png'}
                            alt="usdc logo"
                            width={12}
                            height={12}
                            className="h-fit w-fit"
                          />
                          <span>{pool.rektPayout.toFixed(2)}</span>
                        </div>
                        <span>{pool.rektMultiplier} Payout</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* <Button
                            onClick={nextPools}
                            disabled={currentPoolIndex >= pools.length - 5}
                            className='cursor-pointer disabled:cursor-not-allowed rounded-full w-10 h-10 bg-foreground'
                        >
                            <ChevronRight className="w-4 h-4 text-background" />
                        </Button> */}
          </div>
        </div>
      </div>
    </div>
  )
}
