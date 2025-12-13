
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OrderBook from './components/OrderBook'
import OrderForm from './components/OrderForm'
import TradeHistory from './components/TradeHistory'
import UserOrders from './components/UserOrders'

export default function P2PPage() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold">P2P Energy Trading</h1>
                <p className="text-muted-foreground">
                    Buy and sell renewable energy directly with other peers on the grid.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Order Form - 4 Columns */}
                <div className="lg:col-span-4 space-y-6">
                    <OrderForm />
                    <UserOrders />

                    <div className="hidden lg:block">
                        <TradeHistory />
                    </div>
                </div>

                {/* Order Book - 8 Columns */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="orderbook" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="orderbook">Order Book</TabsTrigger>
                            <TabsTrigger value="history" className="lg:hidden">Trade History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="orderbook">
                            <OrderBook />
                        </TabsContent>

                        <TabsContent value="history" className="lg:hidden">
                            <TradeHistory />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
