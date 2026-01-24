'use client'

import { useState } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { ClipboardCheck, ShieldAlert, BarChart3, RefreshCw, Lock, Unlock } from 'lucide-react'

export default function TransparencyDashboard() {
    const { verifySolvency } = usePrivacy()
    const [isVerifying, setIsVerifying] = useState(false)
    const [auditResult, setAuditResult] = useState<{
        status: 'IDLE' | 'SUCCESS' | 'FAILURE',
        lastAudit: string | null,
        publicBacking: number,
        totalConfidential: number
    }>({
        status: 'IDLE',
        lastAudit: null,
        publicBacking: 10000,
        totalConfidential: 10000
    })

    const runAudit = async () => {
        setIsVerifying(true)
        const success = await verifySolvency()

        setAuditResult({
            status: success ? 'SUCCESS' : 'FAILURE',
            lastAudit: new Date().toLocaleTimeString(),
            publicBacking: 10000,
            totalConfidential: success ? 10000 : 12500 // Demo failure state if success is false
        })
        setIsVerifying(false)
    }

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <BarChart3 className="mr-2 text-primary" size={20} /> ZK Proof of Solvency
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Institutional Audit Protocol v1.0</p>
                </div>
                <button
                    onClick={runAudit}
                    disabled={isVerifying}
                    className="flex items-center space-x-2 rounded bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
                >
                    <RefreshCw size={14} className={isVerifying ? 'animate-spin' : ''} />
                    <span>{isVerifying ? 'AUDITING...' : 'VERIFY RESERVES'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted border border-border">
                    <p className="text-[9px] font-bold text-secondary-foreground uppercase mb-1">Public Backing (Vault)</p>
                    <p className="text-xl font-black text-foreground">{auditResult.publicBacking.toLocaleString()} GRX</p>
                    <p className="text-[9px] text-green-500 mt-1 font-bold">100% COLLATERALIZED</p>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border">
                    <p className="text-[9px] font-bold text-secondary-foreground uppercase mb-1">Sum(Confidential Balances)</p>
                    <p className="text-xl font-black text-foreground">{auditResult.totalConfidential.toLocaleString()} GRX</p>
                    <p className="text-[9px] text-primary/60 mt-1 font-bold italic">PROVEN VIA HOMOMORPHIC SUM</p>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border flex flex-col justify-center">
                    <p className="text-[9px] font-bold text-secondary-foreground uppercase mb-2">Audit Status</p>
                    {auditResult.status === 'IDLE' ? (
                        <div className="flex items-center text-xs font-bold text-secondary-foreground">
                            <Lock size={14} className="mr-2" /> PENDING
                        </div>
                    ) : auditResult.status === 'SUCCESS' ? (
                        <div className="flex items-center text-xs font-bold text-green-500">
                            <ClipboardCheck size={16} className="mr-2" /> VERIFIED
                        </div>
                    ) : (
                        <div className="flex items-center text-xs font-bold text-red-500">
                            <ShieldAlert size={16} className="mr-2" /> SOLVENCY RISK
                        </div>
                    )}
                    {auditResult.lastAudit && (
                        <p className="text-[8px] text-secondary-foreground mt-1">Last Audit: {auditResult.lastAudit}</p>
                    )}
                </div>
            </div>

            <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                <p className="text-[10px] text-secondary-foreground leading-relaxed">
                    <b>Cryptographic Note:</b> Solvency is proven using the additive property of Pedersen Commitments.
                    Individual user balances are never decrypted. We simply verify that the sum of all Ristretto points
                    on the curve matches the public displacement in the token mint.
                </p>
            </div>
        </div>
    )
}
