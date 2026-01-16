'use client'

import { Transaction } from '@/lib/data/WalletActivity'
import {
  CallIconDark,
  CopyIcon,
  PutIconDark,
  SendIcon,
} from '@/public/svgs/icons'
import Image from 'next/image'
import { Separator } from './ui/separator'
import { Button } from './ui/button'
import { Download, FileDown, Loader2 } from 'lucide-react'
import { useState, memo } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

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

      if (response.data) {
        // Create a download link for the blob
        const url = window.URL.createObjectURL(response.data as Blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `trade-history-${new Date().toISOString().split('T')[0]}.${format}`)
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
        toast.success(`History exported as ${format.toUpperCase()}`)
      } else if (response.error) {
        toast.error(`Export failed: ${response.error}`)
      }
    } catch (error) {
      toast.error('Failed to export history')
      console.error(error)
    } finally {
      setExporting(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Trades</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1.5 px-2 hover:bg-secondary/50"
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
          >
            {exporting === 'csv' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1.5 px-2 hover:bg-secondary/50"
            onClick={() => handleExport('json')}
            disabled={!!exporting}
          >
            {exporting === 'json' ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
            Export JSON
          </Button>
        </div>
      </div>

      <div className="hidden w-full flex-col space-y-[14px] md:flex">
        {doneOptioninfos &&
          doneOptioninfos.map((tx) => (
            <div
              className="flex w-full items-center justify-between"
              key={tx.transactionID}
            >
              <div className="flex w-full items-center space-x-[10px]">
                <div className="flex h-9 flex-col items-center justify-center -space-y-0.5">
                  <Image
                    src={tx.token.logo}
                    alt="eth icon"
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <div className="rounded-full ring ring-background bg-accent p-[2px]">
                    {tx.transactionType === 'Put' ? (
                      <PutIconDark width="20" height="20" />
                    ) : tx.transactionType === 'Sell' ? (
                      <div className="text-red-500">
                        <PutIconDark width="20" height="20" />
                      </div>
                    ) : tx.transactionType === 'Buy' ? (
                      <div className="text-green-500">
                        <CallIconDark width="20" height="20" />
                      </div>
                    ) : (
                      <CallIconDark width="20" height="20" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col justify-center max-w-[150px]">
                  <span className="text-xs font-medium text-foreground truncate">
                    {tx.transactionID}
                  </span>
                  <span className="flex items-center text-xs font-normal text-secondary-foreground">
                    {tx.token.name} • {tx.transactionType} Trade •
                    <span className="px-1">Spot</span>
                  </span>
                </div>

                {/* Energy Specific Details */}
                {tx.quantity && (
                  <div className="flex flex-1 items-center justify-around px-4">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Matched</span>
                      <span className="text-xs text-foreground font-medium">{tx.quantity.toFixed(2)} kWh</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Delivered</span>
                      <span className="text-xs text-green-500 font-bold">
                        {tx.effectiveEnergy ? tx.effectiveEnergy.toFixed(2) : tx.quantity.toFixed(2)} kWh
                      </span>
                    </div>
                    {tx.wheelingCharge !== undefined && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Wheeling</span>
                        <span className="text-xs text-yellow-500 font-medium">฿{tx.wheelingCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {tx.lossCost !== undefined && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Loss</span>
                        <span className="text-xs text-red-500 font-medium">฿{tx.lossCost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center min-w-[120px]">
                <div className="flex justify-end space-x-2">
                  <CopyIcon />
                  <SendIcon />
                </div>
                <span className="flex items-center justify-end whitespace-nowrap text-[10px] font-normal text-secondary-foreground">
                  {tx.expiry}
                </span>
              </div>
            </div>
          ))}
      </div>
      <div className="flex w-full flex-col md:hidden">
        {doneOptioninfos &&
          doneOptioninfos.map((tx, index) => (
            <>
              <div
                className="flex w-full flex-col items-center space-y-3"
                key={tx.transactionID}
              >
                <div className="flex w-full items-center space-x-[10px]">
                  <div className="flex h-9 flex-col items-center justify-center -space-y-0.5">
                    <Image
                      src={tx.token.logo}
                      alt="eth icon"
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <div className="rounded-full ring ring-background bg-accent p-[2px]">
                      {tx.transactionType === 'Put' ? (
                        <PutIconDark width="20" height="20" />
                      ) : tx.transactionType === 'Sell' ? (
                        <div className="text-red-500">
                          <PutIconDark width="20" height="20" />
                        </div>
                      ) : tx.transactionType === 'Buy' ? (
                        <div className="text-green-500">
                          <CallIconDark width="20" height="20" />
                        </div>
                      ) : (
                        <CallIconDark width="20" height="20" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-medium text-foreground">
                      {tx.transactionID}
                    </span>
                    <span className="flex items-center text-xs font-normal text-secondary-foreground">
                      {tx.token.name} • {tx.transactionType} {tx.optionType === 'Spot' ? 'Trade' : 'Option'} •
                      <span className="px-1">{tx.optionType}</span>
                    </span>
                  </div>
                </div>
                <div className="flex w-full justify-between">
                  <span className="flex items-center whitespace-nowrap text-xs font-normal text-secondary-foreground">
                    {tx.expiry}
                  </span>
                  <div className="flex justify-end space-x-2 text-secondary-foreground">
                    <CopyIcon />
                    <SendIcon />
                  </div>
                </div>
              </div>
              {index !== 8 && <Separator className="my-[14px]" />}
            </>
          ))}
      </div>
    </>
  )
})
