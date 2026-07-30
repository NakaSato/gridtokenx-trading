'use client'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { CopyIcon, LogOutIcon, SendIcon } from '@/components/shared/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { copyText } from '@/lib/clipboard'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WalletPortfolio from '@/features/wallet/components/WalletPortfolio'
import WalletActivity from '@/features/wallet/components/WalletActivity'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/features/auth/provider'
import { useUserBalance } from '@/features/wallet/hooks/useUserBalance'
import {
  BALANCE_UNAVAILABLE_HINT,
  formatBalance,
} from '@/features/wallet/lib/balance-display'
import { allWallets } from '@/features/auth/components/WalletModal'
import { XIcon, TrendingUp, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useP2POrderUpdates } from '@/features/trading/hooks/useTransactionUpdates'
import { createApiClient } from '@/lib/api-client'
import MultiWalletManager from '@/features/wallet/components/MultiWalletManager'

interface WalletSideBarProps {
  /**
   * Controlled open state. Omit it and the component stays self-contained,
   * driven by its own address chip — that is how the desktop header uses it.
   * Below 2xl the chip is gone and AccountMenu drives the sheet instead.
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Suppress the address chip when something else owns the entry point. */
  hideTrigger?: boolean
}

export default function WalletSideBar({
  open,
  onOpenChange,
  hideTrigger = false,
}: WalletSideBarProps = {}) {
  const { wallet, publicKey, disconnect, connected } = useWallet()
  const { user, isAuthenticated, logout, token } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('portfolio')
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [iconPath, setIconPath] = useState<string>('')

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : uncontrolledOpen
  const setIsOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  // Get balance data using the enhanced hook
  const walletAddress = publicKey?.toBase58() || user?.wallet_address
  const {
    balance,
    loading: balanceLoading,
    error: balanceError,
  } = useUserBalance(token || undefined, walletAddress || undefined)
  // A failed read is not a zero balance — render "—", never "0.00".
  // See features/wallet/lib/balance-display.ts.
  const tokenBalance = balanceError ? null : balance?.token_balance
  const solBalance = balanceError ? null : balance?.balance_sol

  // Active P2P orders from real-time updates
  // Note: Backend WebSocket already filters by authenticated user
  const { activeBuyOrders, activeSellOrders } = useP2POrderUpdates({
    showToasts: true,
  })

  // Fetch active orders count from API
  const [orderCounts, setOrderCounts] = useState({ buy: 0, sell: 0 })

  const fetchOrderCounts = useCallback(async () => {
    if (!token) return
    try {
      const apiClient = createApiClient(token)
      const response = await apiClient.getMyP2POrders()
      if (response.data) {
        // response.data may be an array directly or a nested object like { orders: [...] }
        const raw = response.data as any
        const orders: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.orders)
            ? raw.orders
            : []
        const openOrders = orders.filter((o) => o.status === 'open')
        setOrderCounts({
          buy: openOrders.filter((o) => o.side === 'buy').length,
          sell: openOrders.filter((o) => o.side === 'sell').length,
        })
      }
    } catch (err) {
      console.error('Failed to fetch order counts:', err)
    }
  }, [token])

  useEffect(() => {
    if (isOpen && token) {
      fetchOrderCounts()
    }
  }, [isOpen, token, fetchOrderCounts])
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  const copyAddress = async () => {
    if (!walletAddress) {
      toast.error('No wallet address available')
      return
    }
    // See lib/clipboard: navigator.clipboard is undefined outside a secure
    // context, so calling it directly threw and skipped the toast below.
    const ok = await copyText(walletAddress)
    if (ok) toast.success('Address Copied')
    else toast.error('Could not copy address')
  }
  const handleClickTab = (state: string) => {
    if (activeTab !== state) {
      setActiveTab(state)
    }
  }
  const handleDisconnect = async () => {
    if (isAuthenticated) {
      // If user is authenticated via email/password, logout from auth system
      await logout()
      toast.success('Logged Out Successfully')
    } else if (connected) {
      // If only wallet is connected, disconnect wallet
      disconnect()
      toast.success('Wallet Disconnected')
    }
  }
  useEffect(() => {
    if (wallet) {
      setIconPath(
        allWallets.filter((value) => value.name === wallet.adapter.name)[0]
          .iconPath
      )
    }
  }, [publicKey, connected, wallet])
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <button className="flex h-9 w-full items-center justify-center gap-2 rounded-sm border bg-inherit px-[15px] py-[5px] text-sm text-foreground hover:border-primary hover:bg-primary-foreground">
            {iconPath && (
              <Image
                src={iconPath}
                alt="Wallet Icon"
                width={20}
                height={20}
                className="rounded-full"
              />
            )}
            {walletAddress ? truncateAddress(walletAddress) : 'No Wallet'}
          </button>
        </SheetTrigger>
      )}
      <SheetContent className="w-full space-y-4 rounded-none bg-accent p-6 md:w-[550px] md:rounded-l-sm">
        <SheetTitle className="flex justify-between">
          <div className="flex items-center space-x-2">
            {iconPath && (
              <Image src={iconPath} alt="Wallet Icon" width={20} height={20} />
            )}
            <span className="items-center pt-1 text-base font-medium text-foreground">
              {walletAddress ? truncateAddress(walletAddress) : 'No Wallet'}
            </span>
            <SendIcon />
          </div>
          <div className="flex space-x-3">
            <Button
              className="h-fit rounded-sm bg-secondary p-2 shadow-none"
              onClick={copyAddress}
            >
              <CopyIcon />
            </Button>
            <Button
              className="h-fit rounded-sm bg-secondary p-2 shadow-none"
              onClick={() => handleDisconnect()}
            >
              <LogOutIcon />
            </Button>
            <Button
              className="h-fit rounded-sm bg-secondary p-2 shadow-none md:hidden"
              onClick={() => setIsOpen(false)}
            >
              <XIcon className="text-foreground" />
            </Button>
          </div>
        </SheetTitle>
        <div className="flex w-full justify-between space-x-4">
          <div className="flex w-full flex-col space-y-2 rounded-sm bg-background p-4">
            <span className="text-sm font-medium text-secondary-foreground">
              Tokens
            </span>
            {balanceLoading ? (
              // Sized to the 28px figure it stands in for, so the card doesn't
              // jump when the number lands.
              <Skeleton className="h-[34px] w-32" />
            ) : (
              <span
                className="text-[28px] font-medium text-foreground"
                title={
                  tokenBalance == null ? BALANCE_UNAVAILABLE_HINT : undefined
                }
              >
                {formatBalance(tokenBalance, { maximumFractionDigits: 6 })}
              </span>
            )}
          </div>
          <div className="flex w-full flex-col space-y-2 rounded-sm bg-background p-4">
            <span className="text-sm font-medium text-secondary-foreground">
              SOL
            </span>
            {balanceLoading ? (
              <Skeleton className="h-[34px] w-32" />
            ) : (
              <span
                className="text-[28px] font-medium text-foreground"
                title={
                  solBalance == null ? BALANCE_UNAVAILABLE_HINT : undefined
                }
              >
                {formatBalance(solBalance, { maximumFractionDigits: 6 })}
              </span>
            )}
          </div>
        </div>
        {/* Financial Status - Locked Funds & Energy */}
        {user && (user.locked_amount || user.locked_energy) ? (
          <div className="flex w-full justify-between space-x-4">
            <div className="flex w-full flex-col space-y-2 rounded-sm border border-yellow-500/30 bg-yellow-500/10 p-4">
              <span className="text-sm font-medium text-yellow-500">
                🔒 Locked (Escrow)
              </span>
              <span className="text-[20px] font-medium text-yellow-400">
                ฿
                {(user.locked_amount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex w-full flex-col space-y-2 rounded-sm border border-blue-500/30 bg-blue-500/10 p-4">
              <span className="text-sm font-medium text-blue-500">
                ⚡ Locked Energy
              </span>
              <span className="text-[20px] font-medium text-blue-400">
                {(user.locked_energy || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                kWh
              </span>
            </div>
          </div>
        ) : null}
        {/* Active P2P Orders */}
        {token &&
        (orderCounts.buy > 0 ||
          orderCounts.sell > 0 ||
          activeBuyOrders.length > 0 ||
          activeSellOrders.length > 0) ? (
          <div className="flex w-full justify-between space-x-4">
            <div className="flex w-full flex-col space-y-2 rounded-sm border border-green-500/30 bg-green-500/10 p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  Active Buy Orders
                </span>
              </div>
              <span className="text-[20px] font-medium text-green-400">
                {Math.max(orderCounts.buy, activeBuyOrders.length)}
              </span>
            </div>
            <div className="flex w-full flex-col space-y-2 rounded-sm border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-500">
                  Active Sell Orders
                </span>
              </div>
              <span className="text-[20px] font-medium text-red-400">
                {Math.max(orderCounts.sell, activeSellOrders.length)}
              </span>
            </div>
          </div>
        ) : null}
        <div className="flex w-full flex-col space-y-4">
          <Tabs defaultValue={activeTab}>
            <TabsList className="grid h-fit w-full grid-cols-3 rounded-sm bg-accent-foreground p-2">
              <TabsTrigger
                value="portfolio"
                className="rounded-sm border border-transparent px-2 py-[6px] text-xs data-[state=active]:border-primary"
                onClick={() => handleClickTab('portfolio')}
              >
                Portfolio
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-sm border border-transparent px-2 py-[6px] text-xs data-[state=active]:border-primary"
                onClick={() => handleClickTab('activity')}
              >
                Activity
              </TabsTrigger>
              <TabsTrigger
                value="wallets"
                className="rounded-sm border border-transparent px-2 py-[6px] text-xs data-[state=active]:border-primary"
                onClick={() => handleClickTab('wallets')}
              >
                Wallets
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'portfolio' && <WalletPortfolio />}
            {activeTab === 'activity' && <WalletActivity />}
            {activeTab === 'wallets' && <MultiWalletManager />}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
