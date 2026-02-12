'use client'

import React from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import TradingPositionsFallback from '@/components/TradingPositionsFallback'
import TradingPositions from '@/components/TradingPositions'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrderBook } from '@/components/p2p/OrderBook'

const TradingPositionsPanel = React.memo(function TradingPositionsPanel() {
    return (
        <div className="w-full flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 bg-card border-t border-border/50">
            <Tabs defaultValue="positions" className="w-full">
                <div className="px-4 py-2 border-b border-border/50">
                    <TabsList className="h-8">
                        <TabsTrigger value="positions" className="text-xs">Derivatives</TabsTrigger>
                        <TabsTrigger value="orderbook" className="text-xs">P2P Market</TabsTrigger>
                        <TabsTrigger value="my-orders" className="text-xs">My P2P Orders</TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-0">
                    <TabsContent value="positions" className="m-0 border-none p-0 outline-none">
                        <ProtectedRoute fallback={<TradingPositionsFallback />}>
                            <TradingPositions />
                        </ProtectedRoute>
                    </TabsContent>
                    <TabsContent value="orderbook" className="m-0 border-none p-0 outline-none h-[300px]">
                        <OrderBook />
                    </TabsContent>
                    <TabsContent value="my-orders" className="m-0 border-none p-0 outline-none h-[300px]">
                        <OrderBook myOrdersOnly />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
})

export default TradingPositionsPanel
