'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Info,
  AlertTriangle,
  ArrowRightLeft,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/provider'
import { createApiClient } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { Spinner } from '@/components/ui/spinner'

interface FuturesOrderFormProps {
  productId: string
  symbol: string
  currentPrice: number
  onOrderCreated?: () => void
}

export function FuturesOrderForm({
  productId,
  symbol,
  currentPrice,
  onOrderCreated,
}: FuturesOrderFormProps) {
  const { token } = useAuth()
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState(currentPrice.toString())
  const [leverage, setLeverage] = useState(10)
  const [loading, setLoading] = useState(false)

  // Sync price if market order
  useEffect(() => {
    if (orderType === 'market') {
      setPrice(currentPrice.toString())
    }
  }, [currentPrice, orderType])

  const numericQuantity = parseFloat(quantity) || 0
  const numericPrice = parseFloat(price) || currentPrice

  const marginRequirement = useMemo(() => {
    if (numericQuantity <= 0) return 0
    return (numericQuantity * numericPrice) / leverage
  }, [numericQuantity, numericPrice, leverage])

  const liquidationPrice = useMemo(() => {
    // Simple liquidation calculation for demonstration
    // maintenance margin assumed at 5%
    const mm = 0.05
    if (side === 'long') {
      return numericPrice * (1 - 1 / leverage + mm)
    } else {
      return numericPrice * (1 + 1 / leverage - mm)
    }
  }, [numericPrice, leverage, side])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error('Authentication required')
      return
    }

    if (numericQuantity <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    setLoading(true)
    try {
      const api = createApiClient(token)
      const response = await api.createFuturesOrder({
        product_id: productId,
        side,
        order_type: orderType,
        quantity: numericQuantity,
        price: numericPrice,
        leverage,
      })

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(`${side.toUpperCase()} order placed successfully`)
        setQuantity('')
        onOrderCreated?.()
      }
    } catch (err) {
      toast.error('Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-1">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSide('long')}
          className={cn(
            'h-10 rounded-md transition-all',
            side === 'long'
              ? 'bg-green-500 text-white shadow-sm hover:bg-green-600'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Buy / Long
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSide('short')}
          className={cn(
            'h-10 rounded-md transition-all',
            side === 'short'
              ? 'bg-red-500 text-white shadow-sm hover:bg-red-600'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <TrendingDown className="mr-2 h-4 w-4" />
          Sell / Short
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 border-b border-border/50 pb-2">
          <button
            type="button"
            onClick={() => setOrderType('market')}
            className={cn(
              'pb-1 text-xs font-bold uppercase tracking-wider transition-colors',
              orderType === 'market'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            )}
          >
            Market
          </button>
          <button
            type="button"
            onClick={() => setOrderType('limit')}
            className={cn(
              'pb-1 text-xs font-bold uppercase tracking-wider transition-colors',
              orderType === 'limit'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            )}
          >
            Limit
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <Label className="text-xs text-muted-foreground">Price</Label>
            <span className="font-mono text-[10px] text-muted-foreground">
              USDC
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={orderType === 'market'}
              className="h-10 border-none bg-muted/30 font-mono text-sm"
            />
            {orderType === 'market' && (
              <div className="pointer-events-none absolute inset-0 flex items-center px-3">
                <span className="font-mono text-sm text-muted-foreground">
                  Market Price
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <span className="font-mono text-[10px] text-muted-foreground">
              kWh
            </span>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-10 border-none bg-muted/30 font-mono text-sm"
          />
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <Label className="text-xs text-muted-foreground">Leverage</Label>
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 font-mono text-primary"
            >
              {leverage}x
            </Badge>
          </div>
          <Slider
            value={[leverage]}
            min={1}
            max={50}
            step={1}
            onValueChange={([val]) => setLeverage(val)}
            className="py-2"
          />
          <div className="flex justify-between px-1 text-[10px] font-medium text-muted-foreground">
            <span>1x</span>
            <span>10x</span>
            <span>25x</span>
            <span>50x</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-dashed border-border/50 bg-muted/30 p-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Margin Required</span>
          <span className="font-mono font-bold">
            ฿{marginRequirement.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Liquidation Price</span>
          <span
            className={cn(
              'font-mono font-bold',
              side === 'long' ? 'text-red-500' : 'text-green-500'
            )}
          >
            ฿{liquidationPrice.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Trading Fee (0.05%)</span>
          <span className="font-mono text-muted-foreground">
            ฿{(numericQuantity * numericPrice * 0.0005).toFixed(4)}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className={cn(
          'h-12 w-full text-sm font-bold uppercase tracking-wider shadow-lg',
          side === 'long'
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-red-500 hover:bg-red-600'
        )}
      >
        {loading && <Spinner className="mr-2 h-4 w-4" />}
        {side === 'long' ? 'Open Long Position' : 'Open Short Position'}
      </Button>

      <div className="flex items-center gap-2 rounded-lg border border-yellow-500/10 bg-yellow-500/5 p-2">
        <ShieldAlert className="h-4 w-4 shrink-0 text-yellow-500" />
        <p className="text-[10px] leading-tight text-yellow-600">
          Futures involve high risk. Leverage can lead to complete loss of
          margin. Use with caution.
        </p>
      </div>
    </form>
  )
}
