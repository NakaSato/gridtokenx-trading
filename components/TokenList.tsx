'use client'

import Image from 'next/image'
import { ScrollArea } from './ui/scroll-area'
import { usePythPrice } from '@/hooks/usePythPrice'
import { formatPrice } from '@/utils/formatter'
import { useMemo } from 'react'

type Category =
  | 'all'
  | 'crypto'
  | 'memes'
  | 'forex'
  | 'ai'
  | 'metals'
  | 'commodities'
  | 'equities'
  | 'fixed'

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

interface TokenListProps {
  tokens: CryptoData[]
  category: Category
  marketChanges: MarketChanges
  onTokenSelect: (token: CryptoData) => void
  query: string
}

function TokenListItem({
  token,
  marketChange,
  onSelect,
}: {
  token: CryptoData
  marketChange: number | null
  onSelect: () => void
}) {
  const { priceData, loading } = usePythPrice(token.pythSymbol)

  const formatChange = (change: number | null) => {
    if (change === null) return '0.00'
    return Math.abs(change).toFixed(2)
  }

  return (
    <div
      className="grid w-full cursor-pointer grid-cols-3 gap-4 rounded-md p-1 hover:bg-secondary"
      onClick={onSelect}
    >
      <div className="flex items-center gap-1 pl-1">
        <Image
          src={token.iconPath}
          alt={token.name}
          width={24}
          height={24}
          className="rounded-full"
        />
        <div className="flex h-fit flex-col justify-center">
          <span className="h-4 text-sm font-medium text-foreground">
            {token.symbol}
          </span>
          <span className="h-3 overflow-hidden whitespace-nowrap text-[10px] font-medium text-secondary-foreground">
            {token.name}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-start">
        <span className="text-xs font-medium text-secondary-foreground">
          ${priceData.price ? formatPrice(priceData.price) : loading}
        </span>
      </div>
      <div className="flex items-center justify-start gap-0.5 pr-1">
        {marketChange !== null && (
          <>
            <span
              className={`text-xs font-medium ${marketChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {marketChange >= 0 ? '↑' : '↓'}
            </span>
            <span
              className={`text-xs font-medium ${marketChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {formatChange(marketChange)}%
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export default function TokenList({
  tokens,
  category,
  marketChanges,
  onTokenSelect,
  query,
}: TokenListProps) {
  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const matchesCategory = category === 'all' || token.category[category]
      const matchesSearch =
        token.name.toLowerCase().includes(query.toLowerCase()) ||
        token.symbol.toLowerCase().includes(query.toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [tokens, category, query])

  return (
    <ScrollArea className="h-64 w-full">
      {filteredTokens.map((token) => (
        <TokenListItem
          key={token.id}
          token={token}
          marketChange={marketChanges[token.pythSymbol]}
          onSelect={() => onTokenSelect(token)}
        />
      ))}
    </ScrollArea>
  )
}
