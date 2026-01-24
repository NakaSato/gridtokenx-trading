'use client'

import { useState } from 'react'
import { Shield, Lock, Unlock, Zap } from 'lucide-react'

interface PrivacyLockProps {
    onUnlock: () => void
    isDeriving: boolean
}

export default function PrivacyLock({ onUnlock, isDeriving }: PrivacyLockProps) {
    const [pin, setPin] = useState('')

    return (
        <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in fade-in duration-500">
            <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
                <div className="relative rounded-full bg-background p-6 border-2 border-primary/30 shadow-2xl">
                    <Lock className="text-primary" size={48} />
                </div>
            </div>

            <div className="text-center max-w-[320px] space-y-3">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Privacy Portal</h2>
                <p className="text-xs text-secondary-foreground leading-relaxed">
                    Authorize access to your confidential GridToken assets.
                    Your signature will derive a session-specific ZK root key.
                </p>
            </div>

            <div className="w-full max-w-[280px] space-y-4">
                <div className="flex justify-center space-x-3 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-full border-2 border-primary/50 transition-all ${pin.length >= i ? 'bg-primary scale-125' : 'bg-transparent'
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={onUnlock}
                    disabled={isDeriving}
                    className="group relative w-full overflow-hidden rounded-lg bg-primary py-4 text-sm font-black text-primary-foreground shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                    <span className="relative z-10 flex items-center justify-center">
                        {isDeriving ? 'GENERATING SECRETS...' : 'UNLOCK CONFIDENTIAL ASSETS'}
                        {!isDeriving && <Unlock className="ml-2 group-hover:rotate-12 transition-transform" size={18} />}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20"></div>
                </button>

                <div className="flex items-center justify-center space-x-4 text-[9px] font-bold text-primary/40 uppercase tracking-widest">
                    <span>AES-256</span>
                    <div className="w-1 h-1 rounded-full bg-primary/20"></div>
                    <span>ZK-SNARK</span>
                    <div className="w-1 h-1 rounded-full bg-primary/20"></div>
                    <span>CURVE25519</span>
                </div>
            </div>

            <div className="pt-4 flex items-center space-x-2 text-[10px] text-secondary-foreground opacity-60">
                <Shield size={12} />
                <span>End-to-end encrypted session</span>
            </div>
        </div>
    )
}
