'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import TradingViewTopNav from '@/features/trading/components/TradingViewTopNav'
import { useAuth } from '@/features/auth/provider'
import { createApiClient } from '@/lib/api-client'
import { FuturesProduct, FuturesPosition, OrderBook } from '@/types/futures'
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
  const { token, isAuthenticated } = useAuth()
  const [products, setProducts] = useState<FuturesProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<FuturesProduct | null>(
    null
  )
  const [positions, setPositions] = useState<FuturesPosition[]>([])
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMarketData = useCallback(async () => {
    try {
      const api = createApiClient(token ?? undefined)
      // Market data is public; positions belong to a session, so they're only
      // requested once there is a token to request them with.
      const [productsRes, positionsRes] = await Promise.all([
        api.getFuturesProducts(),
        token ? api.getFuturesPositions() : Promise.resolve(null),
      ])

      if (productsRes.data) {
        setProducts(productsRes.data)
        if (productsRes.data.length > 0 && !selectedProduct) {
          setSelectedProduct(productsRes.data[0])
        }
      }

      setPositions(positionsRes?.data ?? [])
    } catch (err) {
      console.error('Failed to fetch futures data:', err)
    } finally {
      setLoading(false)
    }
  }, [token, selectedProduct])

  const fetchOrderBook = useCallback(async () => {
    if (!selectedProduct) return

    try {
      const api = createApiClient(token ?? undefined)
      const response = await api.getFuturesOrderBook(selectedProduct.id)
      if (response.data) {
        setOrderBook(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch order book:', err)
    }
  }, [token, selectedProduct])

  useEffect(() => {
    fetchMarketData()
    const marketInterval = setInterval(fetchMarketData, 5000)
    return () => clearInterval(marketInterval)
  }, [fetchMarketData])

  useEffect(() => {
    fetchOrderBook()
    const obInterval = setInterval(fetchOrderBook, 2000)
    return () => clearInterval(obInterval)
  }, [fetchOrderBook])

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
                      onRefresh={fetchMarketData}
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
                        onOrderCreated={fetchMarketData}
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
