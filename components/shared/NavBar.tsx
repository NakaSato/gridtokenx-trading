'use client'
import Link from 'next/link'
import { useState, useMemo, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import Image, { type StaticImageData } from 'next/image'
import {
  Activity,
  ArrowDownUp,
  BookOpenText,
  ChartLine,
  ExternalLink,
  Leaf,
  Menu as MenuIcon,
  MessagesSquare,
  PanelBottom,
  PanelLeft,
  PanelRight,
  TrendingUp,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { EXTERNAL_LINKS } from '@/lib/links'
import { useAuth } from '@/features/auth/provider'
import { useSidebar } from '@/components/shared/SidebarContext'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AuthButton from '@/features/auth/components/AuthButton'
import { ArrowDown, MoreIcon, WalletIcon } from '@/public/svgs/icons'
import { Logo, LogoWordmark } from '@/components/shared/Logo'
import dynamic from 'next/dynamic'
import NavBarMobile from '@/components/shared/NavBarMobile'
import { NetworkStatus } from '@/components/shared/NetworkStatus'

// Dynamic Imports for Header Performance
const WalletSideBar = dynamic(
  () => import('@/features/wallet/components/WalletSidebar'),
  { ssr: false }
)
const Notifications = dynamic(
  () => import('@/features/notifications/components/Notifications'),
  { ssr: false }
)
const AccountMenu = dynamic(() => import('@/components/shared/AccountMenu'), {
  ssr: false,
})

import x from '@/public/svgs/x.svg'
import discord from '@/public/svgs/discord.svg'
import yt from '@/public/svgs/youtube.svg'
import medium from '@/public/images/medium.png'
import telegram from '@/public/svgs/telegram.svg'

// ============================================================================
// Types & Interfaces
// ============================================================================

interface NavItem {
  name: string
  href: string
  icon: ReactNode
  badge?: {
    text: string
    variant: 'new' | 'beta' | 'apy'
    value?: string
  }
  hideOnMobile?: boolean
  requiresAuth?: boolean
}

interface DropdownItem {
  name: string
  icon: ReactNode
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
    hideOnMobile: true,
    requiresAuth: true,
  },
  {
    name: 'Carbon',
    href: '/carbon-credit',
    icon: <Leaf size={16} />,
    hideOnMobile: true,
    requiresAuth: true,
  },
  {
    name: 'Wallet',
    href: '/wallet',
    icon: <ArrowDownUp size={16} />,
    hideOnMobile: true,
    requiresAuth: true,
  },
]

const DROPDOWN_EXTERNAL_ITEMS: DropdownItem[] = [
  {
    name: 'Docs',
    icon: <BookOpenText />,
    link: EXTERNAL_LINKS.docs,
    external: true,
  },
  {
    name: 'Feedback',
    icon: <MessagesSquare />,
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

interface NavLinkProps {
  item: NavItem
  isActive: boolean
}

function NavLink({ item, isActive }: NavLinkProps) {
  const { name, href, icon, badge } = item

  return (
    <Link
      href={href}
      // Rendered only from 2xl, where six labelled items plus the brand and the
      // right-hand controls measurably fit (~1500px of header). Below that the
      // tablet dropdown carries these same entries. Badges wait for the custom
      // `desktop` (1800px) screen.
      title={name}
      className={cn(
        'group flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-secondary/60 text-primary'
          : 'text-secondary-foreground hover:bg-secondary/40 hover:text-foreground'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon}
      <span>{name}</span>
      {badge && (
        <span className="hidden 2xl:flex">
          <NavBadge badge={badge} isActive={isActive} />
        </span>
      )}
    </Link>
  )
}

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
        'flex h-4 items-center rounded-[3px] border bg-transparent px-1 group-hover:border-primary group-hover:text-primary'
      )}
    >
      <span className="text-[8px] font-semibold leading-none">{text}</span>
    </Badge>
  )
}

interface PanelToggleProps {
  shown: boolean
  onToggle: () => void
  label: string
  children: ReactNode
}

