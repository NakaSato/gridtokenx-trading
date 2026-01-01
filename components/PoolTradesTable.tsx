'use client'

import React, { useMemo, useCallback, useEffect } from 'react'
import axios from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createSolanaRpc, type Signature } from '@solana/kit'
import { BorshInstructionCoder } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
const { FixedSizeList: List } = require('react-window')

import { Table, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { AvatarIcon } from '@/public/svgs/icons'
import SkeletonTable from './ui/SkeletonTable'
import {
  Option_Program_Address,
  clusterUrl,
  USDC_MINT,
} from '@/utils/const'
import { OptionContract } from '@/lib/idl/option_contract'
import * as idl from '../lib/idl/option_contract.json'

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

  const { data: poolTrades = [], isLoading } = useQuery({
    queryKey: ['poolTrades', Option_Program_Address],
    queryFn: async () => {
      const response = await axios.get(
        `/api/get_option_transactions?programId=${Option_Program_Address}`
      )
      const coder = new BorshInstructionCoder(idl as OptionContract)

      const batchResults = await Promise.all(
        response.data.map((tx: Transaction) => processTransaction(tx, coder))
      )

      return batchResults.flat().sort((a, b) => {
        return parseInt(b.dateTime) - parseInt(a.dateTime)
      })
    },
    staleTime: 30000,
  })

  // WebSocket real-time updates
  const queryClient = useQueryClient()
  useEffect(() => {
    const handleWsMessage = (event: Event) => {
      const customEvent = event as CustomEvent
      const message = customEvent.detail

      if (message.type === 'TradeExecuted') {
        console.log('⚡ Pool Trade real-time update: TradeExecuted')
        queryClient.invalidateQueries({ queryKey: ['poolTrades'] })
      }
    }

    window.addEventListener('ws-message', handleWsMessage)
    return () => window.removeEventListener('ws-message', handleWsMessage)
  }, [queryClient])

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const tx = poolTrades[index]
    if (!tx) return null

    return (
      <div style={style}>
        <TableRow className="w-full border-none flex items-center">
          <TableCell className="w-[180px] py-3 pl-5 text-sm font-normal text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            <div className="flex items-center gap-[10px]">
              <AvatarIcon />
              {tx.profile}
            </div>
          </TableCell>
          <TableCell className="w-[140px] px-3 py-[14px] text-sm font-normal text-foreground">
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
          <TableCell className="w-[120px] px-3 py-[14px] text-sm font-normal text-foreground">
            {tx.amount1} {tx.pool + '-LP'}
          </TableCell>
          <TableCell className="w-[120px] px-3 py-[14px] text-sm font-normal text-foreground">
            {tx.amount0} {tx.token0 === USDC_MINT.toString() ? 'USDC' : 'SOL'}
          </TableCell>
          <TableCell className="w-[150px] px-3 py-[14px] text-sm font-normal text-foreground">
            {tx.amount0} {tx.token0 === USDC_MINT.toString() ? 'USDC' : 'SOL'}
          </TableCell>
          <TableCell className="w-[120px] px-3 py-[14px] text-sm font-normal text-foreground">
            {tx.fees} USDC
          </TableCell>
          <TableCell className="w-[120px] px-3 py-[14px] text-sm font-normal text-foreground">
            {tx.pool}
          </TableCell>
          <TableCell className="flex-1 px-3 py-[14px] text-sm font-normal text-foreground">
            {new Date(parseInt(tx.dateTime) * 1000).toLocaleString()}
          </TableCell>
        </TableRow>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-b-sm border-t-0 border-none">
      <Table className="w-full overflow-hidden whitespace-nowrap">
        <TableHeader className="w-full p-0">
          <TableRow className="w-full flex items-center p-0">
            <TableHead className="w-[180px] py-4 pl-5 pr-3 text-justify text-xs font-medium text-secondary-foreground">
              Profile
            </TableHead>
            <TableHead className="w-[140px] px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
              Type
            </TableHead>
            <TableHead className="w-[120px] px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
              Quantity
            </TableHead>
            <TableHead className="w-[120px] px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
              Collateral
            </TableHead>
            <TableHead className="w-[150px] px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
              Paid/Received
            </TableHead>
            <TableHead className="w-[120px] px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
              Fees
            </TableHead>
            <TableHead className="w-[120px] px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
              Pool
            </TableHead>
            <TableHead className="flex-1 px-3 py-4 text-justify text-xs font-medium text-secondary-foreground">
              Date & Time
            </TableHead>
          </TableRow>
        </TableHeader>
        <div className="h-[400px]">
          {isLoading ? (
            <SkeletonTable columns={8} rows={8} height={400} />
          ) : (
            <List
              height={400}
              itemCount={poolTrades.length}
              itemSize={50}
              width="100%"
            >
              {Row}
            </List>
          )}
        </div>
      </Table>
    </div>
  )
}
