'use client'

import { useState } from 'react'
import { useLending } from '@/contexts/LendingProvider'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { Landmark, Coins, ArrowUpRight, ShieldCheck, Info, Wallet } from 'lucide-react'

export default function ConfidentialLending() {
    const { loans, borrowPrivate, repayLoan } = useLending()
    const { privateBalance, isUnlocked } = usePrivacy()
    const [borrowAmount, setBorrowAmount] = useState(100)
    const [collateralAmount, setCollateralAmount] = useState(500)

    const handleBorrow = () => {
        borrowPrivate(collateralAmount, borrowAmount)
    }

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Landmark className="mr-2 text-primary" size={20} /> Private Energy Loans
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Collateralized ZK Liquidity Pool</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest">Borrow Amount (USDC)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={borrowAmount}
                                onChange={(e) => setBorrowAmount(Number(e.target.value))}
                                className="w-full bg-muted border border-border rounded px-4 py-3 text-sm font-black outline-none focus:border-primary transition-all"
                            />
                            <Coins size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest">Required ZK Collateral (GRX)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={collateralAmount}
                                onChange={(e) => setCollateralAmount(Number(e.target.value))}
                                className="w-full bg-muted border border-border rounded px-4 py-3 text-sm font-black outline-none focus:border-primary transition-all"
                            />
                            <Wallet size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40" />
                        </div>
                        <p className="text-[9px] text-secondary-foreground">LTV: {((borrowAmount / collateralAmount) * 100).toFixed(0)}% (Max 40%)</p>
                    </div>
                    <button
                        onClick={handleBorrow}
                        disabled={!isUnlocked || (privateBalance?.amount || 0) < collateralAmount}
                        className="w-full rounded bg-primary py-4 text-xs font-black text-primary-foreground hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-30 flex items-center justify-center"
                    >
                        <ArrowUpRight size={16} className="mr-2" /> EXECUTE PRIVATE LOAN
                    </button>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest mb-1 block">Active Positions</label>
                    <div className="space-y-2 h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                        {loans.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg opacity-30 text-center p-4">
                                <Landmark size={24} className="mb-2" />
                                <p className="text-[9px] font-bold uppercase">No Active Loans</p>
                            </div>
                        ) : (
                            loans.map((loan) => (
                                <div key={loan.id} className="p-3 rounded border border-border bg-muted/40 relative group overflow-hidden">
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div>
                                            <p className="text-[9px] font-mono text-primary">{loan.id}</p>
                                            <p className="text-sm font-black text-foreground">{loan.borrowedAmount} USDC</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-secondary-foreground uppercase">Collateral</p>
                                            <p className="text-[10px] font-black text-foreground">{loan.collateralAmount} GRX</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${loan.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-secondary-foreground'}`}>
                                            {loan.status}
                                        </span>
                                        {loan.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => repayLoan(loan.id)}
                                                className="text-[9px] font-black text-primary hover:underline"
                                            >
                                                REPAY LOAN
                                            </button>
                                        )}
                                    </div>
                                    <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <ShieldCheck size={40} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-start space-x-3 opacity-60">
                <Info className="text-secondary-foreground mt-0.5" size={14} />
                <p className="text-[9px] text-secondary-foreground leading-relaxed italic">
                    <b>Confidential Lending:</b> Loans are secured via ZK collateral proofs. Your private commitment acts as proof-of-value, allowing you to borrow liquid capital without revealing your total GridToken holdings to the market makers or lenders.
                </p>
            </div>
        </div>
    )
}
