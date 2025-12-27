'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import axios from 'axios'

import {
  clusterUrl,
  Option_Program_Address,
  THB_DECIMALS,
  USDC_DECIMALS,
  WSOL_DECIMALS,
} from '@/utils/const'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { AvatarIcon, CallIconDark, PutIconDark } from '@/public/svgs/icons'
import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { Badge } from './ui/badge'
import { Activity, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { OptionContract } from '@/lib/idl/option_contract'
import * as idl from '../lib/idl/option_contract.json'
import { AnchorProvider, getProvider, Program } from '@coral-xyz/anchor'
import { connection } from '@/utils/const'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Wallet } from '@coral-xyz/anchor/dist/cjs/provider'

import { pools } from '@/lib/data/pools'

import { getPythPrice } from '@/hooks/usePythPrice'
import { formatAddress } from '@/utils/formatter'
import { usePythPrice } from '@/hooks/usePythPrice'

interface OptionDetail {
  profile: string
  quantity: string
  amount: string
  boughtBack: string
  claimed: string
  custody: string
  exercised: string
  expiredDate: string
  index: string
  lockedAsset: string
  period: string
  pool: string
  premium: string
  premiumAsset: string
  profit: string
  strikePrice: string
  valid: string
  tx: string
  type: string
  executedDate: string
  purchaseDate: string
  purchasedPrice: string
}

interface ProgramAccount {
  pubkey: PublicKey
  account: {
    data: string
  }
}

