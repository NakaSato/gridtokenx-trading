'use client'

import { usePrivacy } from '@/contexts/PrivacyProvider'
import { ArrowUpRight, ArrowDownLeft, Shield, Clock, Landmark } from 'lucide-react'

export default function TransactionHistory() {
    const { transactionHistory, isUnlocked } = usePrivacy()

    if (!isUnlocked) return null

    if (transactionHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                <Clock className="mb-2 text-secondary-foreground" size={32} />
                <p className="text-xs font-bold uppercase tracking-widest text-secondary-foreground">No Private Activity Yet</p>
                <p className="max-w-[200px] text-[10px] mt-1 leading-relaxed">Your confidential transactions will appear here once they occur on-chain.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest mb-4">Confidential Activity</h3>

            <div className="space-y-2">
                {transactionHistory.map((entry, idx) => (
                    <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border hover:bg-muted/60 transition-colors animate-in fade-in slide-in-from-left-2 duration-300"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${entry.type === 'SHIELD' ? 'bg-green-500/10 text-green-500' :
                                    entry.type === 'TRANSFER' ? 'bg-primary/10 text-primary' :
                                        'bg-red-500/10 text-red-500'
                                }`}>
                                {entry.type === 'SHIELD' ? <ArrowDownLeft size={16} /> :
                                    entry.type === 'TRANSFER' ? <ArrowUpRight size={16} /> :
                                        <Shield size={16} />}
                            </div>

                            <div>
                                <p className="text-xs font-bold text-foreground flex items-center">
                                    {entry.type}
                                    {entry.origin && <span className="ml-2 text-[9px] px-1 rounded bg-secondary text-secondary-foreground uppercase font-black">{entry.origin}</span>}
                                </p>
                                <p className="text-[9px] text-secondary-foreground leading-tight">
                                    {new Date(entry.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className={`text-xs font-black ${entry.type === 'SHIELD' ? 'text-green-500' : 'text-foreground'
                                }`}>
                                {entry.type === 'SHIELD' ? '+' : '-'}{entry.amount.toLocaleString()} GRX
                            </p>
                            {entry.recipient && (
                                <p className="text-[8px] font-mono text-secondary-foreground truncate max-w-[80px]">
                                    To: {entry.recipient}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-[8px] text-center text-primary/40 italic pt-4">
                ⚠️ All metadata is encrypted on-chain. Only your derived key can view this history.
            </p>
        </div>
    )
}
