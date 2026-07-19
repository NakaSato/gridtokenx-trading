import { Metadata } from 'next'
import { WalletTransfer } from '@/components/wallet/WalletTransfer'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Wallet | GridTokenX',
  description: 'Deposit GRX into your on-chain trading escrow and withdraw it back to your wallet.',
}

export default function WalletPage() {
  return (
    <ProtectedRoute requireWallet={true} requireAuth={true}>
      <main className="flex h-full flex-1 flex-col overflow-y-auto py-4 px-1">
        <header className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Wallet</h1>
          <p className="text-sm text-muted-foreground">
            Deposit and withdraw GRX between your wallet and your on-chain trading escrow
          </p>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <ErrorBoundary name="Wallet Transfer">
            <WalletTransfer />
          </ErrorBoundary>
        </section>
      </main>
    </ProtectedRoute>
  )
}
