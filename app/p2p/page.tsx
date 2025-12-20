
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { defaultApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { Loader2, Zap, Play } from 'lucide-react'
import OrderBook from './components/OrderBook'
import OrderForm from './components/OrderForm'
import TradeHistory from './components/TradeHistory'
import UserOrders from './components/UserOrders'

export default function P2PPage() {
    const { token } = useAuth()
    const [matching, setMatching] = useState(false)
    const [matchResult, setMatchResult] = useState('')

    const handleTriggerMatching = async () => {
        if (!token) {
            setMatchResult('Please log in first')
            return
        }

        setMatching(true)
        setMatchResult('')

        try {
            defaultApiClient.setToken(token)
            const response = await fetch('http://localhost:4000/api/v1/trading/admin/match-orders', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            const data = await response.json()
            if (response.ok) {
                setMatchResult(`✅ Matching complete! ${data.matches_created || 0} trades executed`)
            } else {
                setMatchResult(`❌ ${data.error || 'Matching failed'}`)
            }
        } catch (error: any) {
            setMatchResult(`❌ ${error.message}`)
        } finally {
            setMatching(false)
            // Clear message after 5 seconds
            setTimeout(() => setMatchResult(''), 5000)
        }
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Zap className="h-8 w-8 text-yellow-500" />
                        P2P Energy Trading
                    </h1>
                    <p className="text-muted-foreground">
                        Buy and sell renewable energy directly with other peers on the grid.
                    </p>
                </div>

                {/* Match Orders Button (for testing) */}
                {token && (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleTriggerMatching}
                            disabled={matching}
                            variant="outline"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                            {matching ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Matching...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Match Orders
                                </>
                            )}
                        </Button>
                        {matchResult && (
                            <span className="text-sm">{matchResult}</span>
                        )}
                    </div>
                )}
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
