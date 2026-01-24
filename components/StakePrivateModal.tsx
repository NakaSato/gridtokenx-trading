'use client'

import { useState } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { toast } from 'react-hot-toast'
import { Landmark, TrendingUp, Info } from 'lucide-react'

interface StakePrivateModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function StakePrivateModal({ isOpen, onClose }: StakePrivateModalProps) {
    const [amount, setAmount] = useState('')
    const [isStaking, setIsStaking] = useState(false)
    const { privateBalance, stakePrivate } = usePrivacy()

    const availableBalance = privateBalance?.amount ?? 0

    if (!isOpen) return null

    const handleStake = async () => {
        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Invalid amount')
            return
        }

        if (numAmount > availableBalance) {
            toast.error('Insufficient private balance')
            return
        }

        setIsStaking(true)
        const toastId = toast.loading('Generating Staking Proof and Locking Tokens...')

        try {
            await stakePrivate(numAmount)
            toast.success(`GridTokens staked successfully into the private pool!`, { id: toastId })
            onClose()
        } catch (error: any) {
            console.error('[PrivateStake] Staking failed:', error)
            toast.error(`Staking failed: ${error.message}`, { id: toastId })
        } finally {
            setIsStaking(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center">
                        <Landmark className="mr-2 text-primary" size={24} /> Private Stake
                    </h2>
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-500 uppercase">8.4% APY</span>
                </div>

                <div className="bg-primary/5 rounded-md p-3 mb-6 flex items-start space-x-3 border border-primary/10">
                    <TrendingUp className="text-primary shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] text-secondary-foreground leading-relaxed">
                        Lock your confidential GridTokens into the energy grid liquidity pool.
                        Your position size remains hidden on-chain while you accumulate rewards.
                    </p>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-[10px] font-bold text-secondary-foreground uppercase block">Amount to Stake</label>
                            <span className="text-[10px] text-primary font-bold">Confidential: {availableBalance} GRX</span>
                        </div>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount to lock"
                            className="w-full rounded-md border bg-muted p-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                        />
                        <div className="mt-2 flex items-center text-[9px] text-secondary-foreground">
                            <Info size={10} className="mr-1" /> Principal remains hidden via Ristretto commitments.
                        </div>
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
                        onClick={handleStake}
                        disabled={isStaking || !amount}
                        className="flex-1 rounded-md bg-primary py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isStaking ? 'STAKING...' : 'STAKE CONFIDENTIALLY'}
                    </button>
                </div>
            </div>
        </div>
    )
}
