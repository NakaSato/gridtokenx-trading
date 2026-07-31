import { Metadata } from 'next'
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
        {/* The three money flows: deposit fiat, swap, withdraw */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <ErrorBoundary name="Wallet Actions">
            <WalletActions />
          </ErrorBoundary>
        </section>
      </main>
    </ProtectedRoute>
  )
}
