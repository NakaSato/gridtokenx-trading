import { PointsCard } from '@/components/portfolio/points-card'
import { PortfolioCard } from '@/components/portfolio/portfolio-card'
import { PortfolioChart } from '@/components/portfolio/portfolio-chart'
import { PortfolioHeader } from '@/components/portfolio/portfolio-header'
import { PortfolioTabs } from '@/components/portfolio/portfolio-tabs'
import { VolumeCard } from '@/components/portfolio/volume-card'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function Portfolio() {
  return (
    <ProtectedRoute requireWallet={false} requireAuth={true}>
      <main className="flex h-full flex-1 flex-col rounded-sm py-4">
        {/* <PortfolioHeader /> */}
        <div className="mb-4 grid flex-shrink-0 grid-cols-12 gap-4">
          <div className="col-span-12 flex flex-col gap-4 sm:flex-row lg:col-span-3 lg:flex-col">
            <VolumeCard />
            <PointsCard />
          </div>
          <div className="col-span-3">
            <PortfolioCard />
          </div>
          <PortfolioChart />
        </div>
        <div className="min-h-0 flex-1">
          <PortfolioTabs />
        </div>
      </main>
    </ProtectedRoute>
  )
}
