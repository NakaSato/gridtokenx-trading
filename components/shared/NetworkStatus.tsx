'use client'

import { Activity } from 'lucide-react'
import { useWebSocket } from '@/lib/ws/useWebSocket'

export function NetworkStatus() {
  // We can monitor the public 'orderbook' channel to gauge global backend health
  const { connected } = useWebSocket('orderbook', undefined, true, true)

  // xl and up: on a tablet this pill loses its slot to the points chip.
  return (
    <div className="group relative hidden cursor-help items-center gap-2 rounded-sm border border-transparent bg-secondary/50 px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:border-border xl:flex">
      <span className="relative flex h-2 w-2">
        {connected ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </>
        ) : (
          <>
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
          </>
        )}
      </span>
      <span>{connected ? 'Mainnet' : 'Connecting...'}</span>
      <div className="absolute right-0 top-full z-50 mt-2 hidden whitespace-nowrap rounded-sm border bg-popover p-2 text-[10px] text-popover-foreground shadow-md group-hover:block">
        <div className="mb-1 flex items-center justify-between gap-4">
          <span>WebSocket</span>
          <span
            className={`font-mono ${connected ? 'text-green-500' : 'text-yellow-500'}`}
          >
            {connected ? 'Standard' : 'Handshake'}
          </span>
        </div>
      </div>
    </div>
  )
}
