'use client'

import { useState } from 'react'
import * as zk from '@/lib/zk-utils'
import { Activity, Gauge, Cpu, Timer, RefreshCw } from 'lucide-react'

export default function PerformanceProfiler() {
    const [isBenchmarking, setIsBenchmarking] = useState(false)
    const [benchmarkData, setBenchmarkData] = useState<{
        timeMs: number | null,
        cpuEstimate: string,
        score: number | null
    }>({
        timeMs: null,
        cpuEstimate: 'Unknown',
        score: null
    })

    const runBenchmark = async () => {
        setIsBenchmarking(true)
        try {
            const { timeMs } = await zk.benchmarkProofGeneration()

            // Score calculation (arbitrary: <20ms = 100, >200ms = 0)
            const score = Math.max(0, Math.min(100, Math.round(100 - (timeMs - 10) / 2)))

            setBenchmarkData({
                timeMs,
                cpuEstimate: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : 'Unknown',
                score
            })
        } catch (e) {
            console.error("Benchmark failed", e)
        } finally {
            setIsBenchmarking(false)
        }
    }

    return (
        <div className="w-full rounded-sm border p-6 bg-background shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center">
                        <Activity className="mr-2 text-primary" size={20} /> ZK Latency Profiler
                    </h2>
                    <p className="text-[10px] text-secondary-foreground uppercase font-bold mt-1">Local Cryptographic Benchmarking</p>
                </div>
                <button
                    onClick={runBenchmark}
                    disabled={isBenchmarking}
                    className="flex items-center space-x-2 rounded bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
                >
                    <RefreshCw size={14} className={isBenchmarking ? 'animate-spin' : ''} />
                    <span>{isBenchmarking ? 'PROFILING...' : 'RUN BENCHMARK'}</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted border border-border">
                    <div className="flex items-center text-[9px] font-bold text-secondary-foreground uppercase mb-1">
                        <Timer size={10} className="mr-1" /> Avg Proof Time
                    </div>
                    <p className="text-xl font-black text-foreground">
                        {benchmarkData.timeMs ? `${benchmarkData.timeMs.toFixed(2)} ms` : '--'}
                    </p>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border">
                    <div className="flex items-center text-[9px] font-bold text-secondary-foreground uppercase mb-1">
                        <Cpu size={10} className="mr-1" /> Hardware Info
                    </div>
                    <p className="text-xl font-black text-foreground">{benchmarkData.cpuEstimate}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-secondary-foreground">System Readiness Score</span>
                    <span className={benchmarkData.score && benchmarkData.score > 80 ? 'text-green-500' : 'text-primary'}>
                        {benchmarkData.score ? `${benchmarkData.score}/100` : '--'}
                    </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${benchmarkData.score || 0}%` }}
                    />
                </div>
            </div>

            <p className="text-[9px] text-secondary-foreground italic mt-6 border-t pt-4">
                GridTokenX WASM uses AVX2/NEON optimizations where available. Proof generation happens entirely on your local CPU for maximum privacy.
            </p>
        </div>
    )
}
