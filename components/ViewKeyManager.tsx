'use client'

import { usePrivacy } from '@/contexts/PrivacyProvider'
import { Eye, Key, Copy, LogIn, ShieldCheck, Info } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function ViewKeyManager() {
    const { isUnlocked, isReadOnly, exportViewKey, loginWithViewKey } = usePrivacy()
    const [viewKeyInput, setViewKeyInput] = useState('')
    const [showKey, setShowKey] = useState(false)

    const handleCopy = () => {
        try {
            const key = exportViewKey()
            navigator.clipboard.writeText(key)
            toast.success('View Key copied to clipboard')
        } catch (e) {
            toast.error('Unlock privacy to export key')
        }
    }

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Key className="mr-2 text-primary" size={20} /> Audit Access
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Cold Storage & View-Only Keys</p>
                </div>
                {isReadOnly && (
                    <div className="flex items-center px-3 py-1 bg-orange-500/10 rounded border border-orange-500/20 text-[9px] font-black text-orange-500 animate-pulse">
                        <Eye size={10} className="mr-2" /> READ-ONLY MODE
                    </div>
                )}
            </div>

            <div className="space-y-6 flex-1">
                {/* Export Section */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest">Export View Key</label>
                    <p className="text-[10px] text-secondary-foreground leading-relaxed">
                        Export your encryption key to audit your confidential history on other devices without revealing your spending authority (Spending Key).
                    </p>
                    <div className="flex space-x-2">
                        <div className="flex-1 bg-muted rounded border border-border px-3 py-2 text-[10px] font-mono flex items-center justify-between truncate">
                            <span>{isUnlocked ? (showKey ? exportViewKey() : '••••••••••••••••••••••••••••••••') : 'LOCKED'}</span>
                            {isUnlocked && (
                                <button onClick={() => setShowKey(!showKey)} className="text-primary hover:text-primary-foreground ml-2">
                                    {showKey ? 'HIDE' : 'SHOW'}
                                </button>
                            )}
                        </div>
                        <button
                            disabled={!isUnlocked || isReadOnly}
                            onClick={handleCopy}
                            className="bg-primary/10 text-primary border border-primary/20 p-2 rounded hover:bg-primary/20 disabled:opacity-30 transition-all"
                        >
                            <Copy size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-2 py-2">
                    <div className="h-px flex-1 bg-border"></div>
                    <span className="text-[8px] font-black text-secondary-foreground uppercase">OR</span>
                    <div className="h-px flex-1 bg-border"></div>
                </div>

                {/* Import Section */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest">Login with View Key</label>
                    <div className="flex space-x-2">
                        <input
                            type="password"
                            placeholder="Enter View Key (Hex)"
                            className="flex-1 bg-muted rounded border border-border px-3 py-2 text-[10px] font-mono outline-none focus:border-primary transition-all"
                            value={viewKeyInput}
                            onChange={(e) => setViewKeyInput(e.target.value)}
                        />
                        <button
                            disabled={!viewKeyInput}
                            onClick={() => loginWithViewKey(viewKeyInput)}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded text-[10px] font-black uppercase tracking-tighter flex items-center hover:opacity-90 disabled:opacity-30"
                        >
                            <LogIn size={14} className="mr-2" /> ACCESS
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-start space-x-3 opacity-60">
                <Info className="text-secondary-foreground mt-0.5" size={14} />
                <p className="text-[9px] text-secondary-foreground leading-relaxed italic">
                    View Keys grant <b>Read-Only</b> access. They allow decryption of your on-chain history but lack the mathematical components required to sign transfers or unshielding proofs. Perfect for high-security auditing.
                </p>
            </div>
        </div>
    )
}
