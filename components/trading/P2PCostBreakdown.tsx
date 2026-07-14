'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import {
  Zap,
  Truck,
  ArrowRightLeft,
  Coins,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthProvider'
import { useP2PMarketPrices } from '@/hooks/useApi'
import { P2P_CONFIG } from '@/lib/constants'

interface P2PCostBreakdownProps {
  amount: number
  agreedPrice?: number
  buyerZoneId?: number
  sellerZoneId?: number
  className?: string
}

export function P2PCostBreakdown({
  amount,
  agreedPrice,
  buyerZoneId = 1, // Default fallback
  sellerZoneId = 1, // Default to intra-zone
  className
}: P2PCostBreakdownProps) {
  const { token } = useAuth()
  const { marketPrices } = useP2PMarketPrices(token ?? undefined)

  if (amount <= 0) return null

  // Real-data cost estimate — sourced from the market-prices endpoint (real,
  // per-zone wheeling charges + loss factors), not the mocked /api/v1/quotes
  // (see STUB WARNING in lib/api/trading.ts calculateP2PCost).
  const energyCost = amount * (agreedPrice || 0)
  const crossZone = buyerZoneId !== sellerZoneId
  const zoneKey = String(sellerZoneId)
  const homeZoneKey = String(buyerZoneId)
  const wheelingChargePerKwh = crossZone
    ? (marketPrices?.wheeling_charges?.[zoneKey] ?? marketPrices?.wheeling_charges?.[homeZoneKey] ?? 0)
    : 0
  const wheelingCharge = wheelingChargePerKwh * amount
  const lossFactor = crossZone
    ? (marketPrices?.loss_factors?.[zoneKey] ?? marketPrices?.loss_factors?.[homeZoneKey] ?? P2P_CONFIG.defaultCrossZoneLossFactor)
    : 0
  const lossCost = energyCost * lossFactor
  const totalCost = energyCost + wheelingCharge + lossCost
  const effectiveEnergy = amount * (1 - lossFactor)

  return (
    <Card className={cn("p-4 bg-muted/30 border-dashed overflow-hidden relative", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <h4 className="text-sm font-semibold">Landed Cost Breakdown</h4>
        </div>
      </div>

      <div className="space-y-3">
        {/* Main Totals */}
        <div className="flex items-end justify-between p-3 bg-background rounded-xl border border-border/50 shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Total Landed Cost</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-primary">฿{totalCost.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground font-medium">/ order</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Price Per kWh</p>
            <span className="text-sm font-mono font-bold">฿{(totalCost / (amount || 1)).toFixed(3)}</span>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="grid grid-cols-1 gap-1.5">
          <BreakdownItem
            label="Energy Cost"
            value={energyCost}
            icon={Zap}
            color="text-yellow-500"
          />
          <BreakdownItem
            label="Wheeling Charge"
            value={wheelingCharge}
            icon={Truck}
            color="text-blue-500"
            info={crossZone ? 'Cross-zone transfer' : 'Intra-zone — no fee'}
          />
          <BreakdownItem
            label="Technical Loss"
            value={lossCost}
            icon={TrendingUp}
            color="text-orange-500"
            info={`${(lossFactor * 100).toFixed(1)}% energy lost`}
          />
        </div>

        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <ArrowRightLeft className="h-3 w-3" />
              Effective Energy Received
            </span>
            <span className="font-bold text-foreground">{effectiveEnergy.toFixed(2)} kWh</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function BreakdownItem({ label, value, icon: Icon, color, info }: { label: string; value: number; icon: any; color: string; info?: string }) {
  return (
    <div className="flex items-center justify-between py-1 px-1">
      <div className="flex items-center gap-2">
        <div className={cn("p-1 rounded-md bg-muted", color)}>
          <Icon className="h-3 w-3" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{label}</span>
          {info && <span className="text-[9px] text-muted-foreground/60 leading-none">{info}</span>}
        </div>
      </div>
      <span className="text-xs font-mono font-semibold">฿{value?.toFixed(2) || '0.00'}</span>
    </div>
  )
}
