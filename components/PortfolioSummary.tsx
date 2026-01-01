'use client'

import React, { useContext } from 'react'
import { Card, CardContent } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { Wallet, PieChart } from 'lucide-react'
import { ContractContext } from '@/contexts/contractProvider'
import { usePortfolioValuation } from '@/hooks/usePortfolioValuation'

export default function PortfolioSummary() {
    const { program, pub } = useContext(ContractContext)
    const { totalValue, isLoading } = usePortfolioValuation(program, pub || null)

    if (isLoading) {
        return <Skeleton className="h-24 w-full rounded-sm" />
    }

    return (
        <div className="flex w-full">
            <Card className="rounded-sm border-border bg-card/50 backdrop-blur-sm w-full">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Wallet className="w-3 h-3" />
                            Active Value
                        </p>
                        <h3 className="text-2xl font-bold text-foreground">
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-primary" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
