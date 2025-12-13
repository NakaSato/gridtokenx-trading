'use client'
import Link from 'next/link'
import { useState, useMemo, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import Image, { type StaticImageData } from 'next/image'
import {
  Activity,
  ArrowUpDown,
  BookOpenText,
  ChartLine,
  ConciergeBell,
  ExternalLink,
  FileChartColumn,
  MessagesSquare,
  TableColumnsSplit,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthProvider'
import { buttonVariants } from './ui/button'
import { Badge } from './ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { AuthButton } from './auth'
import { ArrowDown, EarnIcon, MoreIcon, WalletIcon } from '@/public/svgs/icons'
import { Logo } from './Logo'
import WalletSideBar from './WalletSidebar'
import Settings from './Settings'
import Profile from './Profile'
import NavBarMobile from './NavBarMobile'
import Notifications from './Notifications'
import PointsDropDown from './PointsDropDown'

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
    name: 'P2P Energy',
    href: '/p2p',
    icon: <ArrowUpDown size={16} />,
    badge: { text: 'BETA', variant: 'new' },
  },
  {
    name: 'Smart Meter',
    href: '/meter',
    icon: <Activity size={16} />,
  },
  {
    name: 'Futures',
    href: '/futures',
    icon: <ChartLine size={16} />,
    badge: { text: 'BETA', variant: 'beta' },
  },
  {
    name: 'Earn',
    href: '/earn',
    icon: <EarnIcon />,
    badge: { text: '48% APY', variant: 'apy' },
    hideOnMobile: true,
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: <WalletIcon />,
    hideOnMobile: true,
  },
]

const DROPDOWN_NAV_ITEMS: DropdownItem[] = [
  {
    name: 'Options Chain',
    icon: <TableColumnsSplit />,
    link: '/options-chain',
  },
  {
    name: 'MoonRekt',
    icon: <ArrowUpDown />,
    link: '/moonrekt',
  },
  {
    name: 'Borrow',
    icon: <ConciergeBell />,
    link: '/borrow',
  },
  {
    name: 'Analytics',
    icon: <FileChartColumn />,
    link: '/analytics',
  },
]

const DROPDOWN_EXTERNAL_ITEMS: DropdownItem[] = [
  {
    name: 'Docs',
    icon: <BookOpenText />,
    link: 'https://gridtokenx.com',
    external: true,
  },
  {
    name: 'Feedback',
    icon: <MessagesSquare />,
    link: '/feedback',
  },
]

const SOCIAL_LINKS: SocialLink[] = [
  { name: 'X (Twitter)', href: 'https://x.com/', icon: x },
  { name: 'Telegram', href: 'https://t.me/', icon: telegram },
  { name: 'Medium', href: 'https://medium.com', icon: medium, width: 18, height: 18 },
  { name: 'YouTube', href: 'https://youtube.com', icon: yt },
  { name: 'Discord', href: 'https://discord.gg/', icon: discord },
]

// ============================================================================
// Helper Components
// ============================================================================

interface NavLinkProps {
  item: NavItem
  isActive: boolean
  onClick: () => void
}

