'use client'

import { useState } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { toast } from 'react-hot-toast'
import { PublicKey } from '@solana/web3.js'

interface PrivateTransferModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function PrivateTransferModal({ isOpen, onClose }: PrivateTransferModalProps) {
    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')
    const [isTransferring, setIsTransferring] = useState(false)
    const { privateBalance, transfer } = usePrivacy()

    // Check if we have an unlocked balance
    const availableBalance = privateBalance?.amount ?? 0

    if (!isOpen) return null

    const handleTransfer = async () => {
        // Validation
        let recipientPubkey: PublicKey
        try {
            recipientPubkey = new PublicKey(recipient)
        } catch {
            toast.error('Invalid recipient address')
            return
        }

        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Invalid amount')
            return
        }

        if (numAmount > availableBalance) {
            toast.error('Insufficient private balance')
            return
        }

        setIsTransferring(true)
        const toastId = toast.loading('Generating ZK Transfer Proof...')

        try {
            const sig = await transfer(recipientPubkey, numAmount)
            toast.success(`Private transfer successful!`, { id: toastId })
            onClose()
        } catch (error: any) {
            console.error('[PrivateTransferModal] Transfer failed:', error)
            toast.error(`Transfer failed: ${error.message}`, { id: toastId })
        } finally {
            setIsTransferring(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">Private Transfer</h2>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">ZK Confidential</span>
                </div>

                <p className="mb-6 text-xs text-secondary-foreground">
                    Send GridTokens privately. The recipient receives funds into their confidential balance,
                    and the amount remains hidden on-chain.
                </p>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-[10px] font-bold text-secondary-foreground uppercase mb-1 block">Recipient Address</label>
                        <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="Solana Public Key"
                            className="w-full rounded-md border bg-muted p-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-[10px] font-bold text-secondary-foreground uppercase block">Amount</label>
                            <span className="text-[10px] text-primary">Available: {availableBalance} GRX</span>
                        </div>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount to send privately"
                            className="w-full rounded-md border bg-muted p-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                        />
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
                        onClick={handleTransfer}
                        disabled={isTransferring || !amount || !recipient}
                        className="flex-1 rounded-md bg-primary py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isTransferring ? 'PROVING...' : 'SEND PRIVATE'}
                    </button>
                </div>
            </div>
        </div>
    )
}
