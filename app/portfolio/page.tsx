import { PointsCard } from '@/components/portfolio/points-card'
import { PortfolioCard } from '@/components/portfolio/portfolio-card'
import { PortfolioChart } from '@/components/portfolio/portfolio-chart'
import { PortfolioSummary } from '@/components/portfolio/portfolio-summary'
import { PortfolioTabs } from '@/components/portfolio/portfolio-tabs'
import { VolumeCard } from '@/components/portfolio/volume-card'
import { TradingHistoryChart } from '@/components/charts/TradingHistoryChart'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export default function Portfolio() {
  return (
    <ProtectedRoute requireWallet={false} requireAuth={true}>
      <main className="flex h-full flex-1 flex-col overflow-y-auto rounded-sm py-4">
        {/* Portfolio Summary - User Info, Balance, Wealth */}
        <ErrorBoundary name="Portfolio Summary">
          <PortfolioSummary />
        </ErrorBoundary>

        {/* Stats Cards Row */}
        <div className="mb-4 grid flex-shrink-0 grid-cols-12 gap-4">
          <div className="col-span-12 flex flex-col gap-4 sm:flex-row lg:col-span-3 lg:flex-col">
            <ErrorBoundary name="Volume Card">
              <VolumeCard />
            </ErrorBoundary>
            <ErrorBoundary name="Points Card">
              <PointsCard />
            </ErrorBoundary>
          </div>
          <div className="col-span-12 lg:col-span-3">
            <ErrorBoundary name="Portfolio Card">
              <PortfolioCard />
            </ErrorBoundary>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <ErrorBoundary name="Portfolio Chart">
              <PortfolioChart />
            </ErrorBoundary>
          </div>
        </div>

        {/* Trading History Chart */}
        <div className="mb-4">
          <ErrorBoundary name="Trading History Chart">
            <TradingHistoryChart />
          </ErrorBoundary>
        </div>

        {/* Portfolio Tabs */}
        <div className="min-h-0 flex-1">
          <ErrorBoundary name="Portfolio Tabs">
            <PortfolioTabs />
          </ErrorBoundary>
        </div>
      </main>
    </ProtectedRoute>
  )
}
