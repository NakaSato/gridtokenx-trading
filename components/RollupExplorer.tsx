'use client'

import { useState, useEffect } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { Layers, Zap, ArrowDownToLine, TrendingUp, Cpu, Server } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function RollupExplorer() {
    const { submitRollup, isUnlocked } = usePrivacy()
    const [isAggregating, setIsAggregating] = useState(false)
    const [pendingProofs, setPendingProofs] = useState<any[]>([
        { id: 'TX-882', amount: 120, origin: 'Solar', time: '2m ago' },
        { id: 'TX-901', amount: 45, origin: 'Wind', time: '1m ago' },
        { id: 'TX-914', amount: 230, origin: 'Solar', time: 'Just now' }
    ])

    const handleRollup = async () => {
        if (pendingProofs.length === 0) return
        setIsAggregating(true)
        try {
            await submitRollup(pendingProofs)
            setPendingProofs([])
        } catch (e) {
            console.error(e)
        } finally {
            setIsAggregating(false)
        }
    }

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Layers className="mr-2 text-primary" size={20} /> ZK-Recursive Rollup
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">L2 Energy Scaling Logic</p>
                </div>
                <button
                    onClick={handleRollup}
                    disabled={isAggregating || pendingProofs.length === 0 || !isUnlocked}
                    className="flex items-center space-x-2 rounded bg-primary px-4 py-2 text-xs font-black text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-30"
                >
                    <ArrowDownToLine size={14} />
                    <span>{isAggregating ? 'COMPRESSING...' : 'COMMIT ROLLUP'}</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-[9px] font-bold text-primary uppercase mb-1">Compression Ratio</p>
                    <p className="text-xl font-black text-foreground">{pendingProofs.length > 0 ? `${pendingProofs.length}:1` : '--'}</p>
                    <p className="text-[8px] text-primary/60 mt-1 font-bold">RECURSIVE AGGREGATION</p>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border">
                    <p className="text-[9px] font-bold text-secondary-foreground uppercase mb-1">Network Throughput</p>
                    <p className="text-xl font-black text-foreground">1.5k TPS</p>
                    <p className="text-[8px] text-green-500 mt-1 font-bold flex items-center">
                        <TrendingUp size={8} className="mr-1" /> +1200% EFFICIENCY
                    </p>
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest mb-2 block">Pending Proof Buffer</label>
                {pendingProofs.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-border rounded-lg opacity-30 flex flex-col items-center">
                        <Server size={24} className="mb-2" />
                        <p className="text-[9px] font-bold">BUFFER EMPTY</p>
                    </div>
                ) : (
                    pendingProofs.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded bg-muted/30 border border-border border-l-2 border-l-primary/40">
                            <div className="flex items-center space-x-3">
                                <Zap size={14} className="text-primary/60" />
                                <div>
                                    <p className="text-xs font-bold text-foreground">{p.id}</p>
                                    <p className="text-[9px] text-secondary-foreground">{p.origin} • {p.time}</p>
                                </div>
                            </div>
                            <span className="text-xs font-black text-foreground">+{p.amount} GRX</span>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-start space-x-3 opacity-60">
                <Cpu className="text-secondary-foreground mt-0.5" size={14} />
                <p className="text-[9px] text-secondary-foreground leading-relaxed italic">
                    <b>Recursive Scaling:</b> Instead of verifying each energy meter reading individually, GridTokenX aggregates them into a single "Proof of State" via recursive rollups. This drastically reduces L1 data footprint while maintaining absolute privacy.
                </p>
            </div>
        </div>
    )
}
