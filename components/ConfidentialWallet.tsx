'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { useAuth } from '@/contexts/AuthProvider'
import {
    Shield,
    ShieldAlert,
    ShieldCheck,
    ArrowUpRight,
    ArrowDownLeft,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    Loader2,
    RefreshCw,
    History,
    Plus,
    Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ShieldModal from './ShieldModal'
import UnshieldModal from './UnshieldModal'
import PrivateTransferModal from './PrivateTransferModal'

export const ConfidentialWallet: React.FC = () => {
    const {
        privateBalance,
        isUnlocked,
        isLoading,
        unlockPrivacy,
        transactionHistory,
        refresh,
        isReadOnly,
        verifySolvency
    } = usePrivacy()
    const { token } = useAuth()
    const [showShield, setShowShield] = useState(false)
    const [showUnshield, setShowUnshield] = useState(false)
    const [showTransfer, setShowTransfer] = useState(false)
    const [showBalance, setShowBalance] = useState(true)
    const [isAuditing, setIsAuditing] = useState(false)

    if (!token) return null;

    return (
        <Card className="border-emerald-500/20 bg-card shadow-lg shadow-emerald-500/5">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-full bg-emerald-500/10 p-2">
                            <Shield className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Confidential Wallet</CardTitle>
                            <CardDescription className="text-xs">Secure ZK-powered private assets</CardDescription>
                        </div>
                    </div>
                    {isUnlocked && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refresh()}
                            disabled={isLoading}
                            className="h-8 w-8 p-0"
                        >
                            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {!isUnlocked ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                        <div className="rounded-full bg-secondary p-4">
                            <Lock className="h-8 w-8 text-secondary-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold">Wallet Locked</h3>
                            <p className="text-xs text-secondary-foreground px-4">
                                Unlock your privacy layer to view and manage confidential assets.
                            </p>
                        </div>
                        <Button
                            onClick={() => unlockPrivacy()}
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlock className="mr-2 h-4 w-4" />}
                            Unlock Privacy
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Balance Section */}
                        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowBalance(!showBalance)}
                                    className="h-6 w-6 p-0 hover:bg-emerald-500/10"
                                >
                                    {showBalance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                </Button>
                            </div>
                            <span className="text-xs font-medium text-emerald-700/70 uppercase tracking-wider">Private Balance</span>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="text-3xl font-mono font-bold text-emerald-900 dark:text-emerald-100">
                                    {showBalance ? (privateBalance?.amount?.toFixed(2) || '0.00') : '••••••'}
                                </span>
                                <span className="text-sm font-medium text-emerald-600">GRX</span>
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600/60">
                                <ShieldCheck className="h-3 w-3" />
                                <span>Verified by Zero-Knowledge Proof</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant="outline"
                                className="flex-col gap-1 h-16 text-[11px] border-emerald-500/20 hover:bg-emerald-500/10"
                                onClick={() => setShowShield(true)}
                                disabled={isReadOnly}
                            >
                                <Plus className="h-4 w-4 text-emerald-600" />
                                Shield
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-col gap-1 h-16 text-[11px] border-emerald-500/20 hover:bg-emerald-500/10"
                                onClick={() => setShowUnshield(true)}
                                disabled={isReadOnly || (privateBalance?.amount || 0) <= 0}
                            >
                                <Minus className="h-4 w-4 text-orange-600" />
                                Unshield
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-col gap-1 h-16 text-[11px] border-emerald-500/20 hover:bg-emerald-500/10"
                                onClick={() => setShowTransfer(true)}
                                disabled={isReadOnly || (privateBalance?.amount || 0) <= 0}
                            >
                                <ArrowUpRight className="h-4 w-4 text-blue-600" />
                                Transfer
                            </Button>
                        </div>

                        {/* Recent History */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs font-semibold">
                                    <History className="h-3 w-3" />
                                    <span>Private History</span>
                                </div>
                                <Button variant="link" className="h-auto p-0 text-[10px] text-emerald-600">
                                    View All
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                {transactionHistory.length === 0 ? (
                                    <div className="py-4 text-center text-[10px] text-secondary-foreground border border-dashed rounded-sm">
                                        No private transactions yet
                                    </div>
                                ) : (
                                    transactionHistory.slice(0, 5).map((tx, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-sm bg-secondary/30 text-[10px]">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "p-1 rounded-full",
                                                    tx.type === 'SHIELD' ? "bg-emerald-500/20 text-emerald-600" :
                                                        tx.type === 'WITHDRAW' ? "bg-orange-500/20 text-orange-600" :
                                                            "bg-blue-500/20 text-blue-600"
                                                )}>
                                                    {tx.type === 'SHIELD' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{tx.type}</span>
                                                    <span className="text-secondary-foreground opacity-70">
                                                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "font-mono font-bold",
                                                tx.type === 'SHIELD' ? "text-emerald-600" : "text-orange-600"
                                            )}>
                                                {tx.type === 'SHIELD' ? '+' : '-'}{tx.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* System Audit */}
                        <div className="pt-4 border-t border-emerald-500/10">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-secondary-foreground uppercase">ZK Solvency Audit</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                        setIsAuditing(true)
                                        await verifySolvency()
                                        setIsAuditing(false)
                                    }}
                                    disabled={isAuditing}
                                    className="h-6 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/5"
                                >
                                    {isAuditing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShieldAlert className="mr-1 h-3 w-3" />}
                                    Run Audit
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Modals */}
            {showShield && <ShieldModal isOpen={showShield} onClose={() => setShowShield(false)} />}
            {showUnshield && <UnshieldModal isOpen={showUnshield} onClose={() => setShowUnshield(false)} />}
            {showTransfer && <PrivateTransferModal isOpen={showTransfer} onClose={() => setShowTransfer(false)} />}
        </Card>
    )
}
