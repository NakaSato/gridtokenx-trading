import { Metadata } from 'next'
import { CarbonCredits } from '@/components/portfolio/carbon-credits'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Carbon Credits | GridTokenX',
  description: 'Track, transfer, and retire your carbon credits earned from renewable energy trading on GridTokenX.',
}

export default function CarbonCreditPage() {
  return (
    <ProtectedRoute requireWallet={false} requireAuth={true}>
      <main className="flex h-full flex-1 flex-col overflow-y-auto py-4 px-1">
        <header className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Carbon Credits</h1>
          <p className="text-sm text-muted-foreground">
            Track credits earned from renewable trading, transfer them, and see your CO2 impact
          </p>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <ErrorBoundary name="Carbon Credits">
            <CarbonCredits />
          </ErrorBoundary>
        </section>
      </main>
    </ProtectedRoute>
  )
}
