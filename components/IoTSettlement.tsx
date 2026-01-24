'use client'

import { useState, useEffect, useRef } from 'react'
import { IoTOracle, MeterReading } from '@/lib/iot-oracle'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { Zap, Play, Square, Activity, Database, Cpu, ArrowRight } from 'lucide-react'

export default function IoTSettlement() {
    const { batchShield, isUnlocked, isReadOnly } = usePrivacy()
    const [isRunning, setIsRunning] = useState(false)
    const [readings, setReadings] = useState<MeterReading[]>([])
    const [status, setStatus] = useState({ accumulated: 0, threshold: 500, percentage: 0, pendingCount: 0 })

    // Threshold is 500 kWh for a Batch Shield
    const oracleRef = useRef<IoTOracle | null>(null)

    useEffect(() => {
        if (!oracleRef.current) {
            oracleRef.current = new IoTOracle(500, async (batch) => {
                console.log("Threshold met, auto-shielding:", batch);
                if (isUnlocked && !isReadOnly) {
                    await batchShield(batch)
                }
            })
        }
    }, [isUnlocked, isReadOnly, batchShield])

    useEffect(() => {
        let interval: any;
        if (isRunning) {
            interval = setInterval(() => {
                if (oracleRef.current) {
                    const reading = oracleRef.current.simulateReading()
                    setReadings(prev => [reading, ...prev].slice(0, 5))
                    setStatus(oracleRef.current.getStatus())
                }
            }, 2000)
        }
        return () => clearInterval(interval)
    }, [isRunning])

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Zap className="mr-2 text-primary" size={20} /> IoT Settlement Stream
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Real-Time Industrial Meter Oracle</p>
                </div>
                <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`flex items-center space-x-2 rounded px-4 py-2 text-xs font-bold transition-all border ${isRunning ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                        }`}
                >
                    {isRunning ? <Square size={14} /> : <Play size={14} />}
                    <span>{isRunning ? 'STOP STREAM' : 'START SIMULATOR'}</span>
                </button>
            </div>

            <div className="space-y-6 flex-1">
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest">Auto-Shield Progress</label>
                        <span className="text-xs font-black text-foreground">{status.accumulated} / {status.threshold} kWh</span>
                    </div>
                    <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex relative">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${status.percentage}%` }}
                        />
                        <div className="absolute inset-x-0 h-full flex items-center justify-center pointer-events-none">
                            <span className="text-[8px] font-black mix-blend-difference text-white uppercase tracking-widest">
                                {status.pendingCount} Readings Buffered
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest mb-1 block">Live Meter Readings</label>
                    <div className="space-y-1.5">
                        {readings.length === 0 && (
                            <div className="py-8 text-center border-2 border-dashed border-border rounded-lg opacity-30">
                                <Activity size={24} className="mx-auto mb-2" />
                                <p className="text-[9px] font-bold">STREAM INACTIVE</p>
                            </div>
                        )}
                        {readings.map((r, i) => (
                            <div key={r.id} className="flex items-center justify-between p-2 rounded bg-muted/50 border border-border animate-in slide-in-from-right-2" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex items-center space-x-2">
                                    <span className="text-[9px] font-mono text-primary">{r.id}</span>
                                    <span className={`text-[8px] px-1 rounded font-black uppercase ${r.origin === 'Solar' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {r.origin}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-black">+{r.value} kWh</span>
                                    <ArrowRight size={10} className="text-secondary-foreground" />
                                    <Database size={12} className="text-primary/60" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-start space-x-3 opacity-60">
                <Cpu className="text-secondary-foreground mt-0.5" size={14} />
                <p className="text-[9px] text-secondary-foreground leading-relaxed italic">
                    <b>Oracle Mode:</b> This module simulates a physical smart meter. Once it hits the 500 kWh threshold, it automatically bundles all readings into a single **Confidential Batch Transaction**, optimizing for throughput and gas.
                </p>
            </div>
        </div>
    )
}