/** One segmented-group button per layout panel; pressed = panel visible. */
function PanelToggle({ shown, onToggle, label, children }: PanelToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={shown}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors',
        shown
          ? 'bg-secondary text-primary shadow-inner'
          : 'text-secondary-foreground hover:bg-secondary/50 hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function NavBar() {
  const pathname = usePathname()
  const { connected } = useWallet()
  const { isAuthenticated } = useAuth()
  const {
    showLeftSidebar,
    showRightSidebar,
    showPositionsPanel,
    toggleLeftSidebar,
    toggleRightSidebar,
    togglePositionsPanel,
  } = useSidebar()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.requiresAuth || isAuthenticated),
    [isAuthenticated]
  )

  // Derive active state from pathname: exact match first, then the longest
  // route prefix so nested routes (/futures/abc) keep their tab lit. Unknown
  // routes highlight nothing — they used to fall back to "Trade".
  const activeRoute = useMemo(() => {
    if (!pathname) return 'Trade'

    const routes = [
      ...NAV_ITEMS.map((item) => ({ name: item.name, href: item.href })),
      ...DROPDOWN_EXTERNAL_ITEMS.map((item) => ({
        name: item.name,
        href: item.link,
      })),
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

  const isDropdownItemActive = useMemo(() => {
    return DROPDOWN_EXTERNAL_ITEMS.some((item) => item.name === activeRoute)
  }, [activeRoute])

  return (
    <header className="flex h-14 max-w-full items-center justify-between gap-3 border-b border-border/40">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6">
        <Link
          href="/"
          aria-label="GridTokenX home"
          className="flex shrink-0 items-center gap-1.5 px-1"
        >
          {/* Square box, no margin: the viewBox is 70x70, so a 24x28 viewport
              letterboxed the mark and the mb-1 pushed it off the text's centre. */}
          <Logo width={24} height={24} />
          <LogoWordmark className="whitespace-nowrap" />
        </Link>

        {/* 2xl-gated as a whole: below that everything it holds is hidden, and an
            empty nav still ate a gap slot next to the wordmark. */}
        <nav
          className="hidden items-center gap-1 2xl:flex"
          aria-label="Main navigation"
        >
          {/* 2xl and up: the links have room to sit inline. Below that the
              tablet dropdown in the right-hand control cluster carries them. */}
          <div className="hidden items-center gap-1 2xl:flex">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.name}
                item={item}
                isActive={activeRoute === item.name}
              />
            ))}
          </div>

          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger
              className={cn(
                // Only at 2xl — below that the tablet dropdown already carries
                // these entries.
                'hidden h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring 2xl:flex',
                isDropdownOpen || isDropdownItemActive
                  ? 'bg-secondary/60 text-primary'
                  : 'text-secondary-foreground hover:bg-secondary/40 hover:text-foreground'
              )}
              title="More"
              aria-label="More navigation options"
            >
              <MoreIcon />
              <span>More</span>
              <span
                className={cn(
                  'transition-transform duration-200',
                  isDropdownOpen && 'rotate-180'
                )}
              >
                <ArrowDown />
              </span>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="w-48 rounded-md text-secondary-foreground"
            >
              {DROPDOWN_EXTERNAL_ITEMS.map((item) => (
                <DropdownMenuItem
                  key={item.name}
                  asChild
                  className="cursor-pointer justify-between px-2 py-2 focus:text-primary [&>svg]:size-4"
                >
                  <Link
                    href={item.link}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                  >
                    {item.name}
                    {item.external ? <ExternalLink /> : item.icon}
                  </Link>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <div
                className="flex gap-1 px-1 py-1"
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
                    className="flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors hover:bg-secondary/60"
                  >
                    <Image
                      src={social.icon}
                      alt=""
                      width={social.width}
                      height={social.height}
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div
          className="hidden items-center gap-0.5 rounded-md border border-border/60 p-0.5 sm:flex"
          role="group"
          aria-label="Layout panels"
        >
          <PanelToggle
            shown={showLeftSidebar}
            onToggle={toggleLeftSidebar}
            label="Left sidebar"
          >
            <PanelLeft size={15} />
          </PanelToggle>
          <PanelToggle
            shown={showRightSidebar}
            onToggle={toggleRightSidebar}
            label="Right sidebar"
          >
            <PanelRight size={15} />
          </PanelToggle>
          <PanelToggle
            shown={showPositionsPanel}
            onToggle={togglePositionsPanel}
            label="Positions panel"
          >
            <PanelBottom size={15} />
          </PanelToggle>
        </div>

        <NetworkStatus />

        {isAuthenticated && <Notifications />}

        {/* Profile and settings collapsed into one avatar trigger. */}
        <AccountMenu />

        {/* Tablet range: one labelled dropdown, trailing the avatar at the far
            right of the controls. Inline icon-only links were unreadable without
            their labels, and the labels themselves only fit from 2xl. */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger
            className={cn(
              'hidden h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring md:flex 2xl:hidden',
              isMenuOpen
                ? 'bg-secondary/60 text-primary'
                : 'text-secondary-foreground hover:bg-secondary/40 hover:text-foreground'
            )}
            aria-label="Main menu"
          >
            <MenuIcon size={16} />
            <span>{activeRoute || 'Menu'}</span>
            <span
              className={cn(
                'transition-transform duration-200',
                isMenuOpen && 'rotate-180'
              )}
            >
              <ArrowDown />
            </span>
          </DropdownMenuTrigger>

          {/* align="end": the trigger sits against the right edge, so a
              start-aligned panel would hang off the viewport at 768px. */}
          <DropdownMenuContent align="end" className="w-56 rounded-md p-1">
            {visibleNavItems.map((item) => {
              const isActive = activeRoute === item.name
              return (
                <DropdownMenuItem
                  key={item.name}
                  asChild
                  className={cn(
                    'cursor-pointer gap-2 px-2 py-2',
                    isActive && 'text-primary'
                  )}
                >
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto">
                        <NavBadge badge={item.badge} isActive={isActive} />
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
              )
            })}

            <DropdownMenuSeparator />

            {DROPDOWN_EXTERNAL_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item.name}
                asChild
                className="cursor-pointer justify-between px-2 py-2 focus:text-primary [&>svg]:size-4"
              >
                <Link
                  href={item.link}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                >
                  {item.name}
                  {item.external ? <ExternalLink /> : item.icon}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {connected || isAuthenticated ? (
          // Only from 2xl. On tablets the address moved into AccountMenu, and
          // below md into the mobile menu's Account row — see NavBarMobile.
          <div className="hidden 2xl:block">
            <WalletSideBar />
          </div>
        ) : (
          <AuthButton
            signInVariant="default"
            className="h-fit w-full whitespace-nowrap rounded-sm border border-transparent bg-primary px-2 py-[7px] text-sm text-background hover:bg-gradient-primary sm:px-4"
            signInText="Connect"
          />
        )}
        <NavBarMobile />
      </div>
    </header>
  )
}
