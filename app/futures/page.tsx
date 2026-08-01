'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import TradingViewTopNav from '@/features/trading/components/TradingViewTopNav'
import { useAuth } from '@/features/auth/provider'
import {
  useFuturesOrderBook,
  useFuturesPositions,
  useFuturesProducts,
} from '@/features/trading/hooks/useFutures'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-hot-toast'
import type { OrderBookEntry } from '@/types/futures'

// Components
import { FuturesOrderForm } from '@/features/trading/components/FuturesOrderForm'
import { FuturesOrderBook } from '@/features/trading/components/FuturesOrderBook'
import { FuturesPositionList } from '@/features/trading/components/FuturesPositionList'
import AuthButton from '@/features/auth/components/AuthButton'

const PriceChart = dynamic(
  () => import('@/features/trading/components/PriceChart'),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-full w-full rounded-xl bg-muted/20" />
    ),
  }
)

const TradeHistory = dynamic(
  () => import('@/features/trading/components/TradeHistory'),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-full w-full rounded-xl bg-muted/20" />
    ),
  }
)

export default function FuturesPage() {
  const { isAuthenticated } = useAuth()

  // Products (public) and positions (session-scoped) are separate queries, so
  // an anonymous visitor still gets live marks. See features/trading/hooks/useFutures.ts.
  const productsQuery = useFuturesProducts()
  const positionsQuery = useFuturesPositions()

  const products = useMemo(
    () => productsQuery.data ?? [],
    [productsQuery.data]
  )

  // There is no product selector in this UI yet — the first product is the
  // market. The id is latched on first load so a backend reordering between
  // polls can't swap the market out from under the user, which is what the old
  // `if (!selectedProduct)` guard achieved.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  useEffect(() => {
    // Safe despite the rule (same reasoning as lib/ws/useSequencedChannel.ts):
    // the guard makes this fire exactly once, and the state it sets is the
    // guard, so it cannot cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedId && products.length > 0) setSelectedId(products[0].id)
  }, [selectedId, products])
  const selectedProduct =
    products.find((p) => p.id === selectedId) ?? products[0] ?? null

  const orderBookQuery = useFuturesOrderBook(selectedProduct?.id)
  const orderBook = orderBookQuery.data ?? null
  const positions = positionsQuery.data ?? []
  const loading = productsQuery.isLoading

  const refetchMarket = useCallback(() => {
    productsQuery.refetch()
    positionsQuery.refetch()
  }, [productsQuery, positionsQuery])

  const currentPrice = selectedProduct
    ? parseFloat(selectedProduct.current_price)
    : 0

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col overflow-hidden">
      <TradingViewTopNav
        symbol={selectedProduct?.symbol || 'GRX'}
        pythSymbol="Crypto.GRX/THB" // Fallback for demonstration
        logo="/svgs/gridx.svg"
        priceData={{ price: currentPrice }}
        marketData={{
          high24h: currentPrice * 1.05,
          low24h: currentPrice * 0.95,
          volume24h: 1250000,
        }}
        priceLoading={loading}
        marketLoading={loading}
        type="futures"
      />

      <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-border/50">
        <ResizablePanelGroup direction="horizontal">
          {/* Left: Chart & Positions */}
          <ResizablePanel defaultSize={75} minSize={40}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70} minSize={30}>
                <div className="h-full p-2">
                  <PriceChart
                    symbol={selectedProduct?.symbol || 'GRX'}
                    type="futures"
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={10}>
                <div className="h-full overflow-y-auto p-4">
                  {isAuthenticated ? (
                    <FuturesPositionList
                      positions={positions}
                      onRefresh={refetchMarket}
                      loading={loading}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sign in to see your open positions.
                    </p>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Order Form & Book */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full overflow-y-auto border-b border-border/50 p-4">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Trade Futures
                  </h3>
                  {/* The page is public, but placing an order isn't — the
                      endpoint needs a token, so the form waits for a session. */}
                  {!isAuthenticated ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Connect your wallet or sign in to place leveraged
                        futures orders.
                      </p>
                      <AuthButton
                        signInVariant="default"
                        className="h-fit w-full rounded-sm border border-transparent bg-primary px-4 py-[7px] text-sm text-background hover:bg-gradient-primary"
                        signInText="Connect"
                      />
                    </div>
                  ) : (
                    selectedProduct && (
                      <FuturesOrderForm
                        productId={selectedProduct.id}
                        symbol={selectedProduct.symbol}
                        currentPrice={currentPrice}
                        onOrderCreated={refetchMarket}
                      />
                    )
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="h-full">
                  <FuturesOrderBook
                    symbol={selectedProduct?.symbol || ''}
                    currentPrice={currentPrice}
                    bids={(orderBook?.bids || []).map((b: OrderBookEntry) => ({
                      price: parseFloat(b.price),
                      quantity: parseFloat(b.quantity),
                      total: parseFloat(b.total),
                    }))}
                    asks={(orderBook?.asks || []).map((a: OrderBookEntry) => ({
                      price: parseFloat(a.price),
                      quantity: parseFloat(a.quantity),
                      total: parseFloat(a.total),
                    }))}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
