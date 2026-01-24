'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { toast } from 'react-hot-toast'
import { Gift, ShieldCheck, ArrowRight } from 'lucide-react'

export default function ClaimStealthModal() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { isUnlocked, claimStealthLink, refresh } = usePrivacy()
    const [payload, setPayload] = useState<string | null>(null)
    const [isClaiming, setIsClaiming] = useState(false)
    const [claimDone, setClaimDone] = useState(false)

    useEffect(() => {
        const s = searchParams.get('s')
        if (s) {
            setPayload(s)
        }
    }, [searchParams])

    const handleClaim = async () => {
        if (!payload || !isUnlocked) return

        setIsClaiming(true)
        const toastId = toast.loading('Decrypting and Claiming Private Tokens...')

        try {
            await claimStealthLink(payload)
            toast.success('Tokens successfully claimed into your private balance!', { id: toastId })
            setClaimDone(true)
            await refresh()
        } catch (error: any) {
            console.error('[ClaimStealth] Claim failed:', error)
            toast.error(`Claim failed: ${error.message}`, { id: toastId })
        } finally {
            setIsClaiming(false)
        }
    }

    const closeAndRedirect = () => {
        setPayload(null)
        // Clear search params
        router.replace(window.location.pathname)
    }

    if (!payload) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="w-full max-w-md rounded-xl border-2 border-primary/30 bg-background p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 rounded-full bg-primary/10 p-4 ring-8 ring-primary/5">
                        <Gift className="text-primary" size={48} />
                    </div>

                    <h2 className="mb-2 text-2xl font-black text-foreground uppercase tracking-tight">Private Tokens Found!</h2>
                    <p className="mb-8 text-sm text-secondary-foreground leading-relaxed">
                        An encrypted stealth link has been detected. You can claim these confidential GridTokens directly into your secure balance.
                    </p>

                    {!isUnlocked ? (
                        <div className="w-full rounded-lg bg-red-500/10 p-4 border border-red-500/20 mb-6">
                            <p className="text-xs text-red-500 font-bold">Privacy Module Locked</p>
                            <p className="text-[10px] text-red-400 mt-1 uppercase">Please unlock your privacy dashboard first to claim.</p>
                        </div>
                    ) : (
                        !claimDone && (
                            <button
                                onClick={handleClaim}
                                disabled={isClaiming}
                                className="group relative w-full overflow-hidden rounded-lg bg-primary py-4 text-sm font-black text-primary-foreground shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                <span className="relative z-10 flex items-center justify-center">
                                    {isClaiming ? 'SECURING FUNDS...' : 'CLAIM CONFIDENTIAL TOKENS'}
                                    {!isClaiming && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />}
                                </span>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20"></div>
                            </button>
                        )
                    )}

                    {claimDone && (
                        <div className="w-full animate-in zoom-in duration-300">
                            <div className="flex flex-col items-center py-4 bg-green-500/10 rounded-lg border border-green-500/20 mb-6">
                                <ShieldCheck className="text-green-500 mb-2" size={32} />
                                <span className="text-xs font-bold text-green-500 uppercase">Tokens Secured</span>
                            </div>
                            <button
                                onClick={closeAndRedirect}
                                className="w-full rounded-lg border py-3 text-sm font-bold text-foreground hover:bg-muted transition-colors"
                            >
                                GO TO DASHBOARD
                            </button>
                        </div>
                    )}

                    {!claimDone && (
                        <button
                            onClick={closeAndRedirect}
                            className="mt-4 text-[10px] font-bold text-secondary-foreground hover:text-foreground uppercase tracking-widest"
                        >
                            Dismiss Link
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
