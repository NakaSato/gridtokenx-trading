'use client'
import { Button } from './ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { tokenList } from '@/lib/data/tokenlist'
import type { PythPriceState } from '@/hooks/usePythPrice'
import { formatPrice } from '@/utils/formatter'
import { Select, SelectContent, SelectTrigger } from './ui/select'
import { ChevronsUpDown } from 'lucide-react'
import { generateOptionChainData, OptionChainData } from '@/lib/data/dummyData'
import { ScrollArea } from './ui/scroll-area'
import { useState } from 'react'

interface OptionChainTableProps {
  tokenIdx: number
  priceData: PythPriceState
  priceLoading: boolean
  dummyData: OptionChainData[]
  optionIdx: number
  onOptionIdxChange: (idx: number) => void
  onBidPriceChange: (amount: number) => void
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
}: OptionChainTableProps) {
  const tokens = tokenList
  const [activeTab, setActiveTab] = useState<'Buy' | 'Sell'>('Buy')
  const handleClick = (idx: number) => {
    if (idx === optionIdx) {
      onOptionIdxChange(-1)
    } else {
      onOptionIdxChange(idx)
    }
  }

  return (
    <main
      className="flex w-full flex-col space-y-4"
      style={{ height: 'calc(100vh - 155px)' }}
    >
      <section className="flex w-full flex-col rounded-sm border">
        {/* <div className="flex lg:flex-col space-y-1 border-b p-4">
                    <span className="text-xs lg:text-base text-secondary-foreground font-medium">{tokens[tokenIdx].symbol} ${priceData.price ? formatPrice(priceData.price) : priceLoading}</span>
                    <h1 className="text-xl lg:text-3xl">{tokens[tokenIdx].symbol} {contract}</h1>
                </div> */}
        <div className="flex w-full flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full gap-4">
            <div className="flex w-full lg:w-auto">
              <Button
                className={`w-full rounded-r-none lg:w-20 ${
                  activeTab === 'Buy'
                    ? 'border border-primary bg-primary text-black'
                    : 'border border-primary bg-primary/10 text-primary'
                }`}
                onClick={() => setActiveTab('Buy')}
              >
                Buy
              </Button>
              <Button
                className={`w-full rounded-l-none lg:w-20 ${
                  activeTab === 'Sell'
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
                className={`w-full rounded-r-none lg:w-20 ${
                  contract === 'Call'
                    ? 'border border-green-500 bg-green-500 text-black'
                    : 'border border-red-500 bg-red-500/10 text-red-500'
                }`}
                onClick={() => onContractChange('Call')}
              >
                Call
              </Button>
              <Button
                className={`w-full rounded-l-none lg:w-20 ${
                  contract === 'Put'
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
              <ChevronsUpDown />
            </SelectTrigger>
            <SelectContent></SelectContent>
          </Select>
        </div>
      </section>
      <section className="hidden w-full flex-grow overflow-y-hidden rounded-sm border lg:flex">
        {activeTab === 'Buy' ? (
          <ScrollArea className="w-full overflow-y-auto">
            <Table>
              <TableHeader className="sticky left-0 top-0 bg-background">
                <TableRow>
                  <TableHead>Strike Price</TableHead>
                  <TableHead>Breakeven</TableHead>
                  <TableHead>Chance of Profit</TableHead>
                  <TableHead>%Change</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Bid Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="">
                {dummyData.map((option, idx) => (
                  <TableRow key={idx} className="">
                    <TableCell>${option.strikePrice}</TableCell>
                    <TableCell>${option.breakeven}</TableCell>
                    <TableCell>{option.chanceofProfit}</TableCell>
                    <TableCell>{option.percentChange}</TableCell>
                    <TableCell>{option.change}</TableCell>
                    <TableCell className="flex items-center">
                      <div
                        className={`flex h-fit w-20 justify-center rounded-sm rounded-r-none border border-r-0 border-primary p-1 ${optionIdx === idx ? 'bg-primary text-black hover:bg-primary/80' : 'bg-transparent text-primary'} `}
                      >
                        ${option.bidPrice.toFixed(2)}
                      </div>
                      <Button
                        variant={'outline'}
                        className={`h-fit w-8 rounded-l-none border-primary p-1 font-bold ${optionIdx === idx ? 'border-l-black bg-primary text-black hover:bg-primary/80' : 'bg-transparent text-primary'} `}
                        onClick={() => {
                          handleClick(idx)
                        }}
                      >
                        {optionIdx === idx ? '✓' : '+'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            No Positions Open
          </div>
        )}
      </section>
      <section className="flex flex-grow border lg:hidden">
        <ScrollArea></ScrollArea>
      </section>
    </main>
  )
}
