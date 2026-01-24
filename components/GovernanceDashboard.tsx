'use client'

import { useGovernance } from '@/contexts/GovernanceProvider'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { FileText, ThumbsUp, ThumbsDown, Vote, Calendar, Lock } from 'lucide-react'
import { useState } from 'react'

export default function GovernanceDashboard() {
    const { proposals, votePrivate } = useGovernance()
    const { isUnlocked } = usePrivacy()
    const [view, setView] = useState<'ACTIVE' | 'PASSED'>('ACTIVE')

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Vote className="mr-2 text-primary" size={20} /> Private Governance
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Proof-of-Stake Grid Consensus</p>
                </div>
                {!isUnlocked && (
                    <div className="flex items-center px-3 py-1 bg-primary/10 rounded border border-primary/20 text-[9px] font-black text-primary">
                        <Lock size={10} className="mr-2" /> PRIVACY LOCKED
                    </div>
                )}
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {proposals.map((prop) => {
                    const total = prop.supportWeight + prop.opposeWeight
                    const supportPct = total > 0 ? (prop.supportWeight / total) * 100 : 0

                    return (
                        <div key={prop.id} className="p-5 rounded-lg border bg-muted/30 border-border hover:border-primary/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-[9px] font-mono text-primary bg-primary/10 px-1 rounded">{prop.id}</span>
                                        <span className="text-[9px] font-bold text-secondary-foreground uppercase tracking-widest flex items-center">
                                            <Calendar size={10} className="mr-1" /> Ends in 3 Days
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{prop.title}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-foreground">{(total / 1000).toFixed(1)}k GRX Total</p>
                                    <p className="text-[8px] text-secondary-foreground uppercase font-black">Weight Cast</p>
                                </div>
                            </div>

                            <p className="text-[11px] text-secondary-foreground mb-6 line-clamp-2 leading-relaxed">
                                {prop.description}
                            </p>

                            <div className="space-y-4">
                                <div className="h-1.5 w-full bg-red-500/20 rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-1000"
                                        style={{ width: `${supportPct}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] font-black uppercase">
                                    <span className="text-green-500">Support {supportPct.toFixed(0)}%</span>
                                    <span className="text-red-500">Oppose {(100 - supportPct).toFixed(0)}%</span>
                                </div>

                                <div className="flex space-x-3 pt-2">
                                    <button
                                        disabled={!isUnlocked || prop.hasVoted}
                                        onClick={() => votePrivate(prop.id, true)}
                                        className="flex-1 rounded border border-green-500/30 bg-green-500/5 py-2 text-[10px] font-black text-green-500 hover:bg-green-500 hover:text-white transition-all disabled:opacity-30 flex items-center justify-center"
                                    >
                                        {prop.hasVoted ? 'VOTED' : <><ThumbsUp size={12} className="mr-2" /> SUPPORT</>}
                                    </button>
                                    <button
                                        disabled={!isUnlocked || prop.hasVoted}
                                        onClick={() => votePrivate(prop.id, false)}
                                        className="flex-1 rounded border border-red-500/30 bg-red-500/5 py-2 text-[10px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 flex items-center justify-center"
                                    >
                                        {prop.hasVoted ? 'VOTED' : <><ThumbsDown size={12} className="mr-2" /> OPPOSE</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-start space-x-3 opacity-50">
                <FileText className="text-secondary-foreground mt-0.5" size={14} />
                <p className="text-[9px] text-secondary-foreground leading-relaxed italic">
                    Governance weight is proven via ZK-SNARKs. Only your stake weight is revealed to the total tally; your wallet identity and specific balance remain confidential.
                </p>
            </div>
        </div>
    )
}
