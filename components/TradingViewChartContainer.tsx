import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import TradingViewChart from './TradingViewChart'
import PnlChartContainer from './PnlChartContainer'
import OptionPrice from './OptionPrice'
import EnergyGridMapWrapper from './EnergyGridMapWrapper'

interface TradingViewChartContainerProps {
  symbol: string
  logo: string
  investment: string
  premium: string
  strikePrice: string
  currentPrice: number
  contractType: 'Call' | 'Put'
  positionType: string
  expiry: Date
}

export default function TradingViewChartContainer({
  symbol,
  logo,
  investment,
  premium,
  strikePrice,
  currentPrice,
  contractType,
  positionType,
  expiry,
}: TradingViewChartContainerProps) {
  const [activeTab, setActiveTab] = useState<string>('chart')

  const handleClick = (state: string) => {
    if (activeTab !== state) {
      setActiveTab(state)
    }
  }
  return (
    <>
      <div className="flex h-full min-h-[400px] w-full flex-col">
        <div className="rounded-t-sm border border-b bg-inherit p-0">
          <Tabs defaultValue={activeTab}>
            <TabsList className="grid h-10 w-full grid-cols-4 rounded-full bg-inherit px-4 py-1">
              <TabsTrigger
                value="map"
                className="rounded-none border-b px-0 py-2 text-secondary-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
                onClick={() => handleClick('map')}
              >
                Map
              </TabsTrigger>
              <TabsTrigger
                value="chart"
                className="rounded-none border-b px-0 py-2 text-secondary-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
                onClick={() => handleClick('chart')}
              >
                Chart
              </TabsTrigger>

              <TabsTrigger
                value="pnl"
                className="rounded-none border-b px-0 py-2 text-secondary-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
                onClick={() => handleClick('pnl')}
              >
                PNL
              </TabsTrigger>
              <TabsTrigger
                value="price"
                className="rounded-none border-b px-0 py-2 text-secondary-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
                onClick={() => handleClick('price')}
              >
                Options Price
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="w-full flex-grow">
          {activeTab === 'chart' && (
            <TradingViewChart symbol={symbol} logo={logo} />
          )}
          {activeTab === 'map' && <EnergyGridMapWrapper />}
          {activeTab === 'pnl' && (
            <PnlChartContainer
              investment={investment}
              premium={premium}
              strikePrice={strikePrice}
              currentPrice={currentPrice}
              contractType={contractType}
              positionType={positionType}
            />
          )}
          {activeTab === 'price' && (
            <OptionPrice
              symbol={symbol}
              logo={logo}
              strikePrice={strikePrice}
              contractType={contractType}
              expiry={expiry}
            />
          )}
        </div>
      </div>
    </>
  )
}
