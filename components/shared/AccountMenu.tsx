'use client'

import { useState } from 'react'
import { Copy, Settings as SettingsIcon, User } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/provider'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BoostIcon,
  GrayPointsIcon,
  RankingIcon,
  WalletIcon,
} from '@/public/svgs/icons'
import { POINTS, formatPointsFull } from '@/components/shared/points'

// Static imports are fine here: NavBar loads AccountMenu itself via
// next/dynamic (ssr: false), so these still stay out of the initial bundle.
import Profile from '@/features/auth/components/Profile'
import Settings from '@/components/shared/Settings'
import WalletSideBar from '@/features/wallet/components/WalletSidebar'

function avatarInitial(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim()
  return source ? source[0]!.toUpperCase() : null
}

/** Matches the chip and the mobile menu — 4 leading, 4 trailing. */
function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

/**
 * One avatar trigger replacing the separate points, settings and profile
 * buttons. Those three cost ~120px of header width side by side, which is what
 * pushed the nav labels off a tablet.
 *
 * Profile and Settings render outside the dropdown and are opened by state:
 * a Radix dialog mounted inside the menu would unmount with it before it could
 * appear.
 */
export default function AccountMenu() {
  const { isAuthenticated, user } = useAuth()
  const { publicKey } = useWallet()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)

  const initial = avatarInitial(user?.username, user?.email)
  // Same precedence as the header chip and the mobile menu: the live adapter
  // key wins over the address the session was created with.
  const walletAddress = publicKey?.toBase58() || user?.wallet_address

  const copyAddress = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    toast.success('Address Copied')
  }

  // Close the menu ourselves, then open the dialog, so the two don't race for
  // focus. onCloseAutoFocus is suppressed for the same reason.
  const openDialog = (setOpen: (open: boolean) => void) => (event: Event) => {
    event.preventDefault()
    setMenuOpen(false)
    setOpen(true)
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            menuOpen
              ? 'border-primary bg-secondary text-primary'
              : 'border-border/60 bg-secondary/40 text-secondary-foreground hover:text-foreground'
          )}
        >
          {isAuthenticated && initial ? initial : <User className="h-4 w-4" />}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-64 rounded-md p-2"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          {isAuthenticated && (
            <>
              <div className="flex items-center gap-3 px-2 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-background">
                  {initial ?? <User className="h-4 w-4" />}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {user?.username ?? 'Account'}
                  </span>
                  {user?.email && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="mx-1 my-1 rounded-md border p-3">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-medium text-secondary-foreground">
                    Season 1 Points
                  </span>
                  <span className="text-xl font-medium text-primary">
                    {formatPointsFull(POINTS.season)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-foreground">
                    <BoostIcon />
                    {POINTS.boost}
                  </span>
                </div>
                <Separator className="my-3" />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-secondary-foreground">
                      <RankingIcon />
                      Ranking
                    </span>
                    <span className="text-[11px] font-medium text-foreground">
                      {POINTS.rank}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-secondary-foreground">
                      <GrayPointsIcon />
                      Points Per Day
                    </span>
                    <span className="text-[11px] font-medium text-foreground">
                      {POINTS.perDay}
                    </span>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer gap-2 px-2 py-2"
                onSelect={openDialog(setProfileOpen)}
              >
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
            </>
          )}

          {/* Wallet address. It has its own chip in the header from 2xl; below
              that the chip is hidden and it lives here instead, where it isn't
              competing with the nav for header width. Outside the isAuthenticated
              gate on purpose — a wallet-only session has an address but no JWT. */}
          {walletAddress && (
            <div className="2xl:hidden">
              <DropdownMenuItem
                className="cursor-pointer gap-2 px-2 py-2"
                onSelect={openDialog(setWalletOpen)}
              >
                <WalletIcon />
                <span className="font-mono">
                  {truncateAddress(walletAddress)}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 px-2 py-2"
                onSelect={copyAddress}
              >
                <Copy className="h-4 w-4" />
                Copy address
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>
          )}

          {/* Settings stays available signed out — it owns the theme switcher. */}
          <DropdownMenuItem
            className="cursor-pointer gap-2 px-2 py-2"
            onSelect={openDialog(setSettingsOpen)}
          >
            <SettingsIcon className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isAuthenticated && (
        <Profile open={profileOpen} onOpenChange={setProfileOpen} />
      )}
      <Settings open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Mounted only while open. Kept mounted it would run a second balance
          query and P2P socket alongside the header's own instance, which is
          still there at 2xl — CSS hides the rows above, not the component. */}
      {walletOpen && (
        <WalletSideBar open onOpenChange={setWalletOpen} hideTrigger />
      )}
    </>
  )
}
