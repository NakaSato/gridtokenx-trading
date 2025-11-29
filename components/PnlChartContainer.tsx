import {
  DeltaIcon,
  GammaIcon,
  InfoIcon,
  ThetaIcon,
  VegaIcon,
} from '@/public/svgs/icons'
import { Button } from './ui/button'
import { Minus, Plus } from 'lucide-react'
import { PnLChart } from './PnlChart'
import { formatPrice } from '@/utils/formatter'
import { convertPrice } from '@/utils/optionsPricing'
import { usePythPrice } from '@/hooks/usePythPrice'

interface PnlChartContainerProps {
  investment: string
  premium: string
  strikePrice: string
  currentPrice: number
  contractType: string
  positionType: string
}

export default function PnlChartContainer({
  investment,
  premium,
  strikePrice,
  currentPrice,
  contractType,
  positionType,
}: PnlChartContainerProps) {
  const invested = convertPrice(parseFloat(investment), currentPrice)
  return (
    <div className="flex h-full flex-col rounded-b-sm border border-t-0">
      {/* <div className="w-full flex px-5 py-1 border-b">
                <div className="w-full flex space-x-2 justify-between items-center">
                    <span className="h-6 text-base text-secondary-foreground font-medium">PNL Graph</span>
                    <div className="flex space-x-2 items-center">
                        <div className="flex space-x-1 items-center">
                            <PurpleDot />
                            <GreenDot />
                        </div>
                        <span className="text-sm text-secondary-foreground">Expiry</span>
                    </div>
                </div>
                <Separator orientation='vertical' className='mx-2 h-8 bg-backgroundSecondary'/>
                <div className="flex space-x-2 items-center">
                    <div className="flex space-x-1 items-center">
                        <OrangeDot />
                    </div>
                    <span className="text-sm text-secondary-foreground whitespace-nowrap">Theoretical Payoff</span>
                </div>
            </div> */}
      <div className="h-full w-full">
        <PnLChart
          strikePrice={parseFloat(strikePrice)}
          premium={parseFloat(premium)}
          contractType={contractType.toLowerCase()}
          positionType={positionType.toLowerCase()}
          currentPrice={parseFloat(formatPrice(currentPrice))}
          invested={invested}
        />
      </div>
      <div className="flex w-full justify-between border-t px-5 py-2">
        <div className="flex w-full items-center space-x-6">
          <div className="flex items-center space-x-2 text-secondary-foreground">
            <DeltaIcon />
            <span className="text-sm font-medium text-secondary-foreground">
              54.68
            </span>
            <InfoIcon />
          </div>
          <div className="flex items-center space-x-2 text-secondary-foreground">
            <GammaIcon />
            <span className="text-sm font-medium text-secondary-foreground">
              -3514.27
            </span>
            <InfoIcon />
          </div>
          <div className="flex items-center space-x-2 text-secondary-foreground">
            <ThetaIcon />
            <span className="text-sm font-medium text-secondary-foreground">
              0.19
            </span>
            <InfoIcon />
          </div>
          <div className="flex items-center space-x-2 text-secondary-foreground">
            <VegaIcon />
            <span className="text-sm font-medium text-secondary-foreground">
              501.98
            </span>
            <InfoIcon />
          </div>
        </div>
        <div className="flex w-full items-center justify-end space-x-2">
          <span className="text-sm font-medium text-secondary-foreground">
            Standard Deviation
          </span>
          <Button className="space-x-4 rounded-[10px] bg-backgroundSecondary px-2 py-1 text-secondary-foreground shadow-none">
            <Minus />
            <span>01</span>
            <Plus />
          </Button>
        </div>
      </div>
    </div>
  )
}
