'use client'

import { useState } from 'react'
import { useTrading } from '@/contexts/TradingProvider'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { Link2, ArrowRightLeft, Globe, Zap, Layers, ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { PublicKey } from '@solana/web3.js'

const SUPPORTED_CHAINS = [
    { id: 2, name: 'ETHEREUM (L1)', symbol: 'ETH' },
    { id: 5, name: 'POLYGON', symbol: 'MATIC' },
    { id: 23, name: 'ARBITRUM (L2)', symbol: 'ARB' },
    { id: 30, name: 'BASE (L2)', symbol: 'BASE' },
]

export default function BridgePortal() {
    const { initiateBridgeTransfer } = useTrading()
    const { privateBalance, isUnlocked, isReadOnly } = usePrivacy()

    const [destinationChain, setDestinationChain] = useState(2) // Default ETH
    const [amount, setAmount] = useState(100)
    const [isBridging, setIsBridging] = useState(false)
    const [destAddress, setDestAddress] = useState('')
    const [selectedToken, setSelectedToken] = useState({
        name: 'GRID TOKEN',
        mint: new PublicKey('Gridp9VszMTXhJpSpxYrvT6y8iL8gT6m8n5W8X8W8W8') // Placeholder
    })

    const handleBridge = async () => {
        if (!isUnlocked || isReadOnly) {
            toast.error("Please unlock your wallet first")
            return
        }
        if (!destAddress) {
            toast.error("Please enter a destination address")
            return
        }

        setIsBridging(true)
        try {
            // initiateBridgeTransfer expects amount in raw units (multiply by decimals)
            // For now assume 9 decimals (GRID)
            const rawAmount = amount * 1_000_000_000

            await initiateBridgeTransfer(
                selectedToken.mint,
                rawAmount,
                destinationChain,
                destAddress
            )

            toast.success(`Successfully initiated bridge to ${SUPPORTED_CHAINS.find(c => c.id === destinationChain)?.name}!`)
        } catch (e: any) {
            console.error('Bridge Error:', e)
        } finally {
            setIsBridging(false)
        }
    }

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Link2 className="mr-2 text-primary" size={20} /> GridBridge Portal
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Cross-Chain Energy Liquidity</p>
                </div>
                <div className="flex items-center bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    <span className="text-[10px] font-black text-primary">WORMHOLE ENABLED</span>
                </div>
            </div>

            <div className="space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest">Source Network</label>
                        <div className="p-3 bg-muted rounded border border-border flex items-center space-x-2">
                            <Zap size={14} className="text-primary" />
                            <span className="text-xs font-black">SOLANA (POA)</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest">Destination Network</label>
                        <div className="relative">
                            <select
                                value={destinationChain}
                                onChange={(e) => setDestinationChain(Number(e.target.value))}
                                className="w-full p-3 bg-muted rounded border border-border text-xs font-black outline-none focus:border-primary transition-all appearance-none"
                            >
                                {SUPPORTED_CHAINS.map(chain => (
                                    <option key={chain.id} value={chain.id}>{chain.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest block">Destination Address</label>
                    <input
                        type="text"
                        placeholder="0x... (Recipient address on destination chain)"
                        value={destAddress}
                        onChange={(e) => setDestAddress(e.target.value)}
                        className="w-full bg-muted border border-border rounded px-4 py-3 text-xs font-mono outline-none focus:border-primary transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest block">Amount to Bridge</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full bg-muted border border-border rounded px-4 py-3 text-sm font-black outline-none focus:border-primary transition-all"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-primary/60">
                            <Layers size={16} className="mr-2" />
                            <span className="text-[10px] font-black">{selectedToken.name}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleBridge}
                    disabled={!isUnlocked || isReadOnly || isBridging || (privateBalance?.amount || 0) < amount}
                    className="w-full rounded bg-primary py-4 text-xs font-black text-primary-foreground hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-30 flex items-center justify-center space-x-2"
                >
                    {isBridging ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>LOCKING ASSETS ON SOLANA...</span>
                        </>
                    ) : (
                        <>
                            <ArrowRightLeft size={16} />
                            <span>TRANSFER TO {SUPPORTED_CHAINS.find(c => c.id === destinationChain)?.symbol}</span>
                        </>
                    )}
                </button>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-start space-x-3 opacity-60">
                <Globe className="text-secondary-foreground mt-0.5" size={14} />
                <p className="text-[9px] text-secondary-foreground leading-relaxed italic">
                    <b>Cross-Chain Settlement:</b> Your assets will be locked in the GridTokenX Bridge Escrow on Solana. Once the Wormhole Guardians attest the transaction, you can redeem the wrapped tokens on the destination chain.
                </p>
            </div>
        </div>
    )
}
