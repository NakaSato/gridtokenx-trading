import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import { FuturesPosition } from '@/types/futures'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function PositionsTable({ refreshTrigger }: { refreshTrigger: number }) {
    const [positions, setPositions] = useState<FuturesPosition[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadPositions()
    }, [refreshTrigger])

    const loadPositions = async () => {
        setLoading(true)
        const response = await defaultApiClient.getFuturesPositions()
        // Extract data correctly from the backend ApiResponse wrapper
        const positionsData = (response.data as any)?.data
        if (Array.isArray(positionsData)) {
            setPositions(positionsData)
        } else {
            setPositions([])
        }
        setLoading(false)
    }

    const handleClosePosition = async (positionId: string) => {
        if (!confirm('Are you sure you want to close this position?')) return

        const { error } = await defaultApiClient.closeFuturesPosition(positionId)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Position closed successfully')
            loadPositions()
        }
    }

    if (loading && positions.length === 0) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Positions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Symbol</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Side</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Size</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Entry Price</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Mark Price</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">PnL</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Leverage</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Action</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {(!Array.isArray(positions) || positions.length === 0) ? (
                                <tr>
                                    <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                        No active positions
                                    </td>
                                </tr>
                            ) : (
                                positions.map((pos) => (
                                    <tr key={pos.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{pos.product_symbol}</td>
                                        <td className={`p-4 align-middle ${pos.side === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                                            {pos.side.toUpperCase()}
                                        </td>
                                        <td className="p-4 align-middle">{Number(pos.quantity).toFixed(0)}</td>
                                        <td className="p-4 align-middle">{Number(pos.entry_price).toFixed(2)}</td>
                                        <td className="p-4 align-middle">{Number(pos.current_price).toFixed(2)}</td>
                                        <td className={`p-4 align-middle ${Number(pos.unrealized_pnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {Number(pos.unrealized_pnl).toFixed(2)}
                                        </td>
                                        <td className="p-4 align-middle">{pos.leverage}x</td>
                                        <td className="p-4 align-middle">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleClosePosition(pos.id)}
                                            >
                                                Close
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
