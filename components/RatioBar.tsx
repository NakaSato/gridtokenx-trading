'use client'

import { cn } from '@/lib/utils'

interface RatioBarProps {
  symbol: string
  leftPercentage: number
  rightPercentage: number
  leftColor?: string
  rightColor?: string
  classname?: string
}

export function RatioBar({
  symbol,
  leftPercentage,
  rightPercentage,
  leftColor = 'bg-green-500',
  rightColor = 'bg-red-500',
  classname,
}: RatioBarProps) {
  const total = leftPercentage + rightPercentage
  const normalizedLeft = (leftPercentage / total) * 100
  const normalizedRight = (rightPercentage / total) * 100

  return (
    <div className="relative h-3 flex-1 overflow-hidden rounded-[2px]">
      <div
        className={cn(
          'absolute left-0 top-0 flex h-full items-center justify-center border border-green-500 text-xs font-medium text-white',
          leftColor
        )}
        style={{ width: `${normalizedLeft}%` }}
      >
        <span className="text-center text-[8px]">
          {leftPercentage.toFixed(2)}%
        </span>
      </div>
      <div
        className={cn(
          'border- absolute right-0 top-0 flex h-full items-center justify-center border-red-500 text-xs font-medium text-white',
          rightColor
        )}
        style={{ width: `${normalizedRight}%` }}
      >
        <span className="text-center text-[8px]">
          {rightPercentage.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}
