'use client'

import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Trash2, TrendingUp, Zap } from 'lucide-react'
import { OptionChainData } from '@/lib/data/dummyData'
import { OptionChainChart } from './OptionChainChart'

interface StrategyLeg extends OptionChainData {
    id: string
    side: 'Long' | 'Short'
    type: 'Call' | 'Put'
}

interface StrategyBuilderProps {
    legs: StrategyLeg[]
    currentPrice: number
    onRemoveLeg: (id: string) => void
    onClear: () => void
    onExecute: () => void
}

export default function StrategyBuilder({ legs, currentPrice, onRemoveLeg, onClear, onExecute }: StrategyBuilderProps) {
    if (legs.length === 0) {
        return (
            <Card className="h-full border-dashed flex flex-col items-center justify-center p-6 text-center space-y-3 bg-muted/20">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Build a Strategy</CardTitle>
                    <p className="text-xs text-muted-foreground">Select options from the chain to simulate complex strategies like Spreads or Condors.</p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="h-full flex flex-col border rounded-sm overflow-hidden bg-background">
            <CardHeader className="px-4 py-3 border-b bg-muted/30 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    < Zap className="h-4 w-4 text-primary" />
                    Strategy Builder
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={onClear}>Clear</Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                    {legs.map((leg) => (
                        <div key={leg.id} className="flex items-center justify-between p-2 rounded-sm bg-accent/50 border group hover:border-primary transition-colors">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] uppercase font-bold ${leg.side === 'Long' ? 'text-green-500' : 'text-red-500'}`}>
                                        {leg.side} {leg.type}
                                    </span>
                                    <span className="text-xs font-medium">${leg.strikePrice} Strike</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">Premium: ${leg.bidPrice.toFixed(2)}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRemoveLeg(leg.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total Cost</span>
                        <span className="font-medium text-foreground">
                            ${legs.reduce((acc, l) => acc + (l.side === 'Long' ? l.bidPrice : -l.bidPrice), 0).toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Max Profit</span>
                        <span className="text-green-500 font-medium">Unlimited</span>
                    </div>
                </div>

                <div className="h-40 bg-accent/30 rounded-sm border relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <OptionChainChart legs={legs} currentPrice={currentPrice} />
                    </div>
                </div>

                <Button className="w-full h-10 bg-primary text-black hover:bg-primary/90 rounded-sm font-bold mt-auto" onClick={onExecute}>
                    Execute Strategy
                </Button>
            </CardContent>
        </Card>
    )
}
