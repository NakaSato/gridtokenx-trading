'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { FuturesPosition } from '@/types/futures'
const { FixedSizeList: List } = require('react-window')

import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import SkeletonTable from '@/components/ui/SkeletonTable'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export default function PositionsTable() {
    const queryClient = useQueryClient()

    const { data: positions = [], isLoading: loading } = useQuery({
        queryKey: ['futuresPositions'],
        queryFn: async () => {
            const response = await defaultApiClient.getFuturesPositions()
            const positionsData = (response.data as any)?.data
            return Array.isArray(positionsData) ? positionsData : []
        },
        refetchInterval: 30000,
    })

    // WebSocket real-time updates
    useEffect(() => {
        const handleWsMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const message = customEvent.detail
            const refreshEvents = ['TradeExecuted', 'OrderMatched']

            if (refreshEvents.includes(message.type)) {
                console.log('⚡ Futures Positions real-time update:', message.type)
                queryClient.invalidateQueries({ queryKey: ['futuresPositions'] })
            }
        }

        window.addEventListener('ws-message', handleWsMessage)
        return () => window.removeEventListener('ws-message', handleWsMessage)
    }, [queryClient])

    const handleClosePosition = async (positionId: string) => {
        if (!confirm('Are you sure you want to close this position?')) return

        const { error } = await defaultApiClient.closeFuturesPosition(positionId)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Position closed successfully')
            queryClient.invalidateQueries({ queryKey: ['futuresPositions'] })
        }
    }

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const pos = positions[index]
        if (!pos) return null
        return (
            <div style={style}>
                <div className="flex w-full items-center border-b transition-colors hover:bg-muted/50 text-sm">
                    <div className="flex-1 p-4 font-medium">{pos.product_symbol}</div>
                    <div className={`w-[80px] p-4 ${pos.side === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                        {pos.side.toUpperCase()}
                    </div>
                    <div className="w-[100px] p-4">{Number(pos.quantity).toFixed(0)}</div>
                    <div className="w-[120px] p-4">{Number(pos.entry_price).toFixed(2)}</div>
                    <div className="w-[120px] p-4">{Number(pos.current_price).toFixed(2)}</div>
                    <div className={`w-[100px] p-4 ${Number(pos.unrealized_pnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Number(pos.unrealized_pnl).toFixed(2)}
                    </div>
                    <div className="w-[80px] p-4">{pos.leverage}x</div>
                    <div className="w-[100px] p-4">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleClosePosition(pos.id)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (loading && positions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Positions</CardTitle>
                </CardHeader>
                <CardContent>
                    <SkeletonTable rows={5} columns={8} />
                </CardContent>
            </Card>
        )
    }

    return (
        <ErrorBoundary name="Futures Positions">
            <Card>
                <CardHeader>
                    <CardTitle>Positions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-hidden">
                        <div className="flex w-full items-center border-b font-medium text-muted-foreground text-sm cursor-default">
                            <div className="flex-1 px-4 py-3">Symbol</div>
                            <div className="w-[80px] px-4 py-3">Side</div>
                            <div className="w-[100px] px-4 py-3">Size</div>
                            <div className="w-[120px] px-4 py-3">Entry</div>
                            <div className="w-[120px] px-4 py-3">Mark</div>
                            <div className="w-[100px] px-4 py-3">PnL</div>
                            <div className="w-[80px] px-4 py-3">Lev</div>
                            <div className="w-[100px] px-4 py-3">Action</div>
                        </div>
                        <div className="h-[400px]">
                            {(!Array.isArray(positions) || positions.length === 0) ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No active positions
                                </div>
                            ) : (
                                <List
                                    height={400}
                                    itemCount={positions.length}
                                    itemSize={60}
                                    width="100%"
                                >
                                    {Row}
                                </List>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </ErrorBoundary>
    )
}
