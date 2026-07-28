'use client'
import {
  Activity,
  ArrowDownUp,
  BookOpenText,
  ChartLine,
  Copy,
  ExternalLink,
  Leaf,
  LogOut,
  MenuIcon,
  MessagesSquare,
  TrendingUp,
  XIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Image, { type StaticImageData } from 'next/image'
import AuthButton from '@/features/auth/components/AuthButton'
import { useState, useMemo } from 'react'
import { WalletIcon } from '@/public/svgs/icons'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { EXTERNAL_LINKS } from '@/lib/links'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/features/auth/provider'
import { useWallet } from '@solana/wallet-adapter-react'
import x from '@/public/svgs/x.svg'
import discord from '@/public/svgs/discord.svg'
import telegram from '@/public/svgs/telegram.svg'
import medium from '@/public/images/medium.png'
import yt from '@/public/svgs/youtube.svg'
import { Logo, LogoWordmark } from '@/components/shared/Logo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import toast from 'react-hot-toast'

const SettingsMobile = dynamic(
  () => import('@/components/shared/SettingsMobile'),
  { ssr: false }
)

// ============================================================================
// Types & Interfaces
// ============================================================================

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: {
    text: string
    variant: 'new' | 'beta' | 'apy'
  }
  requiresAuth?: boolean
  /**
   * Kept out of this sheet. Mirrors the flag of the same name in NavBar — the
   * two lists are separate copies, so a new entry has to be marked in both.
   */
  hideOnMobile?: boolean
}

interface ResourceItem {
  name: string
  icon: React.ReactNode
  link: string
  external?: boolean
}

interface SocialLink {
  name: string
  href: string
  icon: StaticImageData
  width?: number
  height?: number
}

// ============================================================================
// Constants
// ============================================================================

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Trade',
    href: '/',
    icon: <ChartLine size={16} />,
    badge: { text: 'NEW', variant: 'new' },
  },
  {
    name: 'Smart Meter',
    href: '/meter',
    icon: <Activity size={16} />,
    badge: { text: 'BETA', variant: 'beta' },
    requiresAuth: true,
  },
  {
    name: 'Futures',
    href: '/futures',
    icon: <TrendingUp size={16} />,
    badge: { text: 'BETA', variant: 'beta' },
    requiresAuth: true,
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: <WalletIcon />,
    requiresAuth: true,
    hideOnMobile: true,
  },
  {
    name: 'Carbon',
    href: '/carbon-credit',
    icon: <Leaf size={16} />,
    requiresAuth: true,
    hideOnMobile: true,
  },
  {
    name: 'Wallet',
    href: '/wallet',
    icon: <ArrowDownUp size={16} />,
    requiresAuth: true,
    hideOnMobile: true,
  },
]

const RESOURCE_ITEMS: ResourceItem[] = [
  {
    name: 'Docs',
    icon: <BookOpenText size={16} />,
    link: EXTERNAL_LINKS.docs,
    external: true,
  },
  {
    name: 'Feedback',
    icon: <MessagesSquare size={16} />,
    link: '/feedback',
  },
]

const SOCIAL_LINKS: SocialLink[] = [
  { name: 'X (Twitter)', href: EXTERNAL_LINKS.twitter, icon: x },
  { name: 'Telegram', href: EXTERNAL_LINKS.telegram, icon: telegram },
  {
    name: 'Medium',
    href: EXTERNAL_LINKS.medium,
    icon: medium,
    width: 18,
    height: 18,
  },
  { name: 'YouTube', href: EXTERNAL_LINKS.youtube, icon: yt },
  { name: 'Discord', href: EXTERNAL_LINKS.discord, icon: discord },
]

// ============================================================================
// Helper Components
// ============================================================================

interface NavBadgeProps {
  badge: NonNullable<NavItem['badge']>
  isActive: boolean
}

function NavBadge({ badge, isActive }: NavBadgeProps) {
  const { text, variant } = badge

  if (variant === 'apy') {
    return (
      <Badge className="flex h-4 items-center rounded-[3px] border-none bg-gradient-primary px-1">
        <span className="text-[8px] font-semibold leading-none text-background">
          {text}
        </span>
      </Badge>
    )
  }

  return (
    <Badge
      className={cn(
        isActive
          ? 'text-gradient-primary border-primary'
          : 'border-secondary-foreground/60 text-secondary-foreground',
        'flex h-4 items-center rounded-[3px] border bg-transparent px-1'
      )}
    >
      <span className="text-[8px] font-semibold leading-none">{text}</span>
    </Badge>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  )
}

// ============================================================================
// Main Component
// ============================================================================

const truncateAddress = (address: string) =>
  `${address.slice(0, 4)}...${address.slice(-4)}`

