'use client'

import { useState } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { useTrading } from '@/contexts/TradingProvider'
import { toast } from 'react-hot-toast'
import { ShoppingBag, Copy, Check, DollarSign, ArrowRight } from 'lucide-react'

interface TradeOfferModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function TradeOfferModal({ isOpen, onClose }: TradeOfferModalProps) {
    const [amount, setAmount] = useState('')
    const [price, setPrice] = useState('')
    const [inviteLink, setInviteLink] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [copied, setCopied] = useState(false)

    // Replace usePrivacy with useTrading
    const { createSellOrder } = useTrading()
    const { privateBalance } = usePrivacy() // Keep for balance check if needed, but createSellOrder uses on-chain auth

    const availableBalance = privateBalance?.amount ?? 0 // Note: this might be 0 if not using privacy feature yet

    if (!isOpen) return null

    const handleCreateOffer = async () => {
        const numAmount = parseFloat(amount)
        const numPrice = parseFloat(price)

        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Invalid amount')
            return
        }

        // Removed balance check for now or move it to chain error handling

        if (isNaN(numPrice) || numPrice < 0) {
            toast.error('Invalid price')
            return
        }

        setIsGenerating(true)
        const toastId = toast.loading('Creating On-Chain Sell Order...')

        try {
            // Using Real Contract Call
            const tx = await createSellOrder(numAmount, numPrice)

            const url = `https://explorer.solana.com/tx/${tx}?cluster=custom&customUrl=http://127.0.0.1:8899`
            setInviteLink(url)
            toast.success(`Trade offer created on-chain!`, { id: toastId })
        } catch (error: any) {
            console.error('[TradeOffer] Creation failed:', error)
            toast.error(`Offer failed: ${error.message}`, { id: toastId })
        } finally {
            setIsGenerating(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success('Trade invite copied!')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center">
                        <ShoppingBag className="mr-2 text-primary" size={24} /> Create P2P Offer
                    </h2>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">Confidential Trade</span>
                </div>

                <p className="mb-6 text-xs text-secondary-foreground">
                    Lock tokens into a secure ZK Escrow. Share this link only with the person you want to trade with.
                    Tokens are released once they settle the USDC/GRX price.
                </p>

                {!inviteLink ? (
                    <div className="space-y-4 mb-6">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[10px] font-bold text-secondary-foreground uppercase block">Amount to Sell</label>
                                <span className="text-[10px] text-primary font-bold">Avail: {availableBalance} GRX</span>
                            </div>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Amount in GRX"
                                className="w-full rounded-md border bg-muted p-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-secondary-foreground uppercase mb-1 block">Asking Price (USDC eq.)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 text-primary" size={14} />
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="Set your price"
                                    className="w-full rounded-md border bg-muted py-2.5 pl-8 pr-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 animate-in fade-in zoom-in duration-300">
                        <label className="text-[10px] font-bold text-secondary-foreground uppercase mb-1 block">Private Invite Link</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                readOnly
                                value={inviteLink}
                                className="flex-1 rounded-md border bg-muted p-2.5 text-[10px] font-mono text-primary truncate outline-none"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="bg-primary/10 hover:bg-primary/20 text-primary p-2.5 rounded-md transition-colors"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        <div className="mt-4 rounded-lg bg-primary/5 p-3 border border-primary/10 text-center">
                            <p className="text-[10px] text-secondary-foreground font-medium">PENDING SETTLEMENT</p>
                            <p className="text-xl font-black text-primary mt-1">{amount} GRX @ ${price}</p>
                        </div>
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-md border py-2 text-sm font-medium hover:bg-muted"
                    >
                        {inviteLink ? 'Close' : 'Cancel'}
                    </button>
                    {!inviteLink && (
                        <button
                            onClick={handleCreateOffer}
                            disabled={isGenerating || !amount || !price}
                            className="flex-1 rounded-md bg-primary py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                        >
                            {isGenerating ? 'ESCROWING...' : 'INITIALIZE TRADE'}
                            {!isGenerating && <ArrowRight size={14} className="ml-2" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
