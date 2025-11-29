import { Ban, EllipsisVertical, RotateCw } from 'lucide-react'
import { Button } from './ui/button'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { useState } from 'react'
import WalletModal from './WalletModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { WalletIcon } from '@/public/svgs/icons'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/contexts/AuthProvider'

export default function TradingPositionsFallback() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const { connected } = useWallet()
  const { isAuthenticated, isLoading, user } = useAuth()

  return (
    <div className="flex h-[300px] w-full flex-col rounded-sm border">
      <div className="flex w-full justify-between border-b px-3 py-1 md:px-6 md:py-3">
        <Tabs
          defaultValue="Positions"
          className="overflow-hidden whitespace-nowrap p-0"
        >
          <TabsList className="flex w-full gap-2 bg-inherit p-0 text-secondary-foreground md:gap-3 lg:gap-6">
            <TabsTrigger
              value="Positions"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
            >
              Positions
            </TabsTrigger>
            <TabsTrigger
              value="OpenOrders"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="Expired"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
            >
              Expired
            </TabsTrigger>
            <TabsTrigger
              value="History"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
            >
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {/* <div className="hidden md:flex gap-3 items-center">
                    <Button
                        className="bg-secondary p-2 w-full h-auto rounded-sm"
                    >
                        <RotateCw className="text-secondary-foreground"/>
                    </Button>
                    <Button
                        className="bg-secondary w-full h-auto py-[6px] px-[10px] rounded-sm"
                    >
                        <Ban className="text-secondary-foreground p-0"/>
                        <span className="text-sm font-normal text-secondary-foreground p-0">Cancel all</span>
                    </Button>
                </div> */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-auto w-fit rounded-[10px] bg-inherit p-[6px] shadow-none md:hidden">
              <EllipsisVertical className="text-secondary-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-fit rounded-[12px] p-1"
          >
            <DropdownMenuItem className="w-fit gap-0 space-x-[6px]">
              <RotateCw className="w-fit text-secondary-foreground" />
              <span>Reload</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="w-fit gap-0 space-x-[6px]">
              <Ban className="text-secondary-foreground" />
              <span>Cancel All</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="m-auto flex w-full justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <span>
            {isLoading
              ? 'Loading...'
              : isAuthenticated && !connected
                ? 'Please connect wallet to view your orders'
                : connected && !isAuthenticated
                  ? 'Please sign in to view your orders'
                  : connected && isAuthenticated
                    ? 'No orders found'
                    : 'To view your orders'}
          </span>

          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-9 w-32 rounded bg-muted"></div>
            </div>
          ) : isAuthenticated ? (
            <div className="text-sm text-muted-foreground">
              Your positions will appear here
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
    </div>
  )
}