export default function NavBarMobile() {
  const [isOpen, setIsOpen] = useState(false)
  const { connected, publicKey, disconnect } = useWallet()
  const { isAuthenticated, user, logout } = useAuth()
  const pathname = usePathname()

  // Same precedence as WalletSidebar: the live adapter key wins over the
  // address the backend has on file.
  const walletAddress = publicKey?.toBase58() || user?.wallet_address
  const hasAccount = isAuthenticated || connected

  // Same rules as the desktop NavBar: exact match first, then the longest
  // route prefix so nested routes keep their entry lit; unknown routes
  // highlight nothing.
  const activeRoute = useMemo(() => {
    if (!pathname) return 'Trade'

    const routes = [
      ...NAV_ITEMS.map((item) => ({ name: item.name, href: item.href })),
      ...RESOURCE_ITEMS.map((item) => ({ name: item.name, href: item.link })),
    ]

    const exactMatch = routes.find((route) => route.href === pathname)
    if (exactMatch) return exactMatch.name

    const prefixMatch = routes
      .filter(
        (route) => route.href !== '/' && pathname.startsWith(`${route.href}/`)
      )
      .sort((a, b) => b.href.length - a.href.length)[0]
    if (prefixMatch) return prefixMatch.name

    return ''
  }, [pathname])

  // hideOnMobile entries are dropped here, not from activeRoute above: a hidden
  // route still has to resolve to a name so nothing else lights up in its place.
  const visibleNavItems = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) => !item.hideOnMobile && (!item.requiresAuth || isAuthenticated)
      ),
    [isAuthenticated]
  )

  const close = () => setIsOpen(false)

  const copyAddress = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    toast.success('Address Copied')
  }

  // Mirrors WalletSidebar: an email session logs out, a bare wallet session
  // just disconnects the adapter.
  const handleSignOut = async () => {
    close()
    if (isAuthenticated) {
      await logout()
      toast.success('Logged Out Successfully')
    } else if (connected) {
      disconnect()
      toast.success('Wallet Disconnected')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        className="rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden"
        aria-label="Open navigation menu"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-secondary/40 text-foreground transition-colors hover:text-primary">
          <MenuIcon size={18} />
        </div>
      </DialogTrigger>
      <DialogContent className="flex h-full w-full flex-col bg-background p-0">
        <DialogTitle className="sr-only">Navigation menu</DialogTitle>

        {/* Header */}
        <div className="flex w-full items-center justify-between border-b border-border/40 px-4 py-3">
          <Link
            href="/"
            aria-label="GridTokenX home"
            onClick={close}
            className="flex items-center justify-center gap-1.5"
          >
            <Logo width={24} height={24} />
            <LogoWordmark />
          </Link>
          <button
            onClick={close}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-secondary/40 text-secondary-foreground transition-colors hover:text-foreground"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Account. The address chip used to sit in the top bar next to the
              hamburger, where it competed with the notification and network
              controls for width. */}
          {hasAccount && (
            <div className="mb-6">
              <SectionLabel>Account</SectionLabel>
              <div className="flex items-center gap-3 rounded-md bg-accent/40 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/60 text-secondary-foreground">
                  <WalletIcon />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-mono text-sm font-medium text-foreground">
                    {walletAddress
                      ? truncateAddress(walletAddress)
                      : (user?.username ?? 'Signed in')}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {walletAddress ? 'Wallet' : user?.email}
                  </span>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  {walletAddress && (
                    <button
                      onClick={copyAddress}
                      aria-label="Copy wallet address"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-secondary-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                    >
                      <Copy size={15} />
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    aria-label={
                      isAuthenticated ? 'Log out' : 'Disconnect wallet'
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md text-secondary-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <nav aria-label="Main navigation" className="flex flex-col gap-1.5">
            {visibleNavItems.map((item) => {
              const isActive = activeRoute === item.name
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={close}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary/60 text-primary'
                      : 'bg-accent/40 text-secondary-foreground hover:bg-secondary/40 hover:text-foreground'
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                  {item.badge && (
                    <NavBadge badge={item.badge} isActive={isActive} />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Resources — flattened; a two-item accordion only hid them. */}
          <div className="mt-6">
            <SectionLabel>Resources</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {RESOURCE_ITEMS.map((item) => {
                const isActive = activeRoute === item.name
                return (
                  <Link
                    key={item.name}
                    href={item.link}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    onClick={close}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-secondary/60 text-primary'
                        : 'bg-accent/40 text-secondary-foreground hover:bg-secondary/40 hover:text-foreground'
                    )}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                    {item.external && (
                      <ExternalLink size={14} className="ml-auto opacity-60" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="mt-6">
            <SettingsMobile />
          </div>
        </div>

        {/* Footer: socials + wallet/connect */}
        <div className="space-y-4 border-t border-border/40 px-4 py-4 pb-8">
          <div
            className="flex items-center justify-center gap-2"
            role="list"
            aria-label="Social media links"
          >
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-secondary/60"
              >
                <Image
                  src={social.icon}
                  alt=""
                  width={social.width || 20}
                  height={social.height || 20}
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>

          {/* Signed-in users get the Account row at the top instead. The old
              connected-but-unauthenticated branch mounted WalletSidebar inside
              this dialog, so closing the menu unmounted the sheet before it
              could open. */}
          {!hasAccount && (
            <div onClick={close}>
              <AuthButton
                signInVariant="default"
                className="h-fit w-full rounded-sm border border-transparent bg-primary px-4 py-[7px] text-background hover:bg-gradient-primary"
                signInText="Connect Wallet"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
