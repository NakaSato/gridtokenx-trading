'use client'

import { useState } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { toast } from 'react-hot-toast'
import { useWalletBalance } from '@/hooks/useWalletBalance'

interface UnshieldModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function UnshieldModal({ isOpen, onClose }: UnshieldModalProps) {
    const [amount, setAmount] = useState('')
    const [isUnshielding, setIsUnshielding] = useState(false)
    const { privateBalance, unshield } = usePrivacy()
    const { refetch: refetchPublicBalance } = useWalletBalance()

    // Check if we have an unlocked balance
    const availableBalance = privateBalance?.amount ?? 0

    if (!isOpen) return null

    const handleUnshield = async () => {
        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Invalid amount')
            return
        }

        if (numAmount > availableBalance) {
            toast.error('Insufficient private balance')
            return
        }

        setIsUnshielding(true)
        const toastId = toast.loading('Generating ZK Unshield Proof and Withdrawing...')

        try {
            const sig = await unshield(numAmount)
            toast.success(`Tokens unshielded successfully!`, { id: toastId })
            await refetchPublicBalance()
            onClose()
        } catch (error: any) {
            console.error('[UnshieldModal] Unshielding failed:', error)
            toast.error(`Withdraw failed: ${error.message}`, { id: toastId })
        } finally {
            setIsUnshielding(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">Withdraw Tokens</h2>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase Tracking-widest">Unshield</span>
                </div>

                <p className="mb-6 text-xs text-secondary-foreground">
                    Convert your <b>Confidential GridTokens</b> back to public assets.
                    This will move the specified amount to your main wallet balance.
                </p>

                <div className="mb-6 space-y-2">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-secondary-foreground font-medium uppercase text-[10px]">Private Balance</span>
                        <span className="font-bold text-primary">{availableBalance.toLocaleString()} GRX</span>
                    </div>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amount to withdraw"
                        className="w-full rounded-md border bg-muted p-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-md border py-2 text-sm font-medium hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUnshield}
                        disabled={isUnshielding || !amount}
                        className="flex-1 rounded-md bg-primary py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isUnshielding ? 'WITHDRAWING...' : 'WITHDRAW PUBLIC'}
                    </button>
                </div>
            </div>
        </div>
    )
}
