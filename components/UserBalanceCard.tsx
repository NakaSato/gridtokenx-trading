'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Wallet, Lock, Zap, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function UserBalanceCard() {
    const { user, getProfile, isLoading } = useAuth()
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = async () => {
        setRefreshing(true)
        try {
            await getProfile()
        } catch (error) {
            console.error('Failed to refresh balance:', error)
        } finally {
            setRefreshing(false)
        }
    }

    // Format currency
    const formatCurrency = (amount?: number) => {
        if (amount === undefined || amount === null) return '฿0.00'
        return `฿${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    // Format energy
    const formatEnergy = (amount?: number) => {
        if (amount === undefined || amount === null) return '0.00 kWh'
        return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh`
    }

    if (!user) {
        return null
    }

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing || isLoading}
                    className="p-1 hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                    title="Refresh balance"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Available Balance */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <Wallet className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Available Balance</p>
                            <p className="text-lg font-bold text-green-500">
                                {formatCurrency(user.balance)}
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Locked Amount */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                            <Lock className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Locked (In Escrow)</p>
                            <p className="text-lg font-semibold text-yellow-500">
                                {formatCurrency(user.locked_amount)}
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Locked Energy */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Zap className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Locked Energy</p>
                            <p className="text-lg font-semibold text-blue-500">
                                {formatEnergy(user.locked_energy)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Summary */}
                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Assets</span>
                        <span className="text-sm font-bold">
                            {formatCurrency((user.balance || 0) + (user.locked_amount || 0))}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
