'use client'

import { useState } from 'react'
import { Shield, CheckCircle2, AlertCircle, FileCheck, Globe, UserCheck, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Attribute {
    id: string
    name: string
    description: string
    status: 'VERIFIED' | 'PENDING' | 'NOT_STARTED'
    icon: any
}

export default function IdentityGuard() {
    const [attributes, setAttributes] = useState<Attribute[]>([
        { id: 'ATTR-001', name: 'Residency (EU/US)', description: 'Prove residence in a supported energy market region.', status: 'VERIFIED', icon: Globe },
        { id: 'ATTR-002', name: 'Accredited Investor', description: 'Required for high-volume institutional energy trades (>100k GRX).', status: 'NOT_STARTED', icon: FileCheck },
        { id: 'ATTR-003', name: 'Licensed Technician', description: 'Authorize meter installation and repair signatures.', status: 'PENDING', icon: UserCheck }
    ])

    const generateProof = async (attrId: string) => {
        const toastId = toast.loading('Generating ZK-Identity Attribute Proof...')

        try {
            // In a real system:
            // 1. User selects a credential stored in their "Private Identity Wallet".
            // 2. WASM module generates a ZK proof of property (e.g., country == 'US')
            // 3. No PII is shared, only the proof of valid attribute.
            await new Promise(r => setTimeout(r, 1800))

            setAttributes(prev => prev.map(a => a.id === attrId ? { ...a, status: 'VERIFIED' } : a))
            toast.success('Attribute Verified via ZK Proof', { id: toastId })
        } catch (e) {
            toast.error('Identity proof generation failed', { id: toastId })
        }
    }

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Shield className="mr-2 text-primary" size={20} /> Identity Guard
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Institutional ZK-Compliance Suite</p>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                {attributes.map((attr) => (
                    <div key={attr.id} className="p-4 rounded-lg border border-border bg-muted/20 flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-md ${attr.status === 'VERIFIED' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-secondary-foreground opacity-50'}`}>
                                <attr.icon size={20} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-foreground">{attr.name}</h3>
                                <p className="text-[10px] text-secondary-foreground max-w-[200px] leading-tight mt-0.5">{attr.description}</p>
                            </div>
                        </div>

                        <div>
                            {attr.status === 'VERIFIED' ? (
                                <div className="flex items-center text-[10px] font-black text-green-500 bg-green-500/5 px-3 py-1.5 rounded-full border border-green-500/20">
                                    <CheckCircle2 size={12} className="mr-1.5" /> PROVEN
                                </div>
                            ) : attr.status === 'PENDING' ? (
                                <div className="flex items-center text-[10px] font-black text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20 animate-pulse">
                                    <AlertCircle size={12} className="mr-1.5" /> PENDING
                                </div>
                            ) : (
                                <button
                                    onClick={() => generateProof(attr.id)}
                                    className="text-[10px] font-black text-primary hover:underline px-3 py-1.5"
                                >
                                    PROVE VIA ZK
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-start space-x-3 opacity-60">
                <Lock className="text-secondary-foreground mt-0.5" size={14} />
                <p className="text-[9px] text-secondary-foreground leading-relaxed italic">
                    <b>Confidential KYC:</b> GridTokenX uses ZK-Personhood technology. You prove your eligibility to regulators and grid operators without exposing your passport, address, or tax ID on the public ledger.
                </p>
            </div>
        </div>
    )
}
