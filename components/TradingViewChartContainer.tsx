import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
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
  const [activeTab, setActiveTab] = useState<string>('chart')

  const handleClick = (state: string) => {
    if (activeTab !== state) {
      setActiveTab(state)
    }
  }
  return (
    <>
      <div className="flex h-full min-h-[500px] w-full flex-col sm:min-h-[400px]">
        <div className="rounded-t-sm border border-b bg-inherit p-0">
          <Tabs defaultValue={activeTab}>
            <TabsList className="flex h-10 w-full overflow-x-auto rounded-full bg-inherit px-2 py-1 sm:grid sm:grid-cols-4 sm:px-4">
              <TabsTrigger
                value="map"
                className="min-w-[60px] flex-shrink-0 rounded-none border-b px-2 py-2 text-xs text-secondary-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary sm:min-w-0 sm:px-0 sm:text-sm"
                onClick={() => handleClick('map')}
              >
                Map
              </TabsTrigger>
              <TabsTrigger
                value="chart"
                className="min-w-[60px] flex-shrink-0 rounded-none border-b px-2 py-2 text-xs text-secondary-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary sm:min-w-0 sm:px-0 sm:text-sm"
                onClick={() => handleClick('chart')}
              >
                Chart
              </TabsTrigger>

              <TabsTrigger
                value="pnl"
                className="min-w-[60px] flex-shrink-0 rounded-none border-b px-2 py-2 text-xs text-secondary-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary sm:min-w-0 sm:px-0 sm:text-sm"
                onClick={() => handleClick('pnl')}
              >
                P&L
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="min-w-[60px] flex-shrink-0 rounded-none border-b px-2 py-2 text-xs text-secondary-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary sm:min-w-0 sm:px-0 sm:text-sm"
                onClick={() => handleClick('transactions')}
              >
                <span className="hidden sm:inline">Transactions</span>
                <span className="sm:hidden">Txns</span>
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

          {activeTab === 'transactions' && (
            <TransactionHistory useMockData={false} />
          )}
        </div>
      </div>
    </>
  )
}
