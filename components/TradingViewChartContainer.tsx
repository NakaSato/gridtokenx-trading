import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardHeader } from './ui/card'
import { Map as MapIcon, TrendingUp, BarChart3 } from 'lucide-react'
import EnergyGridMapWrapper from './EnergyGridMapWrapper'

// Dynamic imports to reduce initial bundle strain
const TradingViewChart = dynamic(() => import('./TradingViewChart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col overflow-hidden border-t-0 bg-card">
      <div className="flex w-full items-center border-b border-border px-2 py-1 h-[42px]">
        <div className="h-8 w-24 animate-pulse rounded bg-secondary/50" />
      </div>
      <div className="flex-1 p-4">
        <div className="h-full w-full animate-pulse rounded bg-secondary/30" />
      </div>
    </div>
  )
})

const PnlChartContainer = dynamic(() => import('./PnlChartContainer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col rounded-b-sm border border-t-0 p-4">
      <div className="h-full w-full animate-pulse rounded bg-secondary/20" />
    </div>
  )
})

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
  const [activeTab, setActiveTab] = useState<string>('map')

  const handleClick = (state: string) => {
    if (activeTab !== state) {
      setActiveTab(state)
    }
  }
  return (
    <>
      <Card className="flex h-full w-full flex-col overflow-hidden border border-border bg-card">
        <CardHeader className="border-b bg-muted/20 px-4 py-2">
          <Tabs defaultValue={activeTab} className="h-7">
            <TabsList className="h-full w-full justify-center gap-1 bg-secondary/50 p-0.5">
              <TabsTrigger
                value="map"
                className="h-full rounded-sm px-2 text-[10px] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                onClick={() => handleClick('map')}
              >
                <div className="flex items-center gap-1">
                  <MapIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">Map</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="chart"
                className="h-full rounded-sm px-2 text-[10px] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                onClick={() => handleClick('chart')}
              >
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className="hidden sm:inline">Chart</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="pnl"
                className="h-full rounded-sm px-2 text-[10px] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                onClick={() => handleClick('pnl')}
              >
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span className="hidden sm:inline">P&L</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden h-full min-h-0">
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

        </CardContent>
      </Card>
    </>
  )
}
