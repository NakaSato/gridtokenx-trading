'use client'

import { useState } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { Link2, ArrowRightLeft, ShieldCheck, Globe, Info, Zap, Layers } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function BridgePortal() {
    const { privateBalance, isUnlocked, isReadOnly } = usePrivacy()
    const [destinationChain, setDestinationChain] = useState<'ETH' | 'BASE' | 'ARB'>('ETH')
    const [amount, setAmount] = useState(100)
    const [isBridging, setIsBridging] = useState(false)

    const handleBridge = async () => {
        if (!isUnlocked || isReadOnly) return
        setIsBridging(true)
        const toastId = toast.loading(`Initiating Private Bridge to ${destinationChain}...`)

        try {
            // In a real system:
            // 1. User locks the ZK Commitment on Solana via the Bridge Program.
            // 2. A ZK-Relay observes the lock and generates a cross-chain proof.
            // 3. The destination chain mints a "Wrapped Private Commitment" (WPC).
            // 4. Privacy and provenance are preserved throughout.
            await new Promise(r => setTimeout(r, 2500))

            toast.success(`Successfully bridged ${amount} GRX to ${destinationChain}!`, { id: toastId })
        } catch (e) {
            toast.error('Bridge transaction failed', { id: toastId })
        } finally {
            setIsBridging(false)
        }
    }

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Link2 className="mr-2 text-primary" size={20} /> ZK-Confidential Bridge
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Cross-Chain Private Provenance</p>
                </div>
            </div>

            <div className="space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest">Source Network</label>
                        <div className="p-3 bg-muted rounded border border-border flex items-center space-x-2">
                            <Zap size={14} className="text-primary" />
                            <span className="text-xs font-black">SOLANA</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest">Destination Network</label>
                        <select
                            value={destinationChain}
                            onChange={(e) => setDestinationChain(e.target.value as any)}
                            className="w-full p-3 bg-muted rounded border border-border text-xs font-black outline-none focus:border-primary transition-all"
                        >
                            <option value="ETH">ETHEREUM (L1)</option>
                            <option value="BASE">BASE (L2)</option>
                            <option value="ARB">ARBITRUM (L2)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest block">Amount to Bridge (GRX)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full bg-muted border border-border rounded px-4 py-3 text-sm font-black outline-none focus:border-primary transition-all"
                        />
                        <Layers size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40" />
                    </div>
                </div>

                <button
                    onClick={handleBridge}
                    disabled={!isUnlocked || isReadOnly || isBridging || (privateBalance?.amount || 0) < amount}
                    className="w-full rounded bg-primary py-4 text-xs font-black text-primary-foreground hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-30 flex items-center justify-center"
                >
                    {isBridging ? 'ESTABLISHING ZK-CHANNEL...' : <><ArrowRightLeft size={16} className="mr-2" /> EXECUTE PRIVATE BRIDGE</>}
                </button>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-start space-x-3 opacity-60">
                <Globe className="text-secondary-foreground mt-0.5" size={14} />
                <p className="text-[9px] text-secondary-foreground leading-relaxed italic">
                    <b>Universal Privacy:</b> GridTokenX uses a "Lock-and-Mint" ZK protocol. The Ristretto commitment itself is bridged, ensuring that your energy provenance (Solar/Wind origin) and balance magnitude remain completely confidential across fragmented liquidity pools.
                </p>
            </div>
        </div>
    )
}
