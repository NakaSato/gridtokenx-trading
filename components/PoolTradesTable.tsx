'use client'

import { dummyPoolTrades } from '@/lib/data/dummyData'
import { ScrollArea } from './ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { AvatarIcon } from '@/public/svgs/icons'
import { useEffect, useState, useMemo, useCallback } from 'react'
import axios from 'axios'
import {
  HELIUS_API_KEY,
  Option_Program_Address,
  HELIUS_ENDPOINT,
  clusterUrl,
  USDC_MINT,
} from '@/utils/const'
import { createSolanaRpc, type Signature } from '@solana/kit'
import { BorshInstructionCoder } from '@coral-xyz/anchor'
import { OptionContract } from '@/lib/idl/option_contract'
import * as idl from '../lib/idl/option_contract.json'
import toast from 'react-hot-toast'
import { PublicKey } from '@solana/web3.js'

interface PoolTrade {
  profile: string
  type: string
  quantity: string
  paidReceived: string
  fees: string
  pool: string
  dateTime: string
  token0: string
  amount0: string
  token1: string
  amount1: string
  signature: string
}

interface Transaction {
  feePayer: string
  instructions: Array<{
    programId: string
    data: string
  }>
  tokenTransfers: Array<{
    mint: string
    tokenAmount: string
  }>
  signature: string
  timestamp: string
}

export default function PoolTradesTable() {
  const [poolTrades, setPoolTrades] = useState<PoolTrade[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const rpc = useMemo(() => createSolanaRpc(clusterUrl), [])

  const fetchLogMessages = useCallback(
    async (signature: string) => {
      try {
        const transaction = await rpc
          .getTransaction(signature as Signature)
          .send()
        return transaction?.meta?.logMessages
      } catch (error) {
        console.error('Error fetching log messages:', error)
        return null
      }
    },
    [rpc]
  )

  const processTransaction = useCallback(
    async (tx: Transaction, coder: BorshInstructionCoder) => {
      const _poolTrades: PoolTrade[] = []

      for (const instruction of tx.instructions) {
        if (
          instruction.programId !==
          new PublicKey(Option_Program_Address).toString()
        )
          continue

        const ix = coder.decode(instruction.data, 'base58')
        if (!ix) continue

        const _poolTrade: PoolTrade = {
          profile: tx.feePayer,
          type: '',
          quantity: '',
          paidReceived: '',
          fees: '',
          pool: '',
          dateTime: tx.timestamp,
          token0: '',
          amount0: '',
          token1: '',
          amount1: '',
          signature: tx.signature,
        }

        if (ix.name === 'remove_liquidity' || ix.name === 'add_liquidity') {
          const amount =
            ix.name === 'remove_liquidity'
              ? (ix.data as any).params.remove_amount
              : (ix.data as any).params.amount_in
          const pool = (ix.data as any).params.pool_name

          _poolTrade.type =
            ix.name === 'remove_liquidity' ? 'Withdrawal' : 'Deposit'
          _poolTrade.quantity = amount
          _poolTrade.pool = pool

          // Process token transfers
          tx.tokenTransfers.forEach((transfer: any, index: number) => {
            if (index === 0) {
              _poolTrade.token0 = transfer.mint
              _poolTrade.amount0 = transfer.tokenAmount
            } else {
              _poolTrade.token1 = transfer.mint
              _poolTrade.amount1 = transfer.tokenAmount
            }
          })

          const txData = await fetchLogMessages(tx.signature)
          if (txData) {
            const feeMessage = txData.find((message: string) =>
              message.includes('Program log: fee: ')
            )
            if (feeMessage) {
              _poolTrade.fees = feeMessage.split('Program log: fee: ')[1]
            }
          }

          _poolTrades.push(_poolTrade)
        }
      }

      return _poolTrades
    },
    [fetchLogMessages]
  )

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setIsLoading(true)
        toast.loading('Fetching trades...')

        const response = await axios.get(
          `/api/get_option_transactions?programId=${Option_Program_Address}`
        )
        const coder = new BorshInstructionCoder(idl as OptionContract)

        // Process transactions in parallel with a concurrency limit
        const allTrades: PoolTrade[] = []

        const batchResults = await Promise.all(
          response.data.map((tx: Transaction) => processTransaction(tx, coder))
        )
        allTrades.push(
          ...batchResults.flat().sort((a, b) => {
            return parseInt(b.dateTime) - parseInt(a.dateTime)
          })
        )

        setPoolTrades(allTrades)
      } catch (error) {
        console.error('Error fetching trades:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrades()
  }, [processTransaction])

  const memoizedTableContent = useMemo(
    () => (
      <TableBody>
        {poolTrades.map((tx, idx) => (
          <TableRow key={idx} className="w-full border-none">
            <TableCell className="w-fit py-3 pl-5 text-justify text-sm font-normal text-foreground">
              <div className="flex items-center gap-[10px]">
                <AvatarIcon />
                {tx.profile}
              </div>
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {tx.type === 'Deposit' ? (
                <span className="rounded-[8px] bg-[#A3BFFB]/20 px-2 py-[6px] text-[#A3BFFB]">
                  {tx.type}
                </span>
              ) : (
                <span className="rounded-[8px] bg-[#FFD08E]/20 px-2 py-[6px] text-[#FFD08E]">
                  {tx.type}
                </span>
              )}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {tx.amount1} {tx.pool + '-LP'}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              collateral
              {/* todo add collateral value */}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {tx.amount0} {tx.token0 == USDC_MINT.toString() ? 'USDC' : 'SOL'}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {tx.fees} USDC
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {tx.pool}
            </TableCell>
            <TableCell className="px-3 py-[14px] text-justify text-sm font-normal text-foreground">
              {new Date(parseInt(tx.dateTime) * 1000).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    ),
    [poolTrades]
  )

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-b-sm border-t-0 border-none">
      <ScrollArea className="h-full w-full rounded-b-sm">
        <Table className="w-full overflow-hidden whitespace-nowrap">
          <TableHeader className="w-full p-0">
            <TableRow className="p-0">
              <TableHead className="py-4 pl-5 pr-3 text-justify text-xs font-medium text-secondary-foreground">
                Profile
              </TableHead>
              <TableHead className="px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
                Deposit/Withdrawal
              </TableHead>
              <TableHead className="px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
                Quantity
              </TableHead>
              <TableHead className="px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
                Collateral
              </TableHead>
              <TableHead className="px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
                Paid/Received
              </TableHead>
              <TableHead className="px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
                Fees
              </TableHead>
              <TableHead className="px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
                Pool
              </TableHead>
              <TableHead className="px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
                Date & Time
              </TableHead>
            </TableRow>
          </TableHeader>
          {memoizedTableContent}
        </Table>
      </ScrollArea>
    </div>
  )
}
