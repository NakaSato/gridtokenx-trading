'use client'

import Image from 'next/image'
import { Zap, Play, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthProvider'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card'

interface P2PNavProps {
    onMatch?: () => void
    matching?: boolean
    matchResult?: string
}

export default function P2PNav({ onMatch, matching, matchResult }: P2PNavProps) {
    const { token } = useAuth()
    const [marketData, setMarketData] = useState({
        avgPrice: 5.12,
        priceChange: 2.3,
        high24h: 5.85,
        low24h: 4.78,
        volume24h: 1250.5,
        trades24h: 47,
        buyOrders: 12,
        sellOrders: 8
    })

    return (
        <>
            {/* Top Token Bar (like CryptoNav) */}
            <div className="flex h-[30px] w-full justify-between rounded-sm rounded-b-none border px-1 py-1">
                <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide">
                    <div className="flex flex-nowrap items-center">
                        <div className={cn(
                            'flex h-fit w-full cursor-pointer items-center space-x-5 rounded-sm px-[6px] py-0 text-sm bg-secondary hover:bg-secondary'
                        )}>
                            <div className="flex items-center space-x-1">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">GRX/kWh</span>
                            </div>
                            <span className={marketData.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {marketData.priceChange >= 0 ? '↑' : '↓'} {Math.abs(marketData.priceChange).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Nav Bar (like TradingViewTopNav) */}
            <div className="flex h-fit w-full rounded-b-sm border border-t-0 py-1">
                {/* Symbol Selector */}
                <Button className="group flex cursor-pointer items-center space-x-6 px-2 py-1 lg:space-x-2">
                    <div className="flex items-center space-x-[6px]">
                        <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary/20">
                            <Zap className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground hover:text-primary group-hover:text-primary">
                            GRX/kWh
                        </span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-secondary-foreground" />
                </Button>

                <div className="hidden lg:flex">
                    {/* Oracle Price */}
                    <div className="hidden px-4 py-1 md:flex">
                        <Separator orientation="vertical" />
                    </div>
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <div className="hidden cursor-pointer flex-col md:flex">
                                <span className="h-3 text-[10px] font-normal text-secondary-foreground">
                                    Market Price
                                </span>
                                <span className="text-xs font-medium text-foreground">
                                    {marketData.avgPrice.toFixed(2)} GRX
                                </span>
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent
                            align="start"
                            className="flex w-fit flex-col justify-center space-y-4 rounded-sm bg-accent p-2"
                        >
                            <div className="flex flex-col gap-2 text-xs text-foreground">
                                <span>Current average market price for energy trading.</span>
                            </div>
                        </HoverCardContent>
                    </HoverCard>

                    {/* 24h High */}
                    <div className="px-4 py-1">
                        <Separator orientation="vertical" />
                    </div>
                    <div className="flex flex-col">
                        <span className="h-3 text-[10px] font-normal text-secondary-foreground">
                            24h high
                        </span>
                        <span className="text-xs font-medium text-foreground">
                            {marketData.high24h.toFixed(2)} GRX
                        </span>
                    </div>

                    {/* 24h Low */}
                    <div className="px-4 py-1">
                        <Separator orientation="vertical" />
                    </div>
                    <div className="flex flex-col">
                        <span className="h-3 text-[10px] font-normal text-secondary-foreground">
                            24h low
                        </span>
                        <span className="text-xs font-medium text-foreground">
                            {marketData.low24h.toFixed(2)} GRX
                        </span>
                    </div>

                    {/* 24h Volume */}
                    <div className="px-4 py-1">
                        <Separator orientation="vertical" />
                    </div>
                    <div className="flex flex-col">
                        <span className="h-3 text-[10px] font-normal text-secondary-foreground">
                            24h volume
                        </span>
                        <span className="text-xs font-medium text-foreground">
                            {marketData.volume24h.toLocaleString()} kWh
                        </span>
                    </div>

                    {/* Trades */}
                    <div className="px-4 py-1">
                        <Separator orientation="vertical" />
                    </div>
                    <div className="flex flex-col">
                        <span className="h-3 text-[10px] font-normal text-secondary-foreground">
                            24h trades
                        </span>
                        <span className="text-xs font-medium text-foreground">
                            {marketData.trades24h}
                        </span>
                    </div>

                    {/* Order Book Utilization */}
                    <div className="px-4 py-1">
                        <Separator orientation="vertical" />
                    </div>
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <div className="flex flex-grow cursor-pointer flex-col justify-start space-y-1.5">
                                <span className="h-3 text-[10px] font-normal text-secondary-foreground">
                                    Order Flow
                                </span>
                                <Progress value={60} className="h-1" />
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent
                            align="center"
                            className="flex flex-col justify-center gap-2 rounded-sm bg-accent p-2"
                        >
                            <div>
                                <div className="flex justify-between text-xs font-normal text-secondary-foreground">
                                    <span>Buy Orders</span>
                                    <span className="text-foreground">{marketData.buyOrders}</span>
                                </div>
                                <div className="flex justify-between text-xs font-normal text-secondary-foreground">
                                    <span>Sell Orders</span>
                                    <span className="text-foreground">{marketData.sellOrders}</span>
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>

                    {/* Buy/Sell Indicators */}
                    <div className="px-4 py-1">
                        <Separator orientation="vertical" />
                    </div>
                    <div className="flex gap-1">
                        <div className="flex flex-col items-center rounded-sm bg-green-500/10 px-2">
                            <span className="h-3 text-[10px] font-normal text-green-500">
                                Buy
                            </span>
                            <span className="text-xs font-medium text-green-500">
                                {marketData.buyOrders}
                            </span>
                        </div>
                        <div className="flex flex-col items-center rounded-sm bg-red-500/10 px-2">
                            <span className="h-3 text-[10px] font-normal text-red-500">
                                Sell
                            </span>
                            <span className="text-xs font-medium text-red-500">
                                {marketData.sellOrders}
                            </span>
                        </div>
                    </div>

                    {/* Match Button */}
                    {token && onMatch && (
                        <>
                            <div className="px-4 py-1">
                                <Separator orientation="vertical" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={onMatch}
                                    disabled={matching}
                                    variant="ghost"
                                    size="sm"
                                    className="h-fit py-1 text-xs text-primary hover:bg-primary/10"
                                >
                                    {matching ? (
                                        <>
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                            Matching...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-1 h-3 w-3" />
                                            Match
                                        </>
                                    )}
                                </Button>
                                {matchResult && (
                                    <span className="text-xs font-medium">{matchResult}</span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
