import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardHeader } from './ui/card'
import { Map as MapIcon, TrendingUp, BarChart3, History } from 'lucide-react'
import TradingViewChart from './TradingViewChart'
import PnlChartContainer from './PnlChartContainer'
import EnergyGridMapWrapper from './EnergyGridMapWrapper'
import TransactionHistory from './TransactionHistory'

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
      <Card className="flex h-full min-h-[450px] w-full flex-col overflow-hidden border border-border bg-card md:min-h-[600px]">
        <CardHeader className="border-b bg-muted/20 px-4 py-2">
          <Tabs defaultValue={activeTab} className="h-9">
            <TabsList className="h-full w-full justify-center gap-4 bg-secondary/50 p-1">
              <TabsTrigger
                value="map"
                className="h-full rounded-sm px-3 text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                onClick={() => handleClick('map')}
              >
                <div className="flex items-center gap-2">
                  <MapIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Map</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="chart"
                className="h-full rounded-sm px-3 text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                onClick={() => handleClick('chart')}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Chart</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="pnl"
                className="h-full rounded-sm px-3 text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                onClick={() => handleClick('pnl')}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">P&L</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="h-full rounded-sm px-3 text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                onClick={() => handleClick('transactions')}
              >
                <div className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Transactions</span>
                  <span className="sm:hidden">Txns</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
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

          {activeTab === 'transactions' && (
            <TransactionHistory useMockData={false} />
          )}
        </CardContent>
      </Card>
    </>
  )
}
