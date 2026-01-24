'use client'

import { useState } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { toast } from 'react-hot-toast'
import { Link2, Copy, Check } from 'lucide-react'

interface StealthLinkGeneratorProps {
    isOpen: boolean
    onClose: () => void
}

export default function StealthLinkGenerator({ isOpen, onClose }: StealthLinkGeneratorProps) {
    const [amount, setAmount] = useState('')
    const [generatedLink, setGeneratedLink] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [copied, setCopied] = useState(false)
    const { privateBalance, createStealthLink } = usePrivacy()

    const availableBalance = privateBalance?.amount ?? 0

    if (!isOpen) return null

    const handleGenerate = async () => {
        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Invalid amount')
            return
        }

        if (numAmount > availableBalance) {
            toast.error('Insufficient private balance')
            return
        }

        setIsGenerating(true)
        const toastId = toast.loading('Creating Encrypted Stealth Link...')

        try {
            const payload = await createStealthLink(numAmount)
            // Use current URL + payload
            const url = `${window.location.origin}/claim?s=${payload}`
            setGeneratedLink(url)
            toast.success(`Stealth link generated!`, { id: toastId })
        } catch (error: any) {
            console.error('[StealthLink] Generation failed:', error)
            toast.error(`Generation failed: ${error.message}`, { id: toastId })
        } finally {
            setIsGenerating(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success('Link copied to clipboard')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center">
                        <Link2 className="mr-2 text-primary" size={24} /> Stealth Link
                    </h2>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">Off-chain Payment</span>
                </div>

                <p className="mb-6 text-xs text-secondary-foreground">
                    Create an encrypted claimable link. You can share this link via Telegram, Email, or QR.
                    Tokens are only moved when the recipient claims the link privately.
                </p>

                {!generatedLink ? (
                    <div className="space-y-4 mb-6">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[10px] font-bold text-secondary-foreground uppercase block">Amount to Link</label>
                                <span className="text-[10px] text-primary font-bold">Max: {availableBalance} GRX</span>
                            </div>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Amount to escrow"
                                className="w-full rounded-md border bg-muted p-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 animate-in fade-in zoom-in duration-300">
                        <label className="text-[10px] font-bold text-secondary-foreground uppercase mb-1 block">Shareable URL</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                readOnly
                                value={generatedLink}
                                className="flex-1 rounded-md border bg-muted p-2.5 text-[10px] font-mono text-primary truncate outline-none"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="bg-primary/10 hover:bg-primary/20 text-primary p-2.5 rounded-md transition-colors"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        <p className="mt-3 text-[9px] text-yellow-500 italic">
                            ⚠️ This link contains cryptographic secrets. Only share with intended recipient.
                        </p>
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-md border py-2 text-sm font-medium hover:bg-muted"
                    >
                        {generatedLink ? 'Done' : 'Cancel'}
                    </button>
                    {!generatedLink && (
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !amount}
                            className="flex-1 rounded-md bg-primary py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {isGenerating ? 'ENCRYPTING...' : 'CREATE LINK'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
