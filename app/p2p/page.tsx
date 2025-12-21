'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { defaultApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { Loader2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import ProtectedRoute from '@/components/ProtectedRoute'
import OrderBook from './components/OrderBook'
import OrderForm from './components/OrderForm'
import TradeHistory from './components/TradeHistory'
import UserOrders from './components/UserOrders'
import P2PNav from './components/P2PNav'

export default function P2PPage() {
    const { token } = useAuth()
    const [active, setActive] = useState<'book' | 'trade'>('book')
    const [matching, setMatching] = useState(false)
    const [matchResult, setMatchResult] = useState('')
    const [refreshTrigger, setRefreshTrigger] = useState(0)

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
                setMatchResult(`✅ ${data.matches_created || 0} trades`)
                setRefreshTrigger(prev => prev + 1)
            } else {
                setMatchResult(`❌ ${data.error || 'Failed'}`)
            }
        } catch (error: any) {
            setMatchResult(`❌ ${error.message}`)
        } finally {
            setMatching(false)
            setTimeout(() => setMatchResult(''), 5000)
        }
    }

    const handleOrderPlaced = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    return (
        <>
            {/* Top Navigation Bar - P2P Specific */}
            <P2PNav
                onMatch={handleTriggerMatching}
                matching={matching}
                matchResult={matchResult}
            />

            {/* Main Content - Full Height Layout */}
            <div className="flex h-[calc(100vh-100px)] w-full flex-col px-4 pb-4">
                <div className="grid w-full flex-1 grid-cols-1 gap-4 pt-4 md:grid-cols-12">

                    {/* LEFT SIDEBAR - Trade History (2 cols) */}
                    <div className="hidden h-full flex-col space-y-4 overflow-y-auto md:col-span-2 md:flex">
                        <TradeHistory />
                    </div>

                    {/* CENTER - Order Book (7 cols) */}
                    <div className={cn(
                        active === 'book' ? 'flex' : 'hidden md:flex',
                        'h-full flex-col space-y-4 overflow-y-auto md:col-span-7'
                    )}>
                        <OrderBook />
                        <UserOrders />
                    </div>

                    {/* RIGHT SIDEBAR - Order Form (3 cols) */}
                    <div className={cn(
                        active === 'trade' ? 'flex' : 'hidden md:flex',
                        'h-full flex-col space-y-4 overflow-y-auto md:col-span-3'
                    )}>
                        <OrderForm onOrderPlaced={handleOrderPlaced} />
                    </div>
                </div>
            </div>
            {/* Mobile Bottom Navigation */}
            <div className="sticky bottom-0 z-10 w-full border-t bg-background p-3 pb-10 lg:hidden">
                <div className="grid grid-cols-2 space-x-2">
                    <Button
                        className={cn(
                            active === 'book'
                                ? 'border-primary text-primary'
                                : 'text-secondary-foreground',
                            'w-full rounded-sm border bg-inherit px-5 py-[6px]'
                        )}
                        onClick={() => setActive('book')}
                    >
                        Order Book
                    </Button>
                    <Button
                        className={cn(
                            active === 'trade'
                                ? 'border-primary text-primary'
                                : 'text-secondary-foreground',
                            'w-full rounded-sm border bg-inherit px-5 py-[6px]'
                        )}
                        onClick={() => setActive('trade')}
                    >
                        Trade
                    </Button>
                </div>
            </div>
        </>
    )
}
