'use client'

import { Transaction } from '@/types/wallet'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Download, FileDown, Loader2 } from 'lucide-react'
import { useState, memo } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/provider'
import { createApiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

/** Grid template shared by the desktop header and rows so they can't drift. */
const GRID_COLS =
  'grid-cols-[1.5fr_0.7fr_0.9fr_1fr_1.3fr_1fr]'

function SideChip({ side }: { side: string }) {
  const isBuy = side === 'Buy'
  return (
    <span
      className={cn(
        'rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight',
        isBuy
          ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
          : 'border border-destructive/20 bg-destructive/10 text-destructive'
      )}
    >
      {side}
    </span>
  )
}

export default memo(function OrderHistory({
  doneOptioninfos,
}: {
  doneOptioninfos: Transaction[]
}) {
  const { token } = useAuth()
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null)

  const handleExport = async (format: 'csv' | 'json') => {
    if (!token) return
    setExporting(format)
    try {
      const apiClient = createApiClient(token)
      const response = await apiClient.exportTradingHistory(format)

      if (response.error) {
        toast.error(`Export failed: ${response.error}`)
      } else if (response.data == null) {
        toast.error('Export failed: empty response')
      } else if (typeof response.data === 'string' && response.data.trim() === '') {
        // 200 with an empty CSV body — nothing to download, but don't go silent
        toast('No trade history to export')
      } else {
        // csv arrives as raw text, json as a parsed array — serialize either into a Blob
        const blob = new Blob(
          [typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)],
          { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' }
        )
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `trade-history-${new Date().toISOString().split('T')[0]}.${format}`)
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
        toast.success(`History exported as ${format.toUpperCase()}`)
      }
    } catch (error) {
      toast.error('Failed to export history')
      console.error(error)
    } finally {
      setExporting(null)
    }
  }

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id)
      toast.success('Transaction ID copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header: count + export actions */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-muted/10 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground">
            Trade History
          </span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
            {doneOptioninfos.length}
          </Badge>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
          >
            {exporting === 'csv' ? (
              <Loader2 size={11} className="animate-spin text-primary" />
            ) : (
              <Download size={11} className="text-muted-foreground" />
            )}
            CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={() => handleExport('json')}
            disabled={!!exporting}
          >
            {exporting === 'json' ? (
              <Loader2 size={11} className="animate-spin text-primary" />
            ) : (
              <FileDown size={11} className="text-muted-foreground" />
            )}
            JSON
          </Button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden min-h-0 flex-1 flex-col overflow-y-auto md:flex">
        <div
          className={cn(
            'sticky top-0 z-10 grid border-b border-border bg-card px-3 py-1.5',
            GRID_COLS
          )}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Asset & ID</span>
          <span className="text-center text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Side</span>
          <span className="text-right text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Volume</span>
          <span className="text-right text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Price</span>
          <span className="text-center text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Delivered / Fees</span>
          <span className="text-right text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Time</span>
        </div>

        <div className="divide-y divide-border/50">
          {doneOptioninfos.map((tx) => (
            <div
              key={tx.transactionID}
              className={cn(
                'group grid items-center px-3 py-1.5 text-xs transition-colors hover:bg-muted/10',
                GRID_COLS
              )}
            >
              {/* Asset & ID */}
              <div className="flex min-w-0 items-center gap-2">
                <Image
                  src={tx.token.logo}
                  alt={tx.token.name}
                  width={20}
                  height={20}
                  className="flex-shrink-0 rounded-full ring-1 ring-border"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {tx.token.name}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                    <span className="truncate">{tx.transactionID.slice(0, 12)}…</span>
                    <button
                      aria-label="Copy transaction ID"
                      className="opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      onClick={() => handleCopyId(tx.transactionID)}
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                  </span>
                </div>
              </div>

              {/* Side */}
              <div className="flex justify-center">
                <SideChip side={tx.transactionType} />
              </div>

              {/* Volume */}
              <div className="text-right font-mono font-semibold text-foreground">
                {tx.quantity?.toFixed(2) ?? '0.00'}
                <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">kWh</span>
              </div>

              {/* Price (was missing entirely from the old table) */}
              <div className="flex flex-col items-end">
                <span className="font-mono font-semibold text-foreground">
                  ฿{tx.strikePrice.toFixed(2)}
                  <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">/kWh</span>
                </span>
                {tx.totalValue != null && (
                  <span className="font-mono text-[9px] text-muted-foreground">
                    ฿{tx.totalValue.toFixed(2)} total
                  </span>
                )}
              </div>

              {/* Delivered / Fees — fixed sub-columns so rows can't misalign */}
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-xs font-semibold tabular-nums text-emerald-500">
                  {(tx.effectiveEnergy ?? tx.quantity)?.toFixed(2) ?? '—'}
                </span>
                <span className="font-mono text-xs tabular-nums text-amber-500">
                  {tx.wheelingCharge != null ? `฿${tx.wheelingCharge.toFixed(2)}` : '—'}
                </span>
              </div>

              {/* Time */}
              <span className="text-right text-[10px] tabular-nums text-muted-foreground">
                {tx.expiry}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto p-3 md:hidden">
        {doneOptioninfos.map((tx) => (
          <div
            key={tx.transactionID}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src={tx.token.logo}
                  alt={tx.token.name}
                  width={24}
                  height={24}
                  className="rounded-full ring-1 ring-border"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">{tx.token.name}</span>
                  <button
                    className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground"
                    onClick={() => handleCopyId(tx.transactionID)}
                  >
                    {tx.transactionID.slice(0, 12)}…
                    <Copy className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
              <SideChip side={tx.transactionType} />
            </div>

            <div className="grid grid-cols-4 gap-2 border-y border-border/50 py-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-medium uppercase text-muted-foreground">Volume</span>
                <span className="font-mono text-xs font-semibold">
                  {tx.quantity?.toFixed(1) ?? '0.0'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-medium uppercase text-muted-foreground">Price</span>
                <span className="font-mono text-xs font-semibold">
                  ฿{tx.strikePrice.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-medium uppercase text-muted-foreground">Delivered</span>
                <span className="font-mono text-xs font-semibold text-emerald-500">
                  {(tx.effectiveEnergy ?? tx.quantity)?.toFixed(1) ?? '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-medium uppercase text-muted-foreground">Fees</span>
                <span className="font-mono text-xs font-semibold text-amber-500">
                  {tx.wheelingCharge != null ? `฿${tx.wheelingCharge.toFixed(1)}` : '—'}
                </span>
              </div>
            </div>

            <div className="mt-1.5 text-right text-[10px] tabular-nums text-muted-foreground">
              {tx.expiry}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
