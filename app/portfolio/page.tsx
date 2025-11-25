import { PointsCard } from "@/components/portfolio/points-card";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import { PortfolioChart } from "@/components/portfolio/portfolio-chart";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import { PortfolioTabs } from "@/components/portfolio/portfolio-tabs";
import { VolumeCard } from "@/components/portfolio/volume-card";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Portfolio() {
  return (
    <ProtectedRoute requireWallet={false} requireAuth={true}>
      <main className="flex-1 py-4 rounded-sm flex flex-col h-full">
        {/* <PortfolioHeader /> */}
        <div className="grid grid-cols-12 gap-4 mb-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row lg:flex-col col-span-12 lg:col-span-3 gap-4">
            <VolumeCard />
            <PointsCard />
          </div>
          <div className="col-span-3">
            <PortfolioCard />
          </div>
          <PortfolioChart />
        </div>
        <div className="flex-1 min-h-0">
          <PortfolioTabs />
        </div>
      </main>
    </ProtectedRoute>
  );
}
