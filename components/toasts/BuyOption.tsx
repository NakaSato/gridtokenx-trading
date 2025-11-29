import { tokenList } from '@/lib/data/tokenlist'
import Image from 'next/image'
import { Badge } from '../ui/badge'

interface BuyOptionProps {
  option: 'Call' | 'Put'
  active: number
}

export default function BuyOption({ option, active }: BuyOptionProps) {
  const tokens = tokenList
  const selectedToken = tokens[active]
  return (
    <div className="flex w-full flex-col justify-between gap-2">
      <div className="flex items-start gap-2 text-sm font-semibold">
        <Image
          src={selectedToken.iconPath}
          alt={selectedToken.symbol}
          width={20}
          height={20}
          className="h-5 w-5 rounded-full"
        />
        <span className="text-primary">Open Option</span>
        <Badge
          className={`${option === 'Call' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} flex h-fit w-fit items-center justify-center rounded-[3px] px-1 py-[1px] text-xs font-semibold`}
        >
          {option}
        </Badge>
      </div>
      <div className="flex flex-col gap-1 text-xs font-normal text-foreground">
        <div className="flex justify-between">
          <span>Price</span>
          <span>--</span>
        </div>
        <div className="flex justify-between">
          <span>Strike Price</span>
          <span>--</span>
        </div>
        <div className="flex justify-between">
          <span>Size</span>
          <span>--</span>
        </div>
        <div className="flex justify-between">
          <span>Expiry</span>
          <span>--</span>
        </div>
      </div>
    </div>
  )
}
