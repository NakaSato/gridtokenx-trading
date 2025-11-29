import { OptionChainData } from '@/lib/data/dummyData'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { OptionChainChart } from './OptionChainChart'

interface OptionChainSummaryProps {
  idx: number
  option: OptionChainData
}

export default function OptionChainSummary({
  idx,
  option,
}: OptionChainSummaryProps) {
  if (idx === -1) {
    return (
      <main
        className="flex w-full flex-col items-center justify-center space-y-4 rounded-sm border"
        style={{ height: 'calc(100vh - 155px)' }}
      >
        <div className="flex flex-col items-center space-y-3">
          <h1 className="text-2xl font-medium">Trade Options</h1>
          <span className="text-sm font-normal text-secondary-foreground">
            Selected option will appear here
          </span>
        </div>
      </main>
    )
  } else {
    return (
      <main
        className="flex w-full flex-col space-y-5 rounded-sm border p-4"
        style={{ height: 'calc(100vh - 155px)' }}
      >
        <div className="space-y-2 text-sm text-secondary-foreground">
          <Label>Contracts</Label>
          <Input className="h-10 rounded-sm border-border p-2 text-base font-medium placeholder:text-secondary-foreground focus:border-primary" />
        </div>
        <div className="space-y-2 text-sm text-secondary-foreground">
          <Label>Limit Price</Label>
          <Input className="h-10 rounded-sm border-border p-2 text-base font-medium placeholder:text-secondary-foreground focus:border-primary" />
        </div>
        <div className="flex justify-between text-sm text-secondary-foreground">
          <span>Strikeprice</span>
          <span>${option.strikePrice}</span>
        </div>
        <div className="flex justify-between text-sm text-secondary-foreground">
          <span>Bid Price</span>
          <span>${option.bidPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-secondary-foreground">
          <span>Balance</span>
          <span>$XXXX</span>
        </div>
        <div className="flex justify-between text-sm text-secondary-foreground">
          <span>Expected Profit/Loss</span>
          <span>$XXX</span>
        </div>
        <Button className="w-full">Review Order</Button>
        <div className="flex h-40 items-center justify-center rounded-sm border">
          <OptionChainChart />
        </div>
      </main>
    )
  }
}
