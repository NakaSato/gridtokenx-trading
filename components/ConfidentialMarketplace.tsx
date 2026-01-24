'use client'

import { useMarketplace } from '@/contexts/MarketplaceProvider'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { ShoppingBag, Zap, Sun, Wind, Timer, ArrowRight, Tag, Info } from 'lucide-react'
import { useState } from 'react'

export default function ConfidentialMarketplace() {
    const { offers, buyPrivate } = useMarketplace()
    const { isUnlocked, isReadOnly } = usePrivacy()
    const [filter, setFilter] = useState<'ALL' | 'SOLAR' | 'WIND'>('ALL')

    const filteredOffers = offers.filter(o =>
        filter === 'ALL' || o.origin.toUpperCase() === filter
    )

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <ShoppingBag className="mr-2 text-primary" size={20} /> Private P2P Market
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Confidential Energy Exchange</p>
                </div>

                <div className="flex bg-muted rounded p-1 space-x-1">
                    {['ALL', 'SOLAR', 'WIND'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 text-[8px] font-black uppercase rounded transition-all ${filter === f ? 'bg-primary text-primary-foreground' : 'text-secondary-foreground hover:bg-background'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {filteredOffers.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-border rounded-lg opacity-30">
                        <Tag size={24} className="mx-auto mb-2" />
                        <p className="text-[9px] font-bold">NO MATCHING OFFERS</p>
                    </div>
                ) : (
                    filteredOffers.map((offer) => (
                        <div key={offer.id} className={`p-4 rounded-lg border transition-all ${offer.status === 'OPEN' ? 'bg-muted/30 border-border border-l-4 border-l-primary' : 'bg-secondary/10 border-border opacity-50 grayscale'
                            }`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-md ${offer.origin === 'Solar' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {offer.origin === 'Solar' ? <Sun size={18} /> : <Wind size={18} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[9px] font-mono text-primary bg-primary/10 px-1 rounded">{offer.id}</span>
                                            <span className="text-[8px] font-bold text-secondary-foreground uppercase">{offer.seller}</span>
                                        </div>
                                        <h3 className="text-sm font-black text-foreground">{offer.amount.toLocaleString()} GRX</h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-foreground">${(offer.price * offer.amount).toLocaleString()} USDC</p>
                                    <p className="text-[9px] font-bold text-secondary-foreground uppercase">${offer.price} / GRX</p>
                                    <p className={`text-[8px] font-black uppercase mt-1 ${offer.price > 0.4 ? 'text-green-500' : 'text-primary'}`}>
                                        {offer.price > 0.4 ? 'Green Premium' : 'Market Rate'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <div className="flex items-center space-x-3 text-[9px] font-bold text-secondary-foreground uppercase">
                                    <span className="flex items-center"><Timer size={10} className="mr-1" /> Just Now</span>
                                    <span className="flex items-center"><Zap size={10} className="mr-1" /> Instant Settlement</span>
                                </div>

                                <button
                                    onClick={() => buyPrivate(offer.id)}
                                    disabled={!isUnlocked || isReadOnly || offer.status !== 'OPEN'}
                                    className="rounded bg-primary/10 px-3 py-1.5 text-[9px] font-black text-primary hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30 flex items-center"
                                >
                                    {offer.status === 'OPEN' ? <>BUY NOW <ArrowRight size={10} className="ml-1.5" /></> : 'SOLD'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-start space-x-3 opacity-60">
                <Info className="text-secondary-foreground mt-0.5" size={14} />
                <p className="text-[9px] text-secondary-foreground leading-relaxed italic">
                    <b>Confidential Order Book:</b> Marketplace listings are pseudonymized. Buyers can verify the volume and energy origin via ZK proofs, ensuring a liquid market while maintaining the absolute privacy of both producers and consumers.
                </p>
            </div>
        </div>
    )
}
