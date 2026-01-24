'use client'

import { useState } from 'react'
import { useMarketplace } from '@/contexts/MarketplaceProvider'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { Ship, Filter, PieChart, ArrowDownRight, Layers, Lock, ShieldAlert } from 'lucide-react'

export default function BulkTradeManager() {
    const { offers, splitBulkOrder } = useMarketplace()
    const { isUnlocked, isReadOnly } = usePrivacy()
    const [selectedOffer, setSelectedOffer] = useState<any>(null)
    const [partialAmount, setPartialAmount] = useState(500)

    const bulkOffers = offers.filter(o => o.amount >= 3000 && o.status === 'OPEN')

    const handlePartialFill = () => {
        if (!selectedOffer) return
        splitBulkOrder(selectedOffer.id, partialAmount)
    }

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Ship className="mr-2 text-primary" size={20} /> Institutional Bulk Trades
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Industrial Magnitude Matching</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest block">Large Volume Orders</label>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {bulkOffers.length === 0 ? (
                            <div className="py-12 text-center border-2 border-dashed border-border rounded-lg opacity-30">
                                <Filter size={24} className="mx-auto mb-2" />
                                <p className="text-[9px] font-bold">NO SCALE ORDERS LIVE</p>
                            </div>
                        ) : (
                            bulkOffers.map((o) => (
                                <div
                                    key={o.id}
                                    onClick={() => setSelectedOffer(o)}
                                    className={`p-3 rounded border cursor-pointer transition-all ${selectedOffer?.id === o.id ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-border hover:border-primary/20'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-mono text-primary">{o.id}</p>
                                            <p className="text-sm font-black text-foreground">{o.amount.toLocaleString()} GRX</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-foreground">${o.price}</p>
                                            <p className="text-[8px] text-secondary-foreground uppercase font-bold">{o.origin}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-4 pt-1">
                    <div className="p-4 rounded border border-primary/20 bg-primary/5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-primary uppercase">Partial Fulfillment</span>
                            <PieChart size={14} className="text-primary" />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">Amount to Fill</p>
                                <input
                                    type="number"
                                    value={partialAmount}
                                    onChange={(e) => setPartialAmount(Number(e.target.value))}
                                    className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-black outline-none focus:border-primary"
                                />
                            </div>

                            <button
                                disabled={!isUnlocked || isReadOnly || !selectedOffer || partialAmount > selectedOffer?.amount}
                                onClick={handlePartialFill}
                                className="w-full rounded bg-primary py-3 text-[10px] font-black text-primary-foreground hover:opacity-90 disabled:opacity-30 tracking-widest flex items-center justify-center cursor-pointer"
                            >
                                <ArrowDownRight size={14} className="mr-2" /> EXECUTE SPLIT-FILL
                            </button>
                        </div>
                    </div>

                    <div className="p-3 bg-secondary/5 border border-secondary/10 rounded flex items-start space-x-3">
                        <ShieldAlert size={14} className="text-secondary-foreground mt-0.5" />
                        <p className="text-[8px] text-secondary-foreground uppercase font-bold leading-tight">
                            ZK-Proof of Magnitude is required for large volume settlements. This ensures the grid maintains liquidity without revealing seller farm capacity.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-start space-x-3 opacity-60">
                <Layers className="text-secondary-foreground mt-0.5" size={14} />
                <p className="text-[9px] text-secondary-foreground leading-relaxed italic">
                    <b>Industrial Bulk Terminal:</b> Large-scale energy trades ({" >= "} 3,000 GRX) support partial fulfillment. This allows the primary energy producer to satisfy multiple counterparties within a single on-chain escrow commitment.
                </p>
            </div>
        </div>
    )
}
