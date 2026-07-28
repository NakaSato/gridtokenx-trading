import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { useState, memo } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OpenPositionProps {
  index: string | number
  token: string
  logo: string
  symbol: string
  strikePrice: number
  // 'Long' | 'Short' (futures) or 'Call' | 'Put' (options)
  type: string
  expiry: string
  size: number
  pnl: number
  greeks: {
    delta: number
    gamma: number
    theta: number
    vega: number
  }
  // Optional — on-chain options only. API futures positions aren't
  // exercisable, so the button is hidden when no handler is provided.
  onExercise?: () => void
}

/** One label/value column on the right-hand side of the position row. */
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

/**
 * Flat, information-dense position row: everything important is visible
 * without expanding. A chevron reveals greeks when they carry data (options);
 * futures rows (all-zero greeks) have nothing to expand.
 */
export default memo(function OpenPositions({
  token,
  logo,
  symbol,
  type,
  expiry,
  size,
  pnl,
  greeks,
  strikePrice,
  onExercise,
}: OpenPositionProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Long/Call = bullish (emerald); Short/Put = bearish (red)
  const isBull = type === 'Long' || type === 'Call'
  const isFutures = type === 'Long' || type === 'Short'
  const hasGreeks =
    greeks.delta !== 0 ||
    greeks.gamma !== 0 ||
    greeks.theta !== 0 ||
    greeks.vega !== 0
  const pnlPositive = pnl >= 0

  return (
    <div className="rounded-lg border border-border bg-card">
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-muted/10',
          hasGreeks && 'cursor-pointer'
        )}
        onClick={hasGreeks ? () => setIsOpen((o) => !o) : undefined}
      >
        {/* Identity: side accent, logo, type + symbol, expiry */}
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              'h-8 w-1 flex-shrink-0 rounded-full',
              isBull ? 'bg-emerald-500' : 'bg-destructive'
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
                  isBull ? 'text-emerald-500' : 'text-destructive'
                )}
              >
                {type}
              </span>
              <span className="text-xs font-semibold">{symbol}</span>
            </div>
            <span className="truncate text-[10px] text-muted-foreground">
              {expiry === 'Perpetual' ? 'Perpetual' : `Expires ${expiry}`}
            </span>
          </div>
        </div>

        {/* Numbers + actions */}
        <div className="flex flex-shrink-0 items-center gap-4">
          <Field label={isFutures ? 'Entry' : 'Strike'}>
            {isFutures ? (
              <>
                ฿{strikePrice.toFixed(2)}
                <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">
                  /kWh
                </span>
              </>
            ) : (
              strikePrice
            )}
          </Field>
          <Field label="Size" className="hidden sm:flex">
            {size.toFixed(2)}
            {isFutures && (
              <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">
                kWh
              </span>
            )}
          </Field>
          <Field label="PnL">
            <span
              className={cn(
                'font-mono',
                pnlPositive ? 'text-emerald-500' : 'text-destructive'
              )}
            >
              {pnlPositive ? '+' : '−'}฿{Math.abs(pnl).toFixed(2)}
            </span>
          </Field>

          {onExercise && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={(e) => {
                e.stopPropagation()
                onExercise()
              }}
            >
              Exercise
            </Button>
          )}

          {hasGreeks && (
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          )}
        </div>
      </div>

      {/* Greeks — options only */}
      {isOpen && hasGreeks && (
        <div className="grid grid-cols-4 gap-2 border-t border-border px-3 py-2 duration-200 animate-in fade-in slide-in-from-top-1">
          {(
            [
              ['Delta', greeks.delta],
              ['Gamma', greeks.gamma],
              ['Theta', greeks.theta],
              ['Vega', greeks.vega],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-[9px] font-medium uppercase text-muted-foreground">
                {label}
              </span>
              <span className="font-mono text-xs font-semibold tabular-nums">
                {value.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
