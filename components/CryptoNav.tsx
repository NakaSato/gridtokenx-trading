'use client'

import { cn } from '@/lib/utils'
import { buttonVariants } from './ui/button'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import TradingViewTopNav from './TradingViewTopNav'
import { usePythMarketData } from '@/hooks/usePythMarketData'
import {
  usePyth24hChange,
  usePythPrice,
  type PythPriceState,
} from '@/hooks/usePythPrice'
import type { MarketDataState } from '@/hooks/usePythMarketData'
import { tokenList, Token } from '@/lib/data/tokenlist'

const cryptoData: Token[] = tokenList

interface CryptoNavProps {
  onSymbolChange: (symbol: string) => void
  onIconChange: (symbol: string) => void
  onIdxChange: (idx: number) => void
  active: number
  selectedSymbol: string
  priceData: PythPriceState
  marketData: MarketDataState
  priceLoading: boolean
  marketLoading: boolean
  type: string
}

type MarketChanges = {
  [key: string]: number | null
}

const CryptoNavItem = React.memo(
  ({
    crypto,
    isActive,
    onClick,
    onMarketChange,
  }: {
    crypto: Token
    isActive: boolean
    onClick: () => void
    onMarketChange: (symbol: string, change: number | null) => void
  }) => {
    const { percentChange } = usePyth24hChange(crypto.pythSymbol)
    //todo: const { priceData } = usePythPrice(crypto.pythSymbol)

    useEffect(() => {
      onMarketChange(crypto.pythSymbol, percentChange)
    }, [crypto.pythSymbol, percentChange, onMarketChange])

    const formatChange = (change: number | null) => {
      if (change === null) return '0.00'
      return Math.abs(change).toFixed(2)
    }

    return (
      <div className="flex flex-nowrap items-center">
        <div
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            isActive && 'bg-secondary hover:bg-secondary',
            'flex h-fit w-full cursor-pointer items-center space-x-5 rounded-sm px-[6px] py-0 text-sm'
          )}
          onClick={onClick}
        >
          <div className="flex items-center space-x-1">
            <Image
              src={crypto.iconPath}
              alt={crypto.name}
              width={12}
              height={12}
              className="h-4 w-4 rounded-full"
            />
            <span className="text-sm font-medium">{crypto.symbol}</span>
          </div>
          <span
            className={
              percentChange && percentChange >= 0
                ? 'text-green-500'
                : 'text-red-500'
            }
          >
            {percentChange !== null && (
              <>
                {percentChange >= 0 ? '↑' : '↓'} {formatChange(percentChange)}%
              </>
            )}
          </span>
        </div>
      </div>
    )
  }
)

CryptoNavItem.displayName = 'CryptoNavItem'

export default function CryptoNav({
  onSymbolChange,
  onIconChange,
  onIdxChange,
  active,
  selectedSymbol,
  priceData,
  marketData,
  priceLoading,
  marketLoading,
  type,
}: CryptoNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [marketChanges, setMarketChanges] = useState<MarketChanges>({})

  const handleMarketChange = React.useCallback(
    (symbol: string, change: number | null) => {
      setMarketChanges((prev) => ({
        ...prev,
        [symbol]: change,
      }))
    },
    []
  )

  const scrollToToken = (index: number) => {
    const container = scrollContainerRef.current
    const token = cryptoData[index]
    const element = itemsRef.current.get(token.id)

    if (container && element) {
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()

      const elementRelativeLeft = elementRect.left - containerRect.left
      const elementRelativeRight = elementRelativeLeft + elementRect.width

      if (
        elementRelativeLeft < 0 ||
        elementRelativeRight > containerRect.width
      ) {
        const scrollLeft =
          container.scrollLeft +
          elementRelativeLeft -
          (containerRect.width - elementRect.width) / 2

        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth',
        })
      }
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = container.clientWidth / 2
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      )
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      checkScroll()
    }
    return () => container?.removeEventListener('scroll', checkScroll)
  }, [])

  useEffect(() => {
    scrollToToken(active)
  }, [active])

  const handleClick = (index: number) => {
    onIdxChange(index)
    onSymbolChange(cryptoData[index].pythSymbol)
    onIconChange(cryptoData[index].iconPath)
  }

  const handleTokenSelect = (token: Token) => {
    const index = cryptoData.findIndex((t) => t.id === token.id)
    if (index !== -1) {
      handleClick(index)
      scrollToToken(index)
    }
  }

  return (
    <>
      <div className="flex h-[30px] w-full justify-between rounded-sm rounded-b-none border px-1 py-1">
        <div
          ref={scrollContainerRef}
          className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide"
        >
          <div className="flex flex-nowrap items-center">
            {cryptoData.map((crypto, index) => (
              <React.Fragment key={crypto.id}>
                <div
                  ref={(el) => {
                    if (el) {
                      itemsRef.current.set(crypto.id, el)
                    }
                  }}
                >
                  <CryptoNavItem
                    crypto={crypto}
                    isActive={active === index}
                    onClick={() => handleClick(index)}
                    onMarketChange={handleMarketChange}
                  />
                </div>
                {index < cryptoData.length - 1 && (
                  <div
                    className="mx-1 h-[18px] min-w-[1px] flex-shrink-0 bg-border"
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex gap-[2px]">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="focus:outline-none disabled:opacity-50"
            aria-label="Scroll Left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 28 28"
              fill="none"
            >
              <path
                d="M14.0002 25.6668C20.4435 25.6668 25.6668 20.4435 25.6668 14.0002C25.6668 7.55684 20.4435 2.3335 14.0002 2.3335C7.55684 2.3335 2.3335 7.55684 2.3335 14.0002C2.3335 20.4435 7.55684 25.6668 14.0002 25.6668Z"
                className="fill-current text-backgroundSecondary"
              />
              <path
                d="M15.4699 18.1185L11.3633 14.0002L15.4699 9.88184"
                className="stroke-current text-secondary-foreground"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="focus:outline-none disabled:opacity-50"
            aria-label="Scroll Right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 28 28"
              fill="none"
            >
              <path
                d="M14.0002 25.6668C20.4435 25.6668 25.6668 20.4435 25.6668 14.0002C25.6668 7.55684 20.4435 2.3335 14.0002 2.3335C7.55684 2.3335 2.3335 7.55684 2.3335 14.0002C2.3335 20.4435 7.55684 25.6668 14.0002 25.6668Z"
                className="fill-current text-backgroundSecondary"
              />
              <path
                d="M12.5298 18.1185L16.6365 14.0002L12.5298 9.88184"
                className="stroke-current text-secondary-foreground"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <TradingViewTopNav
        symbol={cryptoData[active].symbol}
        pythSymbol={cryptoData[active].pythSymbol}
        logo={cryptoData[active].iconPath}
        tokens={cryptoData}
        marketChanges={marketChanges}
        onTokenSelect={handleTokenSelect}
        priceData={priceData}
        marketData={marketData}
        priceLoading={priceLoading}
        marketLoading={marketLoading}
        type={type}
      />
    </>
  )
}
