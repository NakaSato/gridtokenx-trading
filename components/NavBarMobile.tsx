import {
  Activity,
  ArrowUpDown,
  BookOpenText,
  ChartLine,
  ChevronDown,
  ChevronUp,
  FileChartColumn,
  MenuIcon,
  MessagesSquare,
  TableColumnsSplit,
  User,
  Wallet,
  XIcon,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import Image from 'next/image'
import { Button, buttonVariants } from './ui/button'
import { AuthButton } from './auth'
import { useState } from 'react'
import { EarnIcon, MoreIcon } from '@/public/svgs/icons'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'
import { EXTERNAL_LINKS } from '@/lib/links'
import { useRouter } from 'next/navigation'
import { Separator } from './ui/separator'
import { useAuth } from '@/contexts/AuthProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import x from '@/public/svgs/x.svg'
import discord from '@/public/svgs/discord.svg'
import telegram from '@/public/svgs/telegram.svg'
import { Logo } from './Logo'
import dynamic from 'next/dynamic'

const SettingsMobile = dynamic(() => import('./SettingsMobile'), { ssr: false })
const WalletSideBar = dynamic(() => import('./WalletSidebar'), { ssr: false })

export default function NavBarMobile() {
  const [isOpen, setIsOpen] = useState(false)
  const [active, setActive] = useState<string>('Trade')
  const [isDropped, setIsDropped] = useState(false)
  const { connected } = useWallet()
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const handleClick = (state: string) => {
    if (active !== state) {
      setActive(state)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="focus:outline-none md:hidden" aria-label="Open navigation menu">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-secondary text-foreground hover:text-primary">
          <MenuIcon size={18} />
        </div>
      </DialogTrigger>
      <DialogContent className="flex h-full w-full flex-col justify-between bg-background p-0">
        <DialogTitle className="hidden">Navigation Menu</DialogTitle>
        <div className="flex w-full flex-col space-y-4 p-0">
          <div className="flex w-full items-center justify-between px-3 py-2">
            <div className="flex h-[28px] w-[78px] items-center px-[6px] py-1">
              <Logo width={65} height={21} />
            </div>
            <Button
              className="rounded-sm bg-secondary p-[9px] shadow-none [&_svg]:size-[18px]"
              onClick={() => setIsOpen(false)}
            >
              <XIcon size={18} className="text-secondary-foreground" />
            </Button>
          </div>

          <div className="flex w-full flex-col space-y-3 px-3">
            <Button
              className={cn(
                buttonVariants({
                  variant: active === 'Trade' ? 'active' : 'inactive',
                }),
                'justify-start rounded-sm bg-accent px-5 py-3 md:hidden lg:flex'
              )}
              onClick={() => {
                handleClick('Trade')
                router.push('/')
                setIsOpen(false)
              }}
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
                  'flex h-4 rounded-[3px] border bg-transparent px-1 py-[3px] text-center text-[8px] group-hover:border-primary group-hover:text-primary'
                )}
              >
                NEW
              </Badge>
            </Button>
            <Button
              className={cn(
                buttonVariants({
                  variant: active === 'Futures' ? 'active' : 'inactive',
                }),
                'justify-start rounded-sm bg-accent px-5 py-3 md:hidden lg:flex'
              )}
              onClick={() => {
                handleClick('Futures')
                router.push('/futures')
                setIsOpen(false)
              }}
            >
              <ChartLine size={16} />
              <h1 className="text-sm font-medium group-hover:text-primary">
                Futures
              </h1>
              <Badge
                className={cn(
                  active === 'Futures'
                    ? 'text-gradient-primary border-primary'
                    : 'border-secondary-foreground text-secondary-foreground',
                  'flex h-4 rounded-[3px] border bg-transparent px-1 py-[3px] text-center text-[8px] group-hover:border-primary group-hover:text-primary'
                )}
              >
                BETA
              </Badge>
            </Button>
            <Button
              className={cn(
                buttonVariants({
                  variant: active === 'Meter' ? 'active' : 'inactive',
                }),
                'flex justify-start rounded-sm bg-accent px-5 py-3'
              )}
              onClick={() => {
                handleClick('Meter')
                router.push('/meter')
                setIsOpen(false)
              }}
            >
              <Activity size={16} />
              <h1 className="text-sm font-medium text-nowrap">Smart Meter</h1>
              <Badge
                className={cn(
                  active === 'Meter'
                    ? 'text-gradient-primary border-primary'
                    : 'border-secondary-foreground text-secondary-foreground',
                  'flex h-4 rounded-[3px] border bg-transparent px-1 py-[3px] text-center text-[8px] group-hover:border-primary group-hover:text-primary'
                )}
              >
                BETA
              </Badge>
            </Button>
            <Button
              className={cn(
                buttonVariants({
                  variant: active === 'Earn' ? 'active' : 'inactive',
                }),
                'flex justify-start rounded-sm bg-accent px-5 py-3'
              )}
              onClick={() => {
                handleClick('Earn')
                router.push('/earn')
                setIsOpen(false)
              }}
            >
              <EarnIcon />
              <h1 className="text-sm font-medium">Earn</h1>
              <Badge className="h-4 rounded-sm border-none bg-gradient-primary px-1 py-[3px] text-[8px] text-background">
                48% APY
              </Badge>
            </Button>
            <Button
              className={cn(
                buttonVariants({
                  variant: active === 'Portfolio' ? 'active' : 'inactive',
                }),
                'flex justify-start rounded-sm bg-accent px-5 py-3'
              )}
              onClick={() => {
                handleClick('Portfolio')
                router.push('/portfolio')
                setIsOpen(false)
              }}
            >
              <Wallet size={16} />
              <h1 className="text-sm font-medium">Portfolio</h1>
            </Button>
            <div className="w-full rounded-sm bg-accent p-0">
              <Button
                className="flex w-full justify-between rounded-sm bg-accent px-5 py-3 text-secondary-foreground shadow-none"
                onClick={() => setIsDropped(!isDropped)}
              >
                <div className="flex items-center space-x-2">
                  <MoreIcon />
                  <h1 className="text-sm font-medium">More</h1>
                </div>
                {isDropped ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </Button>
              {isDropped && (
                <>
                  {[
                    {
                      name: 'Options Chain',
                      icon: <TableColumnsSplit />,
                      link: '/options-chain',
                    },
                    {
                      name: 'Analytics',
                      icon: <FileChartColumn />,
                      link: '/analytics',
                    },
                    {
                      name: 'Docs',
                      icon: <BookOpenText />,
                      link: EXTERNAL_LINKS.docs,
                    },
                    {
                      name: 'Feedback',
                      icon: <MessagesSquare />,
                      link: '/feedback',
                    },
                    {
                      name: 'Medium',
                      icon: <TableColumnsSplit />,
                      link: EXTERNAL_LINKS.medium,
                    },
                    {
                      name: 'X',
                      icon: <Image src={x} alt="x link" />,
                      link: EXTERNAL_LINKS.twitter,
                    },
                    {
                      name: 'Telegram',
                      icon: <Image src={telegram} alt="telegram link" />,
                      link: EXTERNAL_LINKS.telegram,
                    },
                    {
                      name: 'Discord',
                      icon: <Image src={discord} alt="discord link" />,
                      link: EXTERNAL_LINKS.discord,
                    },
                  ].map((item, idx) => (
                    <div
                      className="flex w-full flex-col px-5 py-3 pt-0 text-sm text-secondary-foreground"
                      key={idx}
                    >
                      <Separator className="mb-3" />
                      <Button
                        variant={'ghost'}
                        className="h-fit w-fit justify-start gap-2 p-0"
                        onClick={() => {
                          router.push(item.link)
                          setIsOpen(false)
                        }}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </div>
            <SettingsMobile />
          </div>
        </div>
        {/* Only show wallet/connect section when NOT authenticated */}
        {!isAuthenticated && (
          <div className="w-full px-3 pb-10">
            {connected ? (
              <div onClick={() => setIsOpen(false)}>
                <WalletSideBar />
              </div>
            ) : (
              <div onClick={() => setIsOpen(false)}>
                <AuthButton
                  signInVariant="default"
                  className="h-fit w-full rounded-sm border border-transparent bg-primary px-4 py-[7px] text-background hover:bg-gradient-primary"
                  signInText="Connect Wallet"
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
