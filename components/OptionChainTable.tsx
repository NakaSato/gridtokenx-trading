'use client'

import React, { useState, useMemo } from 'react'
const { FixedSizeList: List } = require('react-window')
import { ChevronsUpDown } from 'lucide-react'

import { Button } from './ui/button'
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Select, SelectContent, SelectTrigger } from './ui/select'
import { ScrollArea } from './ui/scroll-area'

import { tokenList } from '@/lib/data/tokenlist'
import type { PythPriceState } from '@/hooks/usePythPrice'
import { OptionChainData } from '@/lib/data/dummyData'

interface OptionChainTableProps {
  tokenIdx: number
  priceData: PythPriceState
  priceLoading: boolean
  dummyData: OptionChainData[]
  optionIdx: number
  onOptionIdxChange: (idx: number) => void
  onBidPriceChange: (amount: number) => void
  onAddLeg?: (idx: number) => void
  position: 'Long' | 'Short'
  contract: 'Call' | 'Put'
  onPositionChange: (position: 'Long' | 'Short') => void
  onContractChange: (contract: 'Call' | 'Put') => void
}

export default function OptionChainTable({
  tokenIdx,
  priceData,
  priceLoading,
  dummyData,
  contract,
  position,
  optionIdx,
  onContractChange,
  onPositionChange,
  onOptionIdxChange,
  onBidPriceChange,
  onAddLeg,
}: OptionChainTableProps) {
  const [activeTab, setActiveTab] = useState<'Buy' | 'Sell'>('Buy')

  const handleClick = (idx: number) => {
    if (onAddLeg) {
      onAddLeg(idx)
    } else {
      if (idx === optionIdx) {
        onOptionIdxChange(-1)
      } else {
        onOptionIdxChange(idx)
      }
    }
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const option = dummyData[index]
    return (
      <div style={style}>
        <TableRow className="border-none w-full flex items-center hover:bg-muted/30">
          <TableCell className="w-[120px] text-xs lg:text-sm text-foreground">${option.strikePrice}</TableCell>
          <TableCell className="w-[120px] text-xs lg:text-sm text-foreground">${option.breakeven}</TableCell>
          <TableCell className="w-[150px] text-xs lg:text-sm text-foreground">{option.chanceofProfit}</TableCell>
          <TableCell className="w-[100px] text-xs lg:text-sm text-foreground">{option.percentChange}</TableCell>
          <TableCell className="w-[100px] text-xs lg:text-sm text-foreground">{option.change}</TableCell>
          <TableCell className="flex-1 flex items-center justify-end pr-4">
            <div
              className={`flex h-fit w-20 justify-center rounded-sm rounded-r-none border border-r-0 border-primary p-1 text-xs lg:text-sm ${optionIdx === index ? 'bg-primary text-black' : 'bg-transparent text-primary'} `}
            >
              ${option.bidPrice.toFixed(2)}
            </div>
            <Button
              variant={'outline'}
              className={`h-fit w-8 rounded-l-none border-primary p-1 font-bold ${optionIdx === index ? 'border-l-black bg-primary text-black hover:bg-primary/80' : 'bg-transparent text-primary'} `}
              onClick={() => {
                handleClick(index)
              }}
            >
              {optionIdx === index ? '✓' : '+'}
            </Button>
          </TableCell>
        </TableRow>
      </div>
    )
  }

  return (
    <main
      className="flex w-full flex-col space-y-4"
      style={{ height: 'calc(100vh - 155px)' }}
    >
      <section className="flex w-full flex-col rounded-sm border">
        <div className="flex w-full flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full gap-4">
            <div className="flex w-full lg:w-auto">
              <Button
                className={`w-full rounded-r-none lg:w-20 ${activeTab === 'Buy'
                  ? 'border border-primary bg-primary text-black'
                  : 'border border-primary bg-primary/10 text-primary'
                  }`}
                onClick={() => setActiveTab('Buy')}
              >
                Buy
              </Button>
              <Button
                className={`w-full rounded-l-none lg:w-20 ${activeTab === 'Sell'
                  ? 'border border-primary bg-primary text-black'
                  : 'border border-primary bg-primary/10 text-primary'
                  }`}
                onClick={() => setActiveTab('Sell')}
              >
                Sell
              </Button>
            </div>
            <div className="flex w-full lg:w-auto">
              <Button
                className={`w-full rounded-r-none lg:w-20 ${contract === 'Call'
                  ? 'border border-green-500 bg-green-500 text-black'
                  : 'border border-red-500 bg-red-500/10 text-red-500'
                  }`}
                onClick={() => onContractChange('Call')}
              >
                Call
              </Button>
              <Button
                className={`w-full rounded-l-none lg:w-20 ${contract === 'Put'
                  ? 'border border-red-500 bg-red-500 text-black'
                  : 'border border-green-500 bg-green-500/10 text-green-500'
                  }`}
                onClick={() => onContractChange('Put')}
              >
                Put
              </Button>
            </div>
          </div>
          <Select>
            <SelectTrigger className="w-full lg:w-72">
              <span>Expiring June 21 (46d)</span>
              <ChevronsUpDown className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>
      </section>

      <section className="hidden w-full flex-grow overflow-y-hidden rounded-sm border lg:flex lg:flex-col">
        {activeTab === 'Buy' ? (
          <>
            <Table>
              <TableHeader className="bg-background border-b">
                <TableRow className="flex items-center">
                  <TableHead className="w-[120px] text-xs lg:text-sm">Strike Price</TableHead>
                  <TableHead className="w-[120px] text-xs lg:text-sm">Breakeven</TableHead>
                  <TableHead className="w-[150px] text-xs lg:text-sm">Chance of Profit</TableHead>
                  <TableHead className="w-[100px] text-xs lg:text-sm">%Change</TableHead>
                  <TableHead className="w-[100px] text-xs lg:text-sm">Change</TableHead>
                  <TableHead className="flex-1 text-right pr-4 text-xs lg:text-sm">Bid Price</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
            <div className="flex-grow">
              <List
                height={400} // Approximate height, should be dynamic if possible
                itemCount={dummyData.length}
                itemSize={50}
                width="100%"
              >
                {Row}
              </List>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            No Positions Open
          </div>
        )}
      </section>

      <section className="flex flex-grow border lg:hidden">
        <ScrollArea className="w-full h-full p-4">
          <div className="flex items-center justify-center h-full opacity-50">
            Mobile View (Virtualized) Coming Soon
          </div>
        </ScrollArea>
      </section>
    </main>
  )
}