function NavLink({ item, isActive, onClick }: NavLinkProps) {
  const { name, href, icon, badge, hideOnMobile } = item

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({
          variant: isActive ? 'active' : 'inactive',
        }),
        'group flex h-auto w-auto justify-between gap-1 p-0 hover:text-primary',
        hideOnMobile && 'hidden lg:flex'
      )}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon}
      <h1 className="text-sm font-medium group-hover:text-primary">{name}</h1>
      {badge && <NavBadge badge={badge} isActive={isActive} />}
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
      <Badge className="h-3 rounded-[2px] border-none bg-gradient-primary px-1 pt-[3px]">
        <span className="text-[8px] font-semibold text-background">{text}</span>
      </Badge>
    )
  }

  return (
    <Badge
      className={cn(
        isActive
          ? 'text-gradient-primary border-primary'
          : 'border-secondary-foreground text-secondary-foreground',
        'flex h-3 rounded-[2px] border bg-transparent px-1 pt-[3px] text-center group-hover:border-primary group-hover:text-primary'
      )}
    >
      <span className="text-[8px] font-semibold">{text}</span>
    </Badge>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function NavBar() {
  const pathname = usePathname()
  const { connected } = useWallet()
  const { isAuthenticated } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<string>('')

  // Derive active state from pathname
  const activeRoute = useMemo(() => {
    if (!pathname) return 'Trade'

    // Check exact matches first
    const exactMatch = NAV_ITEMS.find((item) => item.href === pathname)
    if (exactMatch) return exactMatch.name

    // Check dropdown items
    const dropdownMatch = [...DROPDOWN_NAV_ITEMS, ...DROPDOWN_EXTERNAL_ITEMS].find(
      (item) => item.link === pathname
    )
    if (dropdownMatch) return dropdownMatch.name

    // Default to Trade for home
    return 'Trade'
  }, [pathname])

  const isDropdownItemActive = useMemo(() => {
    return [...DROPDOWN_NAV_ITEMS, ...DROPDOWN_EXTERNAL_ITEMS].some(
      (item) => item.name === activeRoute
    )
  }, [activeRoute])

  return (
    <header className="flex max-w-full justify-between">
      <div className="flex justify-between gap-6 py-2">
        <div className="flex items-center justify-center gap-2 px-1">
          <Logo width={24} height={28} className="mb-1" />
        </div>

        <nav className="hidden items-center justify-evenly gap-8 md:flex" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.name}
              item={item}
              isActive={activeRoute === item.name}
              onClick={() => setActiveItem(item.name)}
            />
          ))}

          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger
              className={cn(
                isDropdownOpen || isDropdownItemActive
                  ? 'text-primary'
                  : 'text-secondary-foreground',
                'hidden h-auto w-auto items-center justify-between gap-1 p-0 hover:text-primary focus:bg-transparent focus:outline-none lg:flex'
              )}
              aria-label="More navigation options"
            >
              <MoreIcon />
              <h1 className="text-sm font-medium">More</h1>
              <ArrowDown />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="w-44 rounded-sm text-secondary-foreground"
            >
              {DROPDOWN_NAV_ITEMS.map((item) => (
                <Link
                  href={item.link}
                  key={item.name}
                  className="w-full"
                  onClick={() => setActiveItem(item.name)}
                >
                  <DropdownMenuItem className="cursor-pointer justify-between px-1 py-2 focus:text-primary [&>svg]:size-4">
                    {item.name} {item.icon}
                  </DropdownMenuItem>
                </Link>
              ))}

              <DropdownMenuSeparator />

              {DROPDOWN_EXTERNAL_ITEMS.map((item) => (
                <Link
                  href={item.link}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  key={item.name}
                  className="w-full"
                  onClick={() => setActiveItem(item.name)}
                >
                  <DropdownMenuItem className="cursor-pointer justify-between px-1 py-2 focus:text-primary [&>svg]:size-4">
                    {item.name}
                    {item.external ? <ExternalLink /> : item.icon}
                  </DropdownMenuItem>
                </Link>
              ))}

              <DropdownMenuSeparator />

              <div className="flex gap-3 px-1 py-2" role="list" aria-label="Social media links">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
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

      <div className="flex items-center justify-between gap-3 py-2">
        <PointsDropDown setActive={setActiveItem} />
        <Settings />
        <Profile />
        <Notifications />

        {connected || isAuthenticated ? (
          <WalletSideBar />
        ) : (
          <AuthButton
            signInVariant="default"
            className="h-fit w-full rounded-sm border border-transparent bg-primary px-4 py-[7px] text-background hover:bg-gradient-primary"
            signInText="Connect"
          />
        )}
        <NavBarMobile />
      </div>
    </header>
  )
}
