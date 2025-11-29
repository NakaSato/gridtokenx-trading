'use client'

import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CopyIcon, LogOutIcon, SendIcon } from '@/public/svgs/icons'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import WalletPortfolio from './WalletPortfolio'
import WalletActivity from './WalletActivity'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/contexts/AuthProvider'
import { useUserBalance } from '@/hooks/useApi'
import { allWallets } from './WalletModal'
import { XIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WalletSideBar() {
  const { wallet, publicKey, disconnect, connected } = useWallet()
  const { user, isAuthenticated, logout, token } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('portfolio')
  const [isOpen, setIsOpen] = useState(false)
  const [iconPath, setIconPath] = useState<string>('')

  // Get balance data using the enhanced hook
  const walletAddress = publicKey?.toBase58()
  const { balance, loading: balanceLoading } = useUserBalance(
    token || undefined,
    walletAddress || undefined
  )
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58())
    }
    toast.success('Address Copied')
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
          {isAuthenticated && user
            ? user.username || user.email
            : publicKey?.toBase58()
              ? truncateAddress(publicKey?.toBase58())
              : 'Connected'}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full space-y-4 rounded-none bg-accent p-6 md:w-[550px] md:rounded-l-sm">
        <SheetTitle className="flex justify-between">
          <div className="flex items-center space-x-2">
            {iconPath && (
              <Image src={iconPath} alt="Wallet Icon" width={20} height={20} />
            )}
            <span className="items-center pt-1 text-base font-medium text-foreground">
              {isAuthenticated && user
                ? user.username || user.email
                : publicKey?.toBase58()
                  ? truncateAddress(publicKey?.toBase58())
                  : 'Connected'}
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
              <span className="animate-pulse text-[28px] font-medium text-foreground">
                Loading...
              </span>
            ) : balance ? (
              <span className="text-[28px] font-medium text-foreground">
                {parseFloat(balance.token_balance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}
              </span>
            ) : (
              <span className="text-[28px] font-medium text-foreground">
                0.00
              </span>
            )}
          </div>
          <div className="flex w-full flex-col space-y-2 rounded-sm bg-background p-4">
            <span className="text-sm font-medium text-secondary-foreground">
              Points
            </span>
            {balanceLoading ? (
              <span className="animate-pulse text-[28px] font-medium text-foreground">
                Loading...
              </span>
            ) : (
              <span className="text-[28px] font-medium text-foreground">
                {balance?.balance_sol
                  ? parseFloat(balance.balance_sol).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })
                  : '10 900'}
              </span>
            )}
          </div>
        </div>
        <div className="flex w-full flex-col space-y-4">
          <Tabs defaultValue={activeTab}>
            <TabsList className="grid h-fit w-full grid-cols-2 rounded-sm bg-accent-foreground p-2">
              <TabsTrigger
                value="portfolio"
                className="rounded-sm border border-transparent px-5 py-[6px] text-sm data-[state=active]:border-primary"
                onClick={() => handleClickTab('portfolio')}
              >
                Portfolio
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-sm border border-transparent px-5 py-[6px] text-sm data-[state=active]:border-primary"
                onClick={() => handleClickTab('activity')}
              >
                Activity
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === 'portfolio' ? <WalletPortfolio /> : <WalletActivity />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
