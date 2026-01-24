'use client'

import { useState, useEffect } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { Landmark, CheckCircle2, XCircle, Clock, ExternalLink, Shield } from 'lucide-react'

export default function MyOffers() {
    const { wallet } = (usePrivacy() as any) // Need wallet for storage key
    const [offers, setOffers] = useState<any[]>([])

    const loadOffers = () => {
        // In this prototype, we'll just check localStorage for the current user's offers
        // Note: usePrivacy should ideally expose this, but we'll read direct for now
        if (typeof window !== 'undefined') {
            const keys = Object.keys(localStorage);
            const userOffers = [];
            for (const key of keys) {
                if (key.startsWith('gtx_priv_offers_')) {
                    const stored = JSON.parse(localStorage.getItem(key) || '[]');
                    userOffers.push(...stored);
                }
            }
            setOffers(userOffers.sort((a, b) => b.timestamp - a.timestamp));
        }
    }

    useEffect(() => {
        loadOffers();
        const interval = setInterval(loadOffers, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Landmark className="mr-2 text-primary" size={20} /> My P2P Escrows
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Active Offer Management</p>
                </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {offers.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg opacity-30 text-center p-8">
                        <Shield size={32} className="mb-3" />
                        <p className="text-[10px] font-bold uppercase">No Active Escrows Found</p>
                    </div>
                ) : (
                    offers.map((offer) => (
                        <div key={offer.id} className="p-4 rounded-lg border border-border bg-muted/20 hover:border-primary/20 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{offer.id}</span>
                                    <h3 className="text-sm font-black text-foreground mt-1">{offer.amount.toLocaleString()} GRX</h3>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase flex items-center ${offer.status === 'OPEN' ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-500'
                                        }`}>
                                        {offer.status === 'OPEN' ? <Clock size={10} className="mr-1" /> : <CheckCircle2 size={10} className="mr-1" />}
                                        {offer.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-secondary-foreground uppercase">Rate: ${offer.price}/GRX</span>
                                <span className="text-foreground">${(offer.amount * offer.price).toLocaleString()} USDC</span>
                            </div>

                            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                                <a
                                    href={`https://explorer.solana.com/tx/${offer.sig}?cluster=devnet`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] text-primary hover:underline flex items-center"
                                >
                                    VIEW ON-CHAIN <ExternalLink size={10} className="ml-1" />
                                </a>
                                <span className="text-[8px] text-secondary-foreground italic uppercase">
                                    Escrow Protected
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <p className="mt-6 text-[9px] text-secondary-foreground leading-relaxed italic border-t pt-4 opacity-50">
                Offers are held in a secure, non-custodial ZK vault. Settlement is atomic—funds are only released when the buyer's payment proof is verified.
            </p>
        </div>
    )
}
