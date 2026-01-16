'use client'

import React from 'react'
import OrderForm from './components/OrderForm'
import PositionsTable from './components/PositionsTable'
import PriceChart from './components/PriceChart'
import OrderBookComponent from './components/OrderBook'
import OrderHistory from './components/OrderHistory'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export default function FuturesPage() {
  return (
    <ErrorBoundary name="Futures Trading">
      <div className="container mx-auto space-y-6 p-6">
        <h1 className="text-3xl font-bold">Futures Trading</h1>
        <p className="text-muted-foreground">Trade Energy Futures Contracts with leverage.</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PriceChart />
              </div>
              <div className="lg:col-span-1 h-[400px]">
                <OrderBookComponent />
              </div>
            </div>
            <PositionsTable />
            <OrderHistory />
          </div>

          <div className="lg:col-span-1">
            <ErrorBoundary name="Order Form">
              <OrderForm />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

