import { Metadata } from 'next'
import { WalletHero } from '@/features/wallet/components/WalletHero'
import { WalletActions } from '@/features/wallet/components/WalletActions'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Wallet | GridTokenX',
  description: 'Deposit baht, swap between THBC and GRX, and withdraw back to your bank.',
}

export default function WalletPage() {
  return (
    <ProtectedRoute requireWallet={true} requireAuth={true}>
      <main className="flex h-full flex-1 flex-col overflow-y-auto py-4 px-1">
        <header className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Wallet</h1>
          <p className="text-sm text-muted-foreground">
            Deposit baht, swap between THBC and GRX, or withdraw to your bank
          </p>
        </header>

        {/* Hero - connection, address, live GRX + THBC balances */}
        <section className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <ErrorBoundary name="Wallet Hero">
            <WalletHero />
          </ErrorBoundary>
        </section>

        {/* The three money flows: deposit fiat, swap, withdraw */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <ErrorBoundary name="Wallet Actions">
            <WalletActions />
          </ErrorBoundary>
        </section>
      </main>
    </ProtectedRoute>
  )
}
