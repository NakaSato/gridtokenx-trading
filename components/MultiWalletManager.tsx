'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import type { UserWallet } from '@/types/features'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Link2, Trash2, Star, Plus, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'

export default function MultiWalletManager() {
    const { token } = useAuth()
    const { publicKey, connected, wallet } = useWallet()
    const [wallets, setWallets] = useState<UserWallet[]>([])
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchWallets = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const apiClient = createApiClient(token)
            const response = await apiClient.listWallets()
            if (response.data) {
                setWallets(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch wallets:', error)
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchWallets()
    }, [fetchWallets])

    const linkCurrentWallet = async () => {
        if (!token || !publicKey || !wallet) {
            toast.error('Please connect a wallet first')
            return
        }

        setActionLoading('link')
        try {
            const apiClient = createApiClient(token)
            const response = await apiClient.linkWallet({
                wallet_address: publicKey.toBase58(),
                label: wallet.adapter.name,
                is_primary: wallets.length === 0 // Make primary if first wallet
            })

            if (response.data) {
                toast.success('Wallet linked successfully')
                fetchWallets()
            } else if (response.error) {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Failed to link wallet')
            console.error(error)
        } finally {
            setActionLoading(null)
        }
    }

    const setPrimary = async (id: string) => {
        if (!token) return
        setActionLoading(`primary-${id}`)
        try {
            const apiClient = createApiClient(token)
            await apiClient.setPrimaryWallet(id)
            setWallets(prev => prev.map(w => ({ ...w, is_primary: w.id === id })))
            toast.success('Primary wallet updated')
        } catch (error) {
            toast.error('Failed to set primary wallet')
        } finally {
            setActionLoading(null)
        }
    }

    const removeWallet = async (id: string) => {
        if (!token) return
        if (confirm('Are you sure you want to remove this wallet?')) {
            setActionLoading(`remove-${id}`)
            try {
                const apiClient = createApiClient(token)
                await apiClient.removeWallet(id)
                setWallets(prev => prev.filter(w => w.id !== id))
                toast.success('Wallet removed')
            } catch (error) {
                toast.error('Failed to remove wallet')
            } finally {
                setActionLoading(null)
            }
        }
    }

    if (loading && wallets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-2 opacity-50">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Loading linked wallets...</span>
            </div>
        )
    }

    const currentWalletAddress = publicKey?.toBase58()
    const isCurrentWalletLinked = wallets.some(w => w.wallet_address === currentWalletAddress)

    return (
        <div className="flex flex-col space-y-6">
            {/* Link Current Wallet Action */}
            {connected && !isCurrentWalletLinked && (
                <div className="p-4 rounded-sm border border-primary/20 bg-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <ShieldCheck size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Link Connected Wallet</span>
                            <span className="text-xs text-muted-foreground font-mono">
                                {currentWalletAddress?.slice(0, 8)}...{currentWalletAddress?.slice(-8)}
                            </span>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={linkCurrentWallet}
                        disabled={!!actionLoading}
                        className="gap-2"
                    >
                        {actionLoading === 'link' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Link Now
                    </Button>
                </div>
            )}

            <div className="flex flex-col space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Linked Wallets ({wallets.length})</h3>

                {wallets.length > 0 ? (
                    <div className="grid gap-3">
                        {wallets.map((w) => (
                            <div key={w.id} className={cn(
                                "flex flex-col p-4 rounded-sm border transition-all",
                                w.is_primary ? "border-primary/40 bg-primary/5" : "bg-background hover:border-border/80"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-full",
                                            w.is_primary ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"
                                        )}>
                                            <Link2 size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold">{w.label || 'Solana Wallet'}</span>
                                                {w.is_primary && (
                                                    <Badge className="text-[8px] h-4 px-1 bg-primary/20 text-primary border-primary/20">PRIMARY</Badge>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                {w.wallet_address}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {!w.is_primary && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => setPrimary(w.id)}
                                                disabled={!!actionLoading}
                                                title="Set as Primary"
                                            >
                                                {actionLoading === `primary-${w.id}` ? <Loader2 size={12} className="animate-spin" /> : <Star size={14} />}
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                            onClick={() => removeWallet(w.id)}
                                            disabled={!!actionLoading}
                                            title="Remove Wallet"
                                        >
                                            {actionLoading === `remove-${w.id}` ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-border/10 flex items-center justify-between text-[10px] text-muted-foreground/60">
                                    <span>Linked on {new Date(w.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-sm bg-muted/5">
                        <p className="text-sm font-medium text-muted-foreground">No wallets linked yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Link your wallets to manage them across devices.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
