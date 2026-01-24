'use client'

import { TrendingUp, Sun, Wind, Activity } from 'lucide-react'

export default function P2PPriceIndex() {
    const data = [
        { name: 'Solar Energy', price: 0.45, change: '+2.4%', icon: Sun, color: 'text-orange-500' },
        { name: 'Wind Energy', price: 0.38, change: '-0.8%', icon: Wind, color: 'text-blue-500' },
        { name: 'Grid Average', price: 0.41, change: '+1.2%', icon: Activity, color: 'text-secondary-foreground' }
    ]

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <TrendingUp className="mr-2 text-primary" size={20} /> Live Market Index
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Provenance-Based Price Discovery</p>
                </div>
            </div>

            <div className="space-y-4">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center justify-between items-center p-3 rounded bg-muted/30 border border-border">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded bg-background border border-border ${item.color}`}>
                                <item.icon size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-foreground">{item.name}</p>
                                <p className="text-[9px] text-secondary-foreground font-bold uppercase">Base Price Index</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-foreground">${item.price}</p>
                            <p className={`text-[8px] font-bold ${item.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                {item.change} (24H)
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-[9px] text-secondary-foreground italic mt-6 pt-4 border-t border-border opacity-50">
                Prices are derived from the last 100 confidential p2p trades. Provenance tags (Solar/Wind) influence market weight.
            </p>
        </div>
    )
}
