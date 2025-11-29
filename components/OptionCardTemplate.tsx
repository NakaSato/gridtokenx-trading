'use client'
import { useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  ChevronDown,
} from 'lucide-react'

export default function OptionCardTemplate() {
  const [selectedOption, setSelectedOption] = useState<'Call' | 'Put'>('Call')
  const [strikePrice, setStrikePrice] = useState('2.2')
  const [expiration, setExpiration] = useState('1 week')
  const [optionSize, setOptionSize] = useState('0.1')
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-sm border bg-inherit p-6">
        {/* Token Selection */}
        <div className="flex w-fit items-center space-x-2 rounded-sm bg-backgroundSecondary px-4 py-3 text-white">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
            W
          </div>
          <span className="font-semibold">WETH</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>

        {/* Trading Direction */}
        <div className="space-y-2">
          <p className="text-sm text-gray-300">Price Sentiment of WETH:</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedOption('Call')}
              className={`flex items-center justify-center space-x-2 rounded-lg border px-4 py-3 ${
                selectedOption === 'Call'
                  ? 'border-emerald-500 bg-inherit text-emerald-500'
                  : 'border-secondary-foreground text-secondary-foreground hover:bg-accent'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Call</span>
            </button>
            <button
              onClick={() => setSelectedOption('Put')}
              className={`flex items-center justify-center space-x-2 rounded-lg border px-4 py-3 ${
                selectedOption === 'Put'
                  ? 'border-red-500 bg-inherit text-red-500'
                  : 'border-secondary-foreground text-secondary-foreground hover:bg-accent'
              }`}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Put</span>
            </button>
          </div>
        </div>

        {/* Strike Price */}
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Strike price</label>
          <div className="flex space-x-3">
            {['2.0', '2.1', '2.2'].map((price) => (
              <button
                key={price}
                onClick={() => setStrikePrice(price)}
                className={`flex-1 rounded-sm px-4 py-2 ${
                  strikePrice === price
                    ? 'bg-gradient-primary text-backgroundSecondary'
                    : 'bg-backgroundSecondary text-secondary-foreground hover:bg-secondary'
                }`}
              >
                ${price}K
              </button>
            ))}
            <button className="rounded-sm bg-backgroundSecondary px-3 py-2 text-secondary-foreground hover:bg-secondary">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expiration */}
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Expiry</label>
          <div className="flex space-x-3">
            {['1 week', '2 weeks', '3 weeks'].map((period) => (
              <button
                key={period}
                onClick={() => setExpiration(period)}
                className={`flex-1 rounded-sm px-4 py-2 ${
                  expiration === period
                    ? 'bg-gradient-primary text-backgroundSecondary'
                    : 'bg-backgroundSecondary text-secondary-foreground hover:bg-secondary'
                }`}
              >
                {period}
              </button>
            ))}
            <button className="rounded-sm bg-backgroundSecondary px-3 py-2 text-secondary-foreground hover:bg-secondary">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Option Size */}
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Amount</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center space-x-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                W
              </div>
            </div>
            <input
              type="number"
              value={optionSize}
              onChange={(e) => setOptionSize(e.target.value)}
              className="w-full rounded-lg bg-backgroundSecondary py-3 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              step="0.1"
              min="0.1"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
