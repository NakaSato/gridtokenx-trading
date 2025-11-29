'use client'
import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { WalletIcon } from '@/public/svgs/icons'
import WalletModal from './WalletModal'
import ProtectedRoute from './ProtectedRoute'
import OpenFutures from './OpenFutures'
import Pagination from './Pagination'
import ExpiredFutures from './ExpiredFutures'
import FuturesOrderHistory from './FuturesOrderHistory'
import {
  futurePos,
  FuturePos,
  FuturesTransaction,
  futuresTx,
} from '@/lib/data/WalletActivity'
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
              ? 'Please sign in to view your futures'
              : connected && isAuthenticated
                ? 'No futures found'
                : 'To view your futures'}
        </span>

        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-9 w-32 rounded bg-muted"></div>
          </div>
        ) : connected && isAuthenticated ? (
          <div className="text-sm text-muted-foreground">
            Your futures positions will appear here
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

export default function FuturesPositions() {
  const [activeTab, setActiveTab] = useState('positions')
  const [currentPage, setCurrentPage] = useState(1)
  const [dummyTx, setDummyTx] = useState<FuturesTransaction[]>([])
  const [dummyPos, setDummyPos] = useState<FuturePos[]>([])

  useEffect(() => {
    setDummyTx(futuresTx)
    setDummyPos(futurePos)
  }, [])

  const itemsPerPage = 5

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = dummyPos.slice(indexOfFirstItem, indexOfLastItem)

  const orderHistoryItems = dummyTx.slice(indexOfFirstItem, indexOfLastItem)

  const handleClickTab = (value: string) => {
    setActiveTab(value)
    setCurrentPage(1)
  }

  return (
    <div className="mb-3 flex w-full flex-col rounded-sm border">
      <section className="rounded-none border-b px-6 py-3">
        <Tabs defaultValue={activeTab} onValueChange={handleClickTab}>
          <TabsList className="flex w-full justify-start gap-2 bg-inherit p-0 text-secondary-foreground md:gap-3 lg:gap-6">
            <TabsTrigger
              value="positions"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
            >
              Positions
            </TabsTrigger>
            <TabsTrigger
              value="Orders"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="funding"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
            >
              Funding
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
        {activeTab === 'positions' && (
          <>
            <section className="space-y-[10px] px-6 py-3">
              {currentItems.map((pos, idx) => (
                <OpenFutures
                  key={idx}
                  token={pos.token.name}
                  logo={pos.logo}
                  symbol={pos.symbol}
                  type={pos.futureType}
                  position={pos.position}
                  leverage={pos.leverage}
                  entry={pos.entryPrice}
                  liquidation={pos.LiqPrice}
                  size={pos.size}
                  collateral={pos.collateral}
                  tpsl={pos.TPSL}
                  purchaseDate={pos.purchaseDate}
                />
              ))}
            </section>
            <div className="w-full px-3 pb-4 md:px-6">
              <Pagination
                currentPage={currentPage}
                totalItems={dummyPos.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
        {activeTab === 'funding' && (
          <>
            <section className="space-y-[10px] px-6 py-3">
              <ExpiredFutures />
            </section>
            <div className="hidden w-full px-3 pb-4 md:px-6">
              <Pagination
                currentPage={currentPage}
                totalItems={0}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
        {activeTab === 'history' && (
          <>
            <section className="space-y-[10px] px-6 py-3">
              <FuturesOrderHistory dummyFutures={orderHistoryItems} />
            </section>
            <div className="w-full px-3 pb-4 md:px-6">
              <Pagination
                currentPage={currentPage}
                totalItems={dummyTx.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </ProtectedRoute>
    </div>
  )
}
