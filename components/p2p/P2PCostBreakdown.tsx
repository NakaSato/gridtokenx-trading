'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { defaultApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import {
    Zap,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    Loader2,
    DollarSign,
    Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { P2P_CONFIG } from '@/lib/constants'

interface P2PCostBreakdownProps {
    buyerZone: number
    sellerZone: number
    energyAmount: number
    agreedPrice?: number
    onCostCalculated?: (cost: P2PTransactionCost | null) => void
}

interface P2PTransactionCost {
    energy_cost: number
    wheeling_charge: number
    loss_cost: number
    total_cost: number
    effective_energy: number
    loss_factor: number
    loss_allocation: string
    zone_distance_km: number
    buyer_zone: number
    seller_zone: number
    is_grid_compliant: boolean
    grid_violation_reason?: string
}

export default function P2PCostBreakdown({
    buyerZone,
    sellerZone,
    energyAmount,
    agreedPrice,
    onCostCalculated
}: P2PCostBreakdownProps) {
    const { token } = useAuth()
    const [cost, setCost] = useState<P2PTransactionCost | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Market prices for comparison (use config defaults)
    const [gridImportPrice, setGridImportPrice] = useState(P2P_CONFIG.defaultGridImportPrice)
    const [gridExportPrice, setGridExportPrice] = useState(P2P_CONFIG.defaultGridExportPrice)

    useEffect(() => {
        const fetchCost = async () => {
            if (energyAmount <= 0) {
                setCost(null)
                onCostCalculated?.(null)
                return
            }

            setLoading(true)
            setError(null)

            try {
                if (token) {
                    defaultApiClient.setToken(token)
                }

                const response = await defaultApiClient.calculateP2PCost({
                    buyer_zone_id: buyerZone,
                    seller_zone_id: sellerZone,
                    energy_amount: energyAmount,
                    agreed_price: agreedPrice
                })

                if (response.data) {
                    setCost(response.data)
                    onCostCalculated?.(response.data)
                } else if (response.error) {
                    setError(response.error)
                    onCostCalculated?.(null)
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to calculate cost'
                setError(errorMessage)
                onCostCalculated?.(null)
            } finally {
                setLoading(false)
            }
        }

        // Debounce the API call
        const timer = setTimeout(fetchCost, 300)
        return () => clearTimeout(timer)
    }, [buyerZone, sellerZone, energyAmount, agreedPrice, token, onCostCalculated])

    // Fetch market prices
    useEffect(() => {
        const fetchMarketPrices = async () => {
            try {
                if (token) {
                    defaultApiClient.setToken(token)
                }
                const response = await defaultApiClient.getP2PMarketPrices()
                if (response.data) {
                    setGridImportPrice(response.data.grid_import_price_thb_kwh)
                    setGridExportPrice(response.data.grid_export_price_thb_kwh)
                }
            } catch (err) {
                // Use default values
            }
        }
        fetchMarketPrices()
    }, [token])

    if (loading) {
        return (
            <Card className="border-border/50 bg-card/50 rounded-sm">
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Calculating...</span>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="border-destructive/50 bg-destructive/5 rounded-sm">
                <CardContent className="flex items-center py-4">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <span className="ml-2 text-sm text-destructive">{error}</span>
                </CardContent>
            </Card>
        )
    }

    if (!cost || energyAmount <= 0) {
        return (
            <Card className="border-border/50 bg-card/50 rounded-sm">
                <CardContent className="py-6 text-center">
                    <Activity className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter energy amount to see cost breakdown
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Calculate P2P vs Grid comparison
    const gridImportCost = energyAmount * gridImportPrice
    const gridExportValue = energyAmount * gridExportPrice
    const buyerSavings = gridImportCost - cost.total_cost
    const sellerPremium = cost.energy_cost - gridExportValue

    const zoneLabel = cost.buyer_zone === cost.seller_zone
        ? 'Local (Same Zone)'
        : Math.abs(cost.buyer_zone - cost.seller_zone) === 1
            ? 'Adjacent Zone'
            : 'Cross-Grid Transmission'

    return (
        <Card className="border-border/50 bg-card/50 rounded-sm shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-sm font-medium">
                        <DollarSign className="mr-2 h-4 w-4 text-primary" />
                        Transaction Cost Breakdown
                    </CardTitle>
                    <Badge
                        variant={cost.is_grid_compliant ? "default" : "destructive"}
                        className="text-xs rounded-sm"
                    >
                        {cost.is_grid_compliant ? (
                            <><CheckCircle className="mr-1 h-3 w-3" /> Grid OK</>
                        ) : (
                            <><AlertCircle className="mr-1 h-3 w-3" /> {cost.grid_violation_reason}</>
                        )}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Zone Info */}
                <div className="flex items-center justify-between rounded-sm bg-muted/50 p-3">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-sm">Zone {cost.seller_zone}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="rounded-sm">Zone {cost.buyer_zone}</Badge>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-muted-foreground">{zoneLabel}</span>
                        <span className="ml-2 text-xs font-medium">{cost.zone_distance_km} km</span>
                    </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Energy Cost</span>
                        <span className="font-mono">฿{cost.energy_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Wheeling Charge</span>
                        <span className="font-mono">฿{cost.wheeling_charge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            Loss ({(cost.loss_factor * 100).toFixed(1)}%)
                        </span>
                        <span className="font-mono text-destructive/80">฿{cost.loss_cost.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                        <div className="flex justify-between font-medium">
                            <span>Total Cost</span>
                            <span className="font-mono text-lg">฿{cost.total_cost.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Effective Energy */}
                <div className="rounded-sm bg-primary/10 p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Effective Energy Received</span>
                        </div>
                        <span className="font-mono font-medium text-primary">
                            {cost.effective_energy.toFixed(4)} kWh
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {cost.loss_allocation === 'RECEIVER' ? 'Buyer' : 'Seller'} absorbs {(cost.loss_factor * 100).toFixed(1)}% transmission loss
                    </p>
                </div>

                {/* P2P vs Grid Comparison */}
                <div className="space-y-2 rounded-sm border border-border/50 p-3">
                    <h4 className="text-xs font-medium uppercase text-muted-foreground">
                        P2P vs Grid Comparison
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center gap-1">
                                {buyerSavings > 0 ? (
                                    <TrendingDown className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <TrendingUp className="h-4 w-4 text-destructive" />
                                )}
                                <span className="text-xs text-muted-foreground">Buyer Savings</span>
                            </div>
                            <span className={cn(
                                "font-mono text-sm font-medium",
                                buyerSavings > 0 ? "text-emerald-500" : "text-destructive"
                            )}>
                                {buyerSavings > 0 ? '+' : ''}฿{buyerSavings.toFixed(2)}
                            </span>
                        </div>

                        <div>
                            <div className="flex items-center gap-1">
                                {sellerPremium > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-destructive" />
                                )}
                                <span className="text-xs text-muted-foreground">Seller Premium</span>
                            </div>
                            <span className={cn(
                                "font-mono text-sm font-medium",
                                sellerPremium > 0 ? "text-emerald-500" : "text-destructive"
                            )}>
                                {sellerPremium > 0 ? '+' : ''}฿{sellerPremium.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                        Grid Import: ฿{gridImportPrice}/kWh • Grid Export: ฿{gridExportPrice}/kWh
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
