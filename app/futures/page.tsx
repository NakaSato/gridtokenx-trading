'use client'

import { useState } from 'react'
import OrderForm from './components/OrderForm'
import PositionsTable from './components/PositionsTable'
import PriceChart from './components/PriceChart'
import OrderBookComponent from './components/OrderBook'
import OrderHistory from './components/OrderHistory'
import { Card, CardContent } from '@/components/ui/card'

export default function FuturesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleOrderPlaced = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
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
          <PositionsTable refreshTrigger={refreshTrigger} />
          <OrderHistory refreshTrigger={refreshTrigger} />
        </div>

        <div className="lg:col-span-1">
          <OrderForm onOrderPlaced={handleOrderPlaced} />
        </div>
      </div>
    </div>
  )
}
