'use client'

import { ChevronDown, SquarePen } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Input } from './ui/input'
import Image from 'next/image'
import { tokenList } from '@/lib/data/tokenlist'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useState } from 'react'
import { Button } from './ui/button'

export default function Collateral() {
  const tokens = tokenList
  const [selectedToken, setSelectedToken] = useState('SOL')
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <SquarePen
          size={13}
          className={`hover:text-primary ${isOpen ? 'text-primary' : 'text-foreground'}`}
        />
      </PopoverTrigger>
      <PopoverContent align="end">
        <Tabs defaultValue="deposit">
          <TabsList className="gap-2 bg-inherit">
            <TabsTrigger value="deposit" className="p-0">
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="p-0">
              Withdraw
            </TabsTrigger>
          </TabsList>
          {['deposit', 'withdraw'].map((tab) => (
            <TabsContent
              key={tab}
              value={tab}
              className="mt-0 flex w-full flex-col space-y-2"
            >
              <div className="relative w-full">
                <Select
                  defaultValue="SOL"
                  onValueChange={(value) => setSelectedToken(value)}
                >
                  <SelectTrigger className="absolute left-3 top-1/2 flex w-fit -translate-y-1/2 items-center space-x-1 bg-backgroundSecondary p-1">
                    {tokens.map(
                      (token, idx) =>
                        token.symbol === selectedToken && (
                          <div key={idx} className="flex space-x-1">
                            <Image
                              src={token.iconPath}
                              alt={token.name}
                              width={20}
                              height={20}
                              className="h-5 w-5 rounded-full"
                            />
                            <span className="text-sm text-secondary-foreground">
                              {token.symbol}
                            </span>
                          </div>
                        )
                    )}
                    <ChevronDown
                      size={14}
                      className="text-secondary-foreground"
                    />
                  </SelectTrigger>
                  <SelectContent className="min-w-fit">
                    {tokens.map((token, idx) => (
                      <SelectItem key={idx} value={token.symbol}>
                        <div className="flex space-x-2">
                          <Image
                            src={token.iconPath}
                            alt={token.name}
                            width={20}
                            height={20}
                            className="h-6 w-6 rounded-full"
                          />
                          <p>{token.symbol}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder={'0.00'}
                  className="h-auto w-full rounded-sm border-border bg-transparent px-2 py-2 text-right shadow-none"
                  step="0.1"
                  min="0.1"
                />
              </div>
              <div className="flex w-full justify-between text-sm">
                <span>Leverage</span>
                <span>xx</span>
              </div>
              <div className="flex w-full justify-between text-sm">
                <span>Liq. Price</span>
                <span>xx</span>
              </div>
              <div className="flex w-full justify-between text-sm">
                <span>Collateral</span>
                <span>xx</span>
              </div>
              <div className="flex w-full justify-between text-sm">
                <span>Borrow Fees Due</span>
                <span>xx</span>
              </div>
              <div className="flex w-full justify-between text-sm">
                <span>Transaction Fee</span>
                <span>xx</span>
              </div>
              <div className="flex w-full justify-between gap-2 text-sm">
                <Button
                  variant={'outline'}
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Dismiss
                </Button>
                <Button
                  className="w-full bg-primary/70 text-black hover:bg-primary disabled:cursor-not-allowed"
                  onClick={() => setIsOpen(false)}
                  disabled
                >
                  Confirm
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
