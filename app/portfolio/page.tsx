import { Metadata } from 'next'
import { PortfolioHero } from '@/components/portfolio/portfolio-hero'
import { PortfolioTabs } from '@/components/portfolio/portfolio-tabs'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Portfolio | GridTokenX',
  description: 'View your energy trading portfolio, performance analytics, positions, and transaction history on GridTokenX.',
}

export default function Portfolio() {
  return (
    <ProtectedRoute requireWallet={false} requireAuth={true}>
      <main className="flex h-full flex-1 flex-col overflow-y-auto py-4 px-1">
        {/* Hero - Identity + Total Wealth + Performance */}
        <section className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <ErrorBoundary name="Portfolio Hero">
            <PortfolioHero />
          </ErrorBoundary>
        </section>

        {/* Portfolio Tabs - System Status, Positions, Orders, History */}
        <section className="min-h-0 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <ErrorBoundary name="Portfolio Tabs">
            <PortfolioTabs />
          </ErrorBoundary>
        </section>
      </main>
    </ProtectedRoute>
  )
}
