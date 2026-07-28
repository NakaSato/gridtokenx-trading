'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OpenOptionOrdersProps {
  orderId: string
  logo: string
  token: string
  symbol: string
  type: string
  // null for market orders (no user-set price) — rendered as "Market".
  limitPrice: number | null
  transaction: string
  size: number
  orderDate: string
  // Order lifecycle status (pending | active | partially_filled). Optional so
  // older call sites keep compiling; badge is omitted when absent.
  status?: string
  onCancel: (orderId: string) => void
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20',
  },
  partially_filled: {
    label: 'Partial',
    className: 'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20',
  },
}

/** One label/value column on the right-hand side of the order row. */
function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-end', className)}>
      <span className="text-[9px] font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-xs font-semibold text-foreground">
        {children}
      </span>
    </div>
  )
}

export default function OpenOptionOrders({
  orderId,
  logo,
  token,
  symbol,
  type,
  limitPrice,
  transaction,
  size,
  orderDate,
  status,
  onCancel,
}: OpenOptionOrdersProps) {
  const isBuy = transaction === 'buy'
  const statusStyle = status ? STATUS_STYLES[status] : undefined

  return (
    <div
      data-testid="open-order-card"
      data-order-id={orderId}
      className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:bg-muted/10"
    >
      {/* Identity: side accent, logo, symbol + badges */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            'h-8 w-1 flex-shrink-0 rounded-full',
            isBuy ? 'bg-emerald-500' : 'bg-destructive'
          )}
        />
        <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full">
          <Image src={logo} alt={token} fill className="object-cover" />
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-[10px] font-bold uppercase',
                isBuy ? 'text-emerald-500' : 'text-destructive'
              )}
            >
              {isBuy ? 'Buy' : 'Sell'}
            </span>
            <span className="text-xs font-semibold">{symbol}</span>
            <Badge
              variant="outline"
              className="h-4 px-1.5 text-[9px] font-normal"
            >
              {type}
            </Badge>
            {statusStyle && (
              <Badge
                variant="outline"
                className={cn(
                  'h-4 rounded-md border-0 px-1.5 text-[9px] font-normal',
                  statusStyle.className
                )}
              >
                {statusStyle.label}
              </Badge>
            )}
          </div>
          <span className="truncate text-[10px] text-muted-foreground">
            Placed {orderDate}
          </span>
        </div>
      </div>

      {/* Numbers + cancel */}
      <div className="flex flex-shrink-0 items-center gap-4">
        <Field label="Price">
          {limitPrice != null ? (
            <>
              ฿{limitPrice.toFixed(2)}
              <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">
                /kWh
              </span>
            </>
          ) : (
            'Market'
          )}
        </Field>
        <Field label="Size" className="hidden sm:flex">
          {size.toFixed(2)}
          <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">
            kWh
          </span>
        </Field>
        <Button
          data-testid="cancel-order-button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Cancel Order"
          onClick={() => onCancel(orderId)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
