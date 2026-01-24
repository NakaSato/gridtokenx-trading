'use client'

import { useState } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { toast } from 'react-hot-toast'
import { ENERGY_TOKEN_MINT } from '@/utils/const'
import { useWalletBalance } from '@/hooks/useWalletBalance'

interface ShieldModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ShieldModal({ isOpen, onClose }: ShieldModalProps) {
    const [amount, setAmount] = useState('')
    const [origin, setOrigin] = useState<'Solar' | 'Wind'>('Solar')
    const [isShielding, setIsShielding] = useState(false)
    const { shield } = usePrivacy()
    const { data: balanceData } = useWalletBalance()

    const publicBalance = balanceData?.token_balance || 0

    if (!isOpen) return null

    const handleShield = async () => {
        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Invalid amount')
            return
        }

        setIsShielding(true)
        const toastId = toast.loading('Generating ZK Proof and Shielding...')

        try {
            const sig = await shield(numAmount, origin)
            toast.success(`${origin} tokens shielded successfully!`, { id: toastId })
            onClose()
        } catch (error: any) {
            console.error('[ShieldModal] Shielding failed:', error)
            toast.error(`Shielding failed: ${error.message}`, { id: toastId })
        } finally {
            setIsShielding(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
                <h2 className="mb-4 text-xl font-bold text-foreground">Shield Tokens</h2>
                <p className="mb-4 text-sm text-secondary-foreground">
                    Convert your public <b>GridTokens</b> into a private balance.
                    This uses Zero-Knowledge proofs to hide your amount on-chain.
                </p>

                <div className="mb-6 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-secondary-foreground">Public Balance</span>
                        <span className="font-medium text-foreground">{publicBalance} GRX</span>
                    </div>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amount to shield"
                        className="w-full rounded-md border bg-muted p-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="mb-6">
                    <label className="text-[10px] font-bold text-secondary-foreground uppercase mb-2 block">Energy Source</label>
                    <div className="flex space-x-2">
                        {['Solar', 'Wind'].map((src) => (
                            <button
                                key={src}
                                onClick={() => setOrigin(src as any)}
                                className={`flex-1 py-2 rounded-md border text-xs font-bold transition-all ${origin === src ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                                    }`}
                            >
                                {src === 'Solar' ? '☀️ SOLAR' : '💨 WIND'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-md border py-2 text-sm font-medium hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleShield}
                        disabled={isShielding || !amount}
                        className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isShielding ? 'Processing...' : 'Shield Tokens'}
                    </button>
                </div>
            </div>
        </div>
    )
}
