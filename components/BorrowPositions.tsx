import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import ProtectedRoute from './ProtectedRoute'
import { Button } from './ui/button'
import { WalletIcon } from '@/public/svgs/icons'
import WalletModal from './WalletModal'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/contexts/AuthProvider'

const Fallback = () => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const { connected } = useWallet()
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <div className="m-auto flex h-[186px] w-full items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <span>
          {isLoading
            ? 'Loading...'
            : connected && !isAuthenticated
              ? 'Please sign in to view your borrows'
              : connected && isAuthenticated
                ? 'No borrows found'
                : 'To view your borrows'}
        </span>

        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-9 w-32 rounded bg-muted"></div>
          </div>
        ) : connected && isAuthenticated ? (
          <div className="text-sm text-muted-foreground">
            Your borrow positions will appear here
          </div>
        ) : connected && !isAuthenticated ? (
          <Button
            onClick={() => setIsWalletModalOpen(true)}
            className="rounded-sm bg-primary text-background hover:bg-gradient-primary"
          >
            <WalletIcon />
            <span className="text-sm font-semibold">Sign In</span>
          </Button>
        ) : (
          <Button
            onClick={() => setIsWalletModalOpen(true)}
            className="rounded-sm bg-primary text-background hover:bg-gradient-primary"
          >
            <WalletIcon />
            <span className="text-sm font-semibold">Connect Wallet</span>
          </Button>
        )}

        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
        />
      </div>
    </div>
  )
}

export function BorrowPositions() {
  const [activeTab, setActiveTab] = useState('borrows')

  const handleClickTab = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="mb-3 flex w-full flex-col rounded-sm border">
      <section className="rounded-none border-b px-6 py-3">
        <Tabs defaultValue={activeTab} onValueChange={handleClickTab}>
          <TabsList className="flex w-full justify-start gap-2 bg-inherit p-0 text-secondary-foreground md:gap-3 lg:gap-6">
            <TabsTrigger
              value="borrows"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
            >
              Borrows
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="liquidations"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
            >
              Liquidations
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
            >
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </section>
      <ProtectedRoute fallback={<Fallback />}>
        {activeTab === 'borrows' && <div className="h-[300px]"></div>}
        {activeTab === 'orders' && <div className="h-[300px]"></div>}
        {activeTab === 'liquidations' && <div className="h-[300px]"></div>}
        {activeTab === 'history' && <div className="h-[300px]"></div>}
      </ProtectedRoute>
    </div>
  )
}
