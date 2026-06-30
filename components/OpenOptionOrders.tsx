'use client'

import Image from 'next/image'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { X } from 'lucide-react'

interface OpenOptionOrdersProps {
  orderId: string
  logo: string
  token: string
  symbol: string
  type: string
  // null for market orders (no user-set price) — rendered as "Market".
  limitPrice: number | null
  transaction: string
  strikePrice: number
  expiry: string
  size: number
  orderDate: string
  onCancel: (orderId: string) => void
}

export default function OpenOptionOrders({
  orderId,
  logo,
  token,
  symbol,
  type,
  limitPrice,
  transaction,
  strikePrice,
  expiry,
  size,
  orderDate,
  onCancel,
}: OpenOptionOrdersProps) {
  return (
    <div
      data-testid="open-order-card"
      data-order-id={orderId}
      className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full">
          <Image
            src={logo}
            alt={token}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{symbol}</span>
            <Badge variant="outline" className="text-xs">
              {type}
            </Badge>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <span>
              {transaction === 'buy' ? 'Buy' : 'Sell'}
              {limitPrice != null ? ` @ $${limitPrice.toFixed(4)}` : ' · Market'}
            </span>
            <span>·</span>
            <span>Size: {size.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end text-right">
          <span className="text-xs text-muted-foreground">{expiry}</span>
          <span className="text-xs text-muted-foreground">{orderDate}</span>
        </div>
        <Button
          data-testid="cancel-order-button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Cancel Order"
          onClick={() => onCancel(orderId)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
