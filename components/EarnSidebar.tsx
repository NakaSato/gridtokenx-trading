'use client'
import { useContext, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { SheetContent, SheetHeader, SheetTitle } from './ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

import usdc from '@/public/images/usdc.png'
import Image from 'next/image'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import {
  connection,
  LP_DECIMALS,
  THB_DECIMALS,
  THB_MINT,
  USDC_DECIMALS,
  USDC_MINT,
  WSOL_DECIMALS,
  WSOL_MINT,
} from '@/utils/const'
import { ContractContext } from '@/contexts/contractProvider'
import {
  AnchorProvider,
  getProvider,
  Program,
  Provider,
} from '@coral-xyz/anchor'
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react'
import { OptionContract } from '@/lib/idl/option_contract'
import { getPythPrice, usePythPrice } from '@/hooks/usePythPrice'
import { useCustodies } from '@/hooks/useOptions'
import { ChartStrategy } from './ChartStrategy'
import { PublicKey } from '@solana/web3.js'
import CardTokenList from './CardTokenList'
import PoolDropdown from './PoolDropDown'
import { ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { TooltipIcon } from '@/public/svgs/icons'

interface EarnSidebarProps {
  name: string
  symbol: string
  logo: string
  apy: number
  apr: number
}

export default function EarnSidebar({
  name,
  symbol,
  logo,
  apy,
  apr,
}: EarnSidebarProps) {
  // Determine if we are engaged with USDC or THB pool based on symbol prop
  const isTHB = symbol === 'THB' || name.includes('THB');
  const QUOTE_MINT = isTHB ? THB_MINT : USDC_MINT;
  const QUOTE_DECIMALS = isTHB ? THB_DECIMALS : USDC_DECIMALS;
  const POOL_NAME = isTHB ? 'SOL-THB' : 'SOL-USDC';

  const poolData = (
    pooldata: Map<string, any>,
    ratioData: Map<string, any>,
    price: number
  ) => {
    // Safety check if data is loaded
    if (!pooldata || !ratioData || pooldata.size === 0) return []

    const solCustodyData = pooldata.get(WSOL_MINT.toBase58())
    const quoteCustodyData = pooldata.get(QUOTE_MINT.toBase58())

    if (!solCustodyData || !quoteCustodyData) return []

    const solPoolsize =
      solCustodyData.tokenOwned.toNumber() / 10 ** WSOL_DECIMALS
    const quotePoolsize =
      quoteCustodyData.tokenOwned.toNumber() / 10 ** QUOTE_DECIMALS
    const total = solPoolsize * price + quotePoolsize
    return [
      {
        img: logo,
        symbol: 'SOL',
        name: name,
        poolSize: `${solPoolsize} SOL`,
        current_weightage: `${Math.round(
          ((solPoolsize * price) / total) * 100
        )}%`,
        target_weightage: `${ratioData
          .get(WSOL_MINT.toBase58())
          .target.toNumber()}%`,
        utilization: `${Math.round(
          (solCustodyData.tokenLocked.toNumber() /
            solCustodyData.tokenOwned.toNumber()) *
          100
        ) ?? 0
          }%`,
      },
      {
        img: isTHB ? '/images/thb.png' : usdc,
        symbol: isTHB ? 'THB' : 'USDC',
        name: isTHB ? 'Thai Baht' : 'USD Coin',
        poolSize: `${quotePoolsize} ${isTHB ? 'THB' : 'USDC'}`,
        current_weightage: `${100 - Math.round(((solPoolsize * price) / total) * 100)
          }%`,
        target_weightage: `${ratioData
          .get(QUOTE_MINT.toBase58())
          .target.toNumber()}%`,
        utilization: `${Math.round(
          quoteCustodyData.tokenLocked.toNumber() /
          quoteCustodyData.tokenOwned.toNumber()
        ) ?? 0
          }%`,
      },
    ]
  }

  const sc = useContext(ContractContext)
  const [activeTab, setActiveTab] = useState<string>('mint')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<number>(0)
  const [isApr, setIsApr] = useState<boolean>(false)
  const [poolDatas, setPoolDatas] = useState<any>()
  const [tokenAmount, setTokenAmount] = useState<number>(0)
  const { connected, publicKey } = useWallet()
  const wallet = useAnchorWallet()
  const { data: custodies, isLoading: custodiesLoading } = useCustodies(sc.program, publicKey)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  const handleClickToken = (value: number) => {
    if (selectedToken !== value) {
      setSelectedToken(value)
    }
    setIsOpen(false)
  }
  useEffect(() => {
    ; (async () => {
      if (custodies && connected) {
        const price = await getPythPrice('Crypto.SOL/USD', Date.now())
        // For now, passing empty ratios Map as current useCustodies doesn't provide them yet
        setPoolDatas(poolData(custodies, new Map(), price))
      }
    })()
  }, [connected, poolData, custodies])

  const onSubmit = () => {
    if (connected) {
      if (activeTab == 'mint') {
        if (selectedToken == 0) {
          sc.onAddLiquidity(
            tokenAmount * 10 ** WSOL_DECIMALS,
            sc.program,
            WSOL_MINT,
            POOL_NAME
          )
        } else {
          sc.onAddLiquidity(
            tokenAmount * 10 ** QUOTE_DECIMALS,
            sc.program,
            QUOTE_MINT,
            POOL_NAME
          )
        }
      } else if (activeTab == 'redeem') {
        if (selectedToken == 0) {
          sc.onRemoveLiquidity(
            tokenAmount * 10 ** LP_DECIMALS,
            sc.program,
            WSOL_MINT,
            POOL_NAME
          )
        } else {
          sc.onRemoveLiquidity(
            tokenAmount * 10 ** LP_DECIMALS,
            sc.program,
            QUOTE_MINT,
            POOL_NAME
          )
        }
      }
    }
  }

  const handleTokenAmount = (value: string) => {
    setTokenAmount(parseFloat(value))
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  setTimeout(() => {
    setLoading(!loading)
  }, 2000)

  return (
    <SheetContent className="w-full space-y-6 overflow-y-auto rounded-sm bg-accent md:w-[720px]">
      <SheetHeader>
        <SheetTitle className="flex justify-between text-2xl">
          {name} Liquidity Pool
        </SheetTitle>
      </SheetHeader>
      <div className="flex w-full flex-col space-y-5">
        <div className="grid grid-cols-1 items-center space-y-3 sm:grid-cols-5 sm:space-x-3 sm:space-y-0">
          <div className="h-full rounded-sm border p-3 sm:col-span-2">
            <div className="flex flex-col justify-between">
              <div className="flex space-x-1 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild className="cursor-pointer">
                        <div className="flex pb-[1.5px]">
                          <TooltipIcon />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-secondary-foreground">
                    {isApr ? 'APR' : 'APY'}:
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      asChild
                      onClick={() => setIsApr(!isApr)}
                      className="cursor-pointer"
                    >
                      <span className="text-right text-foreground">
                        {isApr ? `${apr}` : `${apy}`}%
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="">
                      <span className="text-right text-background">
                        Click to toggle between APR / APY
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2 text-xs font-normal text-secondary-foreground">
                <span>Last updated at:</span>
                <span>11.12.2024</span>
              </div>
            </div>
            <div className="my-2 h-[1px] w-full border-b" />
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 text-base font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-inherit ring-2 ring-border">
                  <Image
                    src={logo}
                    alt={name}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full"
                  />
                </div>
                <span className="whitespace-nowrap">{name} Pool</span>
              </div>
              <div className="flex w-full">
                <p className="text-justify text-sm tracking-tight">
                  The {name} Liquidity Pool ({symbol}-LP) is a liquidity pool
                  that sells covered calls and cash secured puts.
                </p>
              </div>
            </div>
          </div>
          <div className="h-fit rounded-sm border p-2 sm:col-span-3">
            <div className="flex w-full items-center justify-center space-x-2">
              <span className="text-sm">Liquidity Pool Price Chart</span>
              <button
                className="hover:text-primary"
                onClick={() => router.push('/analytics/pool-metrics')}
              >
                <ExternalLink size={14} />
              </button>
            </div>
            <ChartStrategy />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-normal text-secondary-foreground">
            Total Value Locked
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-medium text-foreground">
              {/* TVL goes here */}
            </span>
            <div className="flex items-center gap-2 text-xs font-normal text-foreground">
              <span>AUM limit: N/A</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M7.99984 14.6665C11.6732 14.6665 14.6665 11.6732 14.6665 7.99984C14.6665 4.3265 11.6732 1.33317 7.99984 1.33317C4.3265 1.33317 1.33317 4.3265 1.33317 7.99984C1.33317 11.6732 4.3265 14.6665 7.99984 14.6665ZM8.49984 10.6665C8.49984 10.9398 8.27317 11.1665 7.99984 11.1665C7.7265 11.1665 7.49984 10.9398 7.49984 10.6665V7.33317C7.49984 7.05984 7.7265 6.83317 7.99984 6.83317C8.27317 6.83317 8.49984 7.05984 8.49984 7.33317V10.6665ZM7.3865 5.07984C7.41984 4.99317 7.4665 4.9265 7.5265 4.85984C7.59317 4.79984 7.6665 4.75317 7.7465 4.71984C7.8265 4.6865 7.91317 4.6665 7.99984 4.6665C8.0865 4.6665 8.17317 4.6865 8.25317 4.71984C8.33317 4.75317 8.4065 4.79984 8.47317 4.85984C8.53317 4.9265 8.57984 4.99317 8.61317 5.07984C8.6465 5.15984 8.6665 5.2465 8.6665 5.33317C8.6665 5.41984 8.6465 5.5065 8.61317 5.5865C8.57984 5.6665 8.53317 5.73984 8.47317 5.8065C8.4065 5.8665 8.33317 5.91317 8.25317 5.9465C8.09317 6.01317 7.9065 6.01317 7.7465 5.9465C7.6665 5.91317 7.59317 5.8665 7.5265 5.8065C7.4665 5.73984 7.41984 5.6665 7.3865 5.5865C7.35317 5.5065 7.33317 5.41984 7.33317 5.33317C7.33317 5.2465 7.35317 5.15984 7.3865 5.07984Z"
                  fill="#808693"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-3">
          <span className="text-base font-medium">Liquidity Allocation</span>
          <div className="w-full space-y-3 rounded-sm border p-3 pt-0">
            <Table>
              <TableHeader>
                <TableRow className="w-full">
                  <TableHead className="px-3 py-4 font-medium text-secondary-foreground">
                    Token
                  </TableHead>
                  <TableHead className="whitespace-nowrap px-3 py-4 font-medium text-secondary-foreground">
                    Pool Size
                  </TableHead>
                  <TableHead className="whitespace-nowrap px-3 py-4 font-medium text-secondary-foreground">
                    Current Weightage
                  </TableHead>
                  <TableHead className="whitespace-nowrap px-3 py-4 font-medium text-secondary-foreground">
                    Target Weightage
                  </TableHead>
                  <TableHead className="px-3 py-4 font-medium text-secondary-foreground">
                    Utilization
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poolDatas &&
                  poolDatas.map((row: any) => (
                    <TableRow key={row.symbol} className="border-none">
                      <TableCell className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-inherit ring-2 ring-border">
                          <Image
                            src={row.img}
                            alt={name}
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded-full"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-normal text-foreground">
                            {row.symbol}
                          </span>
                          <span className="whitespace-nowrap text-xs font-normal text-secondary-foreground">
                            {row.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-normal text-foreground">
                            {row.poolSize}
                          </span>
                          <span className="text-xs font-normal text-secondary-foreground">
                            Rank
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs text-foreground">
                        {row.current_weightage}
                      </TableCell>
                      <TableCell className="text-center text-xs text-foreground">
                        {row.target_weightage}
                      </TableCell>
                      <TableCell className="text-center text-xs text-foreground">
                        XXX %
                      </TableCell>
                      <TableCell className="text-center text-xs text-foreground">
                        {row.utilization}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <div className="border-t pt-3">
              <div className="flex flex-col">
                <div className="flex justify-between">
                  <span className="text-xs font-normal text-secondary-foreground">
                    {symbol}LP Price
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    $4,228
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-normal text-secondary-foreground">
                    Total Supply
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    375 157 373,224 {symbol}LP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col space-y-3">
          <Tabs value={activeTab}>
            <TabsList className="flex h-auto w-full justify-between rounded-sm bg-accent-foreground p-2">
              <TabsTrigger
                value="mint"
                className="w-full rounded-sm border border-transparent px-5 py-[6px] hover:text-primary data-[state=active]:border-primary"
                onClick={() => {
                  setActiveTab('mint')
                  handleTokenAmount('0')
                }}
              >
                Buy
              </TabsTrigger>
              <TabsTrigger
                value="redeem"
                className="w-full rounded-sm border border-transparent px-5 py-[6px] hover:text-primary data-[state=active]:border-primary"
                onClick={() => {
                  setActiveTab('redeem')
                  handleTokenAmount('0')
                }}
              >
                Sell
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-start justify-between gap-2">
            <div className="flex w-full flex-col space-y-2">
              {activeTab === 'mint' ? (
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8 flex flex-col space-y-1">
                    <span className="text-sm font-medium text-secondary-foreground">
                      Pay
                    </span>
                    <div className="relative w-full">
                      <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center space-x-2">
                        <PoolDropdown
                          isOpen={isOpen}
                          handleClickToken={handleClickToken}
                          handleOpenChange={handleOpenChange}
                          poolDatas={poolDatas}
                          selectedToken={selectedToken}
                          logo={logo}
                        />
                      </div>
                      <Input
                        type="number"
                        onChange={(e) => handleTokenAmount(e.target.value)}
                        placeholder={'0.00'}
                        className="h-auto w-full rounded-sm border-none bg-secondary py-2 pl-12 shadow-none"
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                  </div>
                  <Button
                    className="col-span-4 mt-6 h-fit rounded-sm bg-primary px-4 py-[10px] text-black hover:bg-gradient-primary"
                    onClick={onSubmit}
                  >
                    {activeTab === 'mint' ? 'Buy' : 'Sell'}
                  </Button>
                </div>
              ) : (
                <div className="gird-cols-12 grid gap-2">
                  <div className="col-span-12 flex w-full flex-col space-y-1">
                    <span className="text-sm font-medium text-secondary-foreground">
                      Pay
                    </span>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center space-x-2">
                        {symbol}-LP
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        onChange={(e) => handleTokenAmount(e.target.value)}
                        className="h-auto w-full rounded-sm border-none bg-secondary py-2 pr-3 text-right shadow-none"
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                  </div>
                  <div className="col-span-8 flex flex-col space-y-1">
                    <span className="text-sm font-medium text-secondary-foreground">
                      Sell Into
                    </span>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center space-x-2">
                        <PoolDropdown
                          isOpen={isOpen}
                          handleClickToken={handleClickToken}
                          handleOpenChange={handleOpenChange}
                          poolDatas={poolDatas}
                          selectedToken={selectedToken}
                          logo={logo}
                        />
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-auto w-full rounded-sm border-none bg-secondary py-2 pr-3 text-right shadow-none"
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                  </div>
                  <Button
                    className="col-span-4 mt-6 h-fit rounded-sm bg-primary px-4 py-[10px] text-black hover:bg-gradient-primary"
                    onClick={onSubmit}
                  >
                    {activeTab === 'mint' ? 'Buy' : 'Sell'}
                  </Button>
                </div>
              )}
              {tokenAmount > 0 && (
                <div className="flex w-full flex-col rounded-sm border p-5">
                  <section className="flex flex-col space-y-1 text-sm font-medium text-secondary-foreground">
                    <div>
                      <span className="text-foreground">
                        {activeTab === 'mint'
                          ? `${tokenAmount > 0 ? tokenAmount : 0} ${symbol} `
                          : `${tokenAmount > 0 ? tokenAmount : 0
                          } ${symbol}-LP `}
                      </span>
                      <span>
                        will be{' '}
                        {activeTab === 'mint' ? 'bought into' : 'sold from'} the
                        pool at <span className="text-foreground">0.1%</span>{' '}
                        fees. <br />
                        You&apos;ll Receive XXX{' '}
                        <span className="text-foreground">
                          {activeTab === 'mint'
                            ? `${symbol}-LP`
                            : `${symbol} `}{' '}
                        </span>
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <svg
                        className={`${loading ? 'animate-spin' : ''
                          } h-4 w-4 text-primary`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        ></path>
                      </svg>
                      {activeTab === 'mint' ? (
                        <span>
                          {tokenAmount > 0 ? tokenAmount : 0} {symbol} = XXX{' '}
                          {symbol}-LP
                        </span>
                      ) : (
                        <span>
                          {tokenAmount > 0 ? tokenAmount : 0} {symbol}-LP = XXX{' '}
                          {symbol}
                        </span>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SheetContent>
  )
}