export default function RecentTrades() {
  const [optionDetails, setOptionDetails] = useState<OptionDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [program, setProgram] = useState<Program<OptionContract>>()
  const selectedSymbol = 'Crypto.SOL/USD'

  const { priceData, loading: priceLoading } = usePythPrice(selectedSymbol)

  const initializeProvider = useCallback(() => {
    const dummyKeypair = Keypair.generate()
    const dummyWallet: Wallet = {
      publicKey: dummyKeypair.publicKey,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any) => txs,
    }

    try {
      return getProvider()
    } catch {
      return new AnchorProvider(connection, dummyWallet, {})
    }
  }, [])

  const processOptionAccount = async (
    account: ProgramAccount,
    program: Program<OptionContract>
  ) => {
    try {
      const optionDetailAccount = await program.account.OptionDetail.fetch(
        account.pubkey
      )

      const poolInfo = pools.find(
        (pool) => pool.programId === optionDetailAccount.pool.toString()
      )

      const purchaseTimestamp =
        parseInt(optionDetailAccount.expired_date) * 1000 -
        parseInt(optionDetailAccount.period) * 86400 * 1000 -
        86400000

      const priceData = await getPythPrice(selectedSymbol, purchaseTimestamp)

      const isCall =
        optionDetailAccount.locked_asset.toString() ==
        optionDetailAccount.premium_asset.toString()

      const premium = parseFloat(optionDetailAccount.premium)
      const quantity = optionDetailAccount.quantity.toString()
      const profile = optionDetailAccount.owner.toString()
      const tx =
        optionDetailAccount.exercised.toString() != '0'
          ? 'Exercised'
          : optionDetailAccount.bought_back.toString() != '0'
            ? 'Sold'
            : 'Bought'
      return {
        quantity: quantity,
        profile: profile,
        amount: optionDetailAccount.amount.toString(),
        boughtBack: optionDetailAccount.bought_back.toString(),
        claimed: optionDetailAccount.claimed.toString(),
        custody: optionDetailAccount.custody.toString(),
        exercised: optionDetailAccount.exercised.toString(),
        expiredDate: new Date(
          parseInt(optionDetailAccount.expired_date) * 1000
        ).toLocaleString(),
        index: optionDetailAccount.index.toString(),
        lockedAsset: optionDetailAccount.locked_asset.toString(),
        period: optionDetailAccount.period.toString(),
        pool: poolInfo?.name || '',
        premium: optionDetailAccount.premium.toString(),
        premiumAsset: optionDetailAccount.premium_asset.toString(),
        profit: optionDetailAccount.profit.toString(),
        strikePrice: optionDetailAccount.strike_price.toString(),
        valid: optionDetailAccount.valid.toString(),
        tx: tx,
        type: isCall ? 'Call' : 'Put',
        executedDate:
          tx === 'Exercised'
            ? parseInt(optionDetailAccount.exercised)
            : tx === 'Sold'
              ? parseInt(optionDetailAccount.bought_back)
              : parseInt(optionDetailAccount.purchase_date),
        purchaseDate: optionDetailAccount.purchase_date,
        purchasedPrice: priceData,
      }
    } catch (error) {
      console.error('Error processing option account:', error)
      return null
    }
  }

  useEffect(() => {
    const fetchTrades = async (silent = false) => {
      try {
        if (!silent) setIsLoading(true)

        const { data } = await axios.post(clusterUrl, {
          jsonrpc: '2.0',
          id: 1,
          method: 'getProgramAccounts',
          params: [
            Option_Program_Address,
            {
              encoding: 'base64',
              filters: [
                {
                  dataSize: 267,
                },
              ],
            },
          ],
        })

        const provider = initializeProvider()
        const program = new Program<OptionContract>(
          idl as OptionContract,
          provider
        )
        setProgram(program)

        // Process accounts in batches to avoid overwhelming the system

        const optionAccounts = data.result
        const _optionDetails: OptionDetail[] = []

        const results = await Promise.all(
          optionAccounts.map((account: ProgramAccount) =>
            processOptionAccount(account, program)
          )
        )
        _optionDetails.push(...results)

        const _solOrexcise = _optionDetails.filter((detail) => {
          return detail.tx != 'Bought'
        })

        for (const detail of _solOrexcise) {
          _optionDetails.push({
            ...detail,
            executedDate:
              detail.executedDate == '0'
                ? detail.executedDate
                : detail.purchaseDate,
            tx: 'Bought',
          })
        }

        _optionDetails.sort((a, b) => {
          return parseInt(b.executedDate) - parseInt(a.executedDate)
        })

        setOptionDetails(_optionDetails)
        setLastUpdated(new Date())
      } catch (error) {
        console.error('Error fetching trades:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrades()
    const interval = setInterval(() => fetchTrades(true), 30000)
    return () => clearInterval(interval)
  }, [initializeProvider])

  const memoizedTableContent = useMemo(
    () => (
      <TableBody className="w-full">
        {optionDetails.map((row, idx) => (
          <TableRow
            key={`${row.profile}-${row.executedDate}-${idx}`}
            className="w-full border-b border-border/50 hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-left-2 duration-300"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <TableCell className="py-3 pl-5 pr-3 text-justify text-sm font-normal text-foreground">
              <div className="flex items-center gap-[10px]">
                <AvatarIcon />
                {formatAddress(row.profile)}
              </div>
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {row.tx === 'Bought' ? (
                <Badge variant="outline" className="bg-[#A3BFFB]/10 text-[#A3BFFB] border-[#A3BFFB]/20 hover:bg-[#A3BFFB]/20">
                  {row.tx}
                </Badge>
              ) : row.tx === 'Sold' ? (
                <Badge variant="outline" className="bg-[#FFD08E]/10 text-[#FFD08E] border-[#FFD08E]/20 hover:bg-[#FFD08E]/20">
                  {row.tx}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-[#A5F3C0]/10 text-[#A5F3C0] border-[#A5F3C0]/20 hover:bg-[#A5F3C0]/20">
                  {row.tx}
                </Badge>
              )}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {row.quantity}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              collateral
              {/* todo add collateral value */}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {row.tx == 'Bought'
                ? (
                  parseFloat(row.amount) /
                  10 ** (row.type == 'Call' ? WSOL_DECIMALS : (row.pool.includes('USDC') ? USDC_DECIMALS : THB_DECIMALS))
                ).toFixed(2)
                : row.tx == 'Sold'
                  ? (
                    ((parseFloat(row.amount) / 10) * 9) /
                    (row.type == 'Call'
                      ? 10 ** WSOL_DECIMALS
                      : 10 ** (row.pool.includes('USDC') ? USDC_DECIMALS : THB_DECIMALS))
                  ).toFixed(2)
                  : row.tx == 'Exercised'
                    ? row.claimed != '0'
                      ? row.claimed
                      : parseFloat(row.profit).toFixed(2)
                    : '0'}{' '}
              {row.type == 'Call' ? 'SOL' : (row.pool.includes('USDC') ? 'USDC' : 'THB')}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {row.tx == 'Sold'
                ? (
                  parseFloat(row.amount) /
                  10 /
                  (row.type == 'Call'
                    ? 10 ** WSOL_DECIMALS
                    : 10 ** (row.pool.includes('USDC') ? USDC_DECIMALS : THB_DECIMALS))
                ).toFixed(2)
                : '0'}{' '}
              {row.type == 'Call' ? 'SOL' : (row.pool.includes('USDC') ? 'USDC' : 'THB')}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {row.pool}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              <div className="flex items-center gap-2">
                {row.type === 'Call' ? (
                  <CallIconDark width="14" height="14" />
                ) : (
                  <PutIconDark width="14" height="14" />
                )}
                {row.type}
              </div>
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {row.strikePrice}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {row.expiredDate}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              $
              {row.purchasedPrice
                ? (
                  (Number(row.amount) * Number(row.purchasedPrice)) /
                  (row.type == 'Call'
                    ? 10 ** WSOL_DECIMALS
                    : 10 ** (row.pool.includes('USDC') ? USDC_DECIMALS : THB_DECIMALS))
                ).toFixed(2)
                : '0'}{' '}
              {row.pool.includes('USDC') ? 'USDC' : 'THB'}
            </TableCell>
            <TableCell className="py-[14px] pl-3 pr-5 text-justify text-sm font-normal text-foreground whitespace-nowrap">
              <div className="flex flex-col">
                <span className="font-medium">
                  {formatDistanceToNow(new Date(parseInt(row.executedDate) * 1000), { addSuffix: true })}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(parseInt(row.executedDate) * 1000).toLocaleTimeString()}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    ),
    [optionDetails]
  )

  return (
    <Card className="flex h-full w-full flex-col border border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2 font-bold">
            <Activity className="h-5 w-5 text-primary" />
            Recent Trades
          </span>
          <div className="flex items-center gap-4 text-xs font-normal text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="uppercase tracking-wider font-semibold text-green-500">Live</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full w-full">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <Table className="overflow-hidden whitespace-nowrap">
              <TableHeader className="w-full bg-secondary/30">
                <TableRow className="border-b border-border/50">
                  <TableHead className="py-4 pl-5 pr-3 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Profile
                  </TableHead>
                  <TableHead className="px-3 py-4 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Action
                  </TableHead>
                  <TableHead className="px-3 py-4 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quantity
                  </TableHead>
                  <TableHead className="px-3 py-4 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Collateral
                  </TableHead>
                  <TableHead className="px-3 py-4 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Value
                  </TableHead>
                  <TableHead className="px-3 py-4 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Fees
                  </TableHead>
                  <TableHead className="px-3 py-4 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Pool
                  </TableHead>
                  <TableHead className="px-3 py-4 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Type
                  </TableHead>
                  <TableHead className="px-3 py-4 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Strike
                  </TableHead>
                  <TableHead className="px-3 py-4 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Expiry
                  </TableHead>
                  <TableHead className="px-3 py-4 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Trade Size
                  </TableHead>
                  <TableHead className="py-4 pl-3 pr-5 text-justify text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Time
                  </TableHead>
                </TableRow>
              </TableHeader>
              {memoizedTableContent}
            </Table>
          )}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
