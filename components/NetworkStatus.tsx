'use client'

import { Activity } from 'lucide-react'

export function NetworkStatus() {
    return (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-sm bg-secondary/50 text-xs font-medium text-secondary-foreground border border-transparent hover:border-green-500/50 transition-colors cursor-help group relative">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Mainnet</span>
            <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-popover text-popover-foreground text-[10px] p-2 rounded-sm border shadow-md whitespace-nowrap z-50">
                <div className="flex items-center justify-between gap-4 mb-1">
                    <span>TPS</span>
                    <span className="font-mono text-green-500">2,450</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span>Ping</span>
                    <span className="font-mono text-green-500">24ms</span>
                </div>
            </div>
        </div>
    )
}
