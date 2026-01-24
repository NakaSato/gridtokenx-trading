'use client'

import { useState } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { toast } from 'react-hot-toast'
import { Layers, Plus, Trash2, Zap } from 'lucide-react'

interface BatchShieldModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function BatchShieldModal({ isOpen, onClose }: BatchShieldModalProps) {
    const [amounts, setAmounts] = useState<string[]>([''])
    const [origin, setOrigin] = useState<'Solar' | 'Wind'>('Solar')
    const [isShielding, setIsShielding] = useState(false)
    const { batchShield } = usePrivacy()

    if (!isOpen) return null

    const addMeterField = () => {
        if (amounts.length < 5) {
            setAmounts([...amounts, ''])
        } else {
            toast.error('Batch limit (5) reached for this demo.')
        }
    }

    const removeMeterField = (index: number) => {
        setAmounts(amounts.filter((_, i) => i !== index))
    }

    const updateAmount = (index: number, val: string) => {
        const newAmounts = [...amounts]
        newAmounts[index] = val
        setAmounts(newAmounts)
    }

    const handleBatchShield = async () => {
        const numAmounts = amounts.map(a => parseFloat(a)).filter(n => !isNaN(n) && n > 0)

        if (numAmounts.length === 0) {
            toast.error('Enter at least one valid amount')
            return
        }

        setIsShielding(true)
        const toastId = toast.loading(`Generating ZK proofs for ${numAmounts.length} meters...`)

        try {
            await batchShield(numAmounts)
            toast.success(`Success! ${numAmounts.length} meters shielded in one tx.`, { id: toastId })
            onClose()
        } catch (error: any) {
            console.error('[BatchShield] Proof failed:', error)
            toast.error(`Batch failed: ${error.message}`, { id: toastId })
        } finally {
            setIsShielding(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center">
                        <Layers className="mr-2 text-primary" size={24} /> Batch Shield
                    </h2>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">Scalability v1</span>
                </div>

                <p className="mb-6 text-xs text-secondary-foreground">
                    Shield multiple energy readings in a single transaction.
                    This reduces transaction fees and optimizes ZK proof aggregation.
                </p>

                <div className="mb-6">
                    <label className="text-[10px] font-bold text-secondary-foreground uppercase mb-2 block">Common Energy Source</label>
                    <div className="flex space-x-2">
                        {['Solar', 'Wind'].map((src) => (
                            <button
                                key={src}
                                onClick={() => setOrigin(src as any)}
                                className={`flex-1 py-2 rounded-md border text-[10px] font-bold transition-all ${origin === src ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                                    }`}
                            >
                                {src === 'Solar' ? 'SOLAR' : 'WIND'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {amounts.map((amt, idx) => (
                        <div key={idx} className="flex space-x-2 animate-in slide-in-from-right-2 duration-200">
                            <div className="flex-1 relative">
                                <Zap className="absolute left-3 top-3 text-primary/40" size={14} />
                                <input
                                    type="number"
                                    value={amt}
                                    onChange={(e) => updateAmount(idx, e.target.value)}
                                    placeholder={`Meter ${idx + 1} amount (GRX)`}
                                    className="w-full rounded-md border bg-muted py-2.5 pl-9 pr-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            {amounts.length > 1 && (
                                <button
                                    onClick={() => removeMeterField(idx)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}

                    {amounts.length < 5 && (
                        <button
                            onClick={addMeterField}
                            className="w-full flex items-center justify-center py-2 border-2 border-dashed border-primary/20 rounded-md text-[10px] font-bold text-primary hover:bg-primary/5 transition-colors mt-2"
                        >
                            <Plus size={14} className="mr-1" /> ADD METER READING
                        </button>
                    )}
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-md border py-2 text-sm font-medium hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleBatchShield}
                        disabled={isShielding}
                        className="flex-1 rounded-md bg-primary py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isShielding ? 'PROVING BATCH...' : 'SHIELD ALL (ZK)'}
                    </button>
                </div>
            </div>
        </div>
    )
}
