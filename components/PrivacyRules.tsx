'use client'

import { usePrivacy } from '@/contexts/PrivacyProvider'
import { ShieldCheck, Plus, Trash2, Sliders, Zap, Wallet } from 'lucide-react'

export default function PrivacyRules() {
    const { privacyPolicies, addPolicy, removePolicy } = usePrivacy()

    const availableRules = [
        { type: 'SOLAR_ONLY', name: 'Green Origin Filter', description: 'Only allow Solar energy transfers', icon: Zap },
        { type: 'MAX_AMOUNT', name: 'Shielding Limit', description: 'Prevent trades above 5,000 GRX', value: 5000, icon: Wallet }
    ]

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Sliders className="mr-2 text-primary" size={20} /> Smart Trade Policies
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Rule-Based Confidential Logic</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {availableRules.map((rule) => {
                    const isActive = privacyPolicies.some(p => p.type === rule.type)
                    return (
                        <div
                            key={rule.type}
                            className={`p-4 rounded-lg border transition-all ${isActive ? 'bg-primary/5 border-primary/30' : 'bg-muted/50 border-border opacity-60 hover:opacity-100'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-md ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-secondary-foreground'}`}>
                                        <rule.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">{rule.name}</p>
                                        <p className="text-[10px] text-secondary-foreground">{rule.description}</p>
                                    </div>
                                </div>
                                {!isActive ? (
                                    <button
                                        onClick={() => addPolicy(rule)}
                                        className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
                                    >
                                        <Plus size={16} />
                                    </button>
                                ) : (
                                    <div className="flex items-center space-x-1">
                                        <ShieldCheck size={16} className="text-primary" />
                                        <button
                                            onClick={() => removePolicy(privacyPolicies.find(p => p.type === rule.type).id)}
                                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="rounded-lg bg-secondary/5 p-4 border border-secondary/10 flex items-start space-x-3">
                <ShieldCheck className="text-secondary-foreground mt-0.5" size={16} />
                <p className="text-[10px] text-secondary-foreground leading-relaxed">
                    <b>Programmable Privacy:</b> Policies are evaluated locally by your ZK module before any proof is generated.
                    This ensures your automated trading strategy remains as confidential as your balance.
                </p>
            </div>
        </div>
    )
}
