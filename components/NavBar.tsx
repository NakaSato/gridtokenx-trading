'use client'
import Link from 'next/link'

import { Button, buttonVariants } from './ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AuthButton } from './auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import WalletSideBar from './WalletSidebar'
import { useTheme } from 'next-themes'
import x from '@/public/svgs/x.svg'
import discord from '@/public/svgs/discord.svg'
import yt from '@/public/svgs/youtube.svg'
import medium from '@/public/images/medium.png'
import telegram from '@/public/svgs/telegram.svg'
import Image from 'next/image'
import { Logo } from './Logo'

import { Badge } from './ui/badge'
import Settings from './Settings'
import Profile from './Profile'
import { ArrowDown, EarnIcon, MoreIcon, WalletIcon } from '@/public/svgs/icons'
import NavBarMobile from './NavBarMobile'
import Notifications from './Notifications'
import PointsDropDown from './PointsDropDown'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/contexts/AuthProvider'
import {
  ArrowUpDown,
  BookOpenText,
  ChartLine,
  ConciergeBell,
  ExternalLink,
  FileChartColumn,
  MessagesSquare,
  TableColumnsSplit,
  User,
} from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const { connected } = useWallet()
  const { isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const routes: Record<string, string> = {
    '/': 'Trade',
    '/futures': 'futures',
    '/earn': 'Earn',
    '/portfolio': 'Portfolio',
    '/analytics': 'Analytics',
    '/options-chain': 'Options Chain',
    '/feedback': 'Feedback',
  }
  const currentPath = pathname?.split('/')[1] || ''
  const [active, setActive] = useState(routes[`/${currentPath}`])

  const handleClick = (state: string) => {
    if (active !== state) {
      setActive(state)
    }
  }

  const open = () => {
    setActive('More')
    setIsOpen(!isOpen)
  }

  return (
    <header className="flex max-w-full justify-between">
      <div className="flex justify-between gap-6 py-2">
        <div className="flex items-center justify-center gap-2 px-1">
          <Logo width={24} height={28} className="mb-1" />
          {/* <h1 className="text-sm font-normal">GridTokenX</h1> */}
        </div>
        <nav className="hidden items-center justify-evenly gap-8 md:flex">
          <Link
            href="/"
            className={cn(
              buttonVariants({
                variant: active === 'Trade' ? 'active' : 'inactive',
              }),
              'group flex h-auto w-auto justify-between gap-1 p-0 hover:text-primary'
            )}
            onClick={() => handleClick('Trade')}
          >
            <ChartLine size={16} />
            <h1 className="text-sm font-medium group-hover:text-primary">
              Trade
            </h1>
            <Badge
              className={cn(
                active === 'Trade'
                  ? 'text-gradient-primary border-primary'
                  : 'border-secondary-foreground text-secondary-foreground',
                'flex h-3 rounded-[2px] border bg-transparent px-1 pt-[3px] text-center group-hover:border-primary group-hover:text-primary'
              )}
            >
              <span className="text-[8px] font-semibold">NEW</span>
            </Badge>
          </Link>
          <Link
            href="/futures"
            className={cn(
              buttonVariants({
                variant: active === 'futures' ? 'active' : 'inactive',
              }),
              'group flex h-auto w-auto justify-between gap-1 p-0 hover:text-primary'
            )}
            onClick={() => handleClick('futures')}
          >
            <ChartLine size={16} />
            <h1 className="text-sm font-medium group-hover:text-primary">
              Futures
            </h1>
            <Badge
              className={cn(
                active === 'futures'
                  ? 'text-gradient-primary border-primary'
                  : 'border-secondary-foreground text-secondary-foreground',
                'flex h-3 rounded-[2px] border bg-transparent px-1 pt-[3px] text-center group-hover:border-primary group-hover:text-primary'
              )}
            >
              <span className="text-[8px] font-semibold">BETA</span>
            </Badge>
          </Link>
          <Link
            href="/earn"
            className={cn(
              buttonVariants({
                variant: active === 'Earn' ? 'active' : 'inactive',
              }),
              'hidden h-auto w-auto justify-between gap-1 p-0 hover:text-primary lg:flex'
            )}
            onClick={() => handleClick('Earn')}
          >
            <EarnIcon />
            <h1 className="text-sm font-medium">Earn</h1>
            <Badge className="h-3 rounded-[2px] border-none bg-gradient-primary px-1 pt-[3px]">
              <span className="text-[8px] font-semibold text-background">
                48% APY
              </span>
            </Badge>
          </Link>

          <Link
            href="/portfolio"
            className={cn(
              buttonVariants({
                variant: active === 'Portfolio' ? 'active' : 'inactive',
              }),
              'hidden h-auto w-auto justify-between gap-1 p-0 hover:text-primary lg:flex'
            )}
            onClick={() => handleClick('Portfolio')}
          >
            <WalletIcon />
            <h1 className="text-sm font-medium">Portfolio</h1>
          </Link>

          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger
              className={`${
                isOpen || active === 'Analytics' || active === 'Options Chain'
                  ? 'text-primary'
                  : 'text-secondary-foreground'
              } hidden h-auto w-auto items-center justify-between gap-1 p-0 hover:text-primary focus:bg-transparent focus:outline-none lg:flex`}
              onClick={() => handleClick('More')}
            >
              <MoreIcon />
              <h1 className="text-sm font-medium">More</h1>
              <ArrowDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-44 rounded-sm text-secondary-foreground"
            >
              {[
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
              ].map((item) => (
                <Link
                  href={`${item.link}`}
                  key={item.name}
                  className="w-full"
                  onClick={() => handleClick(item.name)}
                >
                  <DropdownMenuItem className="cursor-pointer justify-between px-1 py-2 focus:text-primary [&>svg]:size-4">
                    {item.name} {item.icon}
                  </DropdownMenuItem>
                </Link>
              ))}
              <DropdownMenuSeparator />
              {[
                {
                  name: 'Docs',
                  icon: <BookOpenText />,
                  link: 'https://gridtokenx.com',
                },
                {
                  name: 'Feedback',
                  icon: <MessagesSquare />,
                  link: '/feedback',
                },
              ].map((item) => (
                <Link
                  href={`${item.link}`}
                  target={`${item.name === 'Docs' ? '_blank' : ''}`}
                  key={item.name}
                  className="w-full"
                  onClick={() => handleClick(item.name)}
                >
                  <DropdownMenuItem className="cursor-pointer justify-between px-1 py-2 focus:text-primary [&>svg]:size-4">
                    {item.name}
                    <ExternalLink />
                  </DropdownMenuItem>
                </Link>
              ))}
              <DropdownMenuSeparator />
              <div className="flex gap-3 px-1 py-2">
                <a href="https://x.com/" target="_blank">
                  <Image src={x} alt="x link" />
                </a>
                <a href="https://t.me/" target="_blank">
                  <Image src={telegram} alt="telegram link" />
                </a>
                <a href="https://medium.com" target="_blank">
                  <Image src={medium} width={18} height={18} alt="x link" />
                </a>
                <a href="https://youtube.com" target="_blank">
                  <Image src={yt} alt="x link" />
                </a>
                <a href="https://discord.gg/" target="_blank">
                  <Image src={discord} alt="discord link" />
                </a>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
      <div className="flex items-center justify-between gap-3 py-2">
        <PointsDropDown setActive={setActive} />
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
