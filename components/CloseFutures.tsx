import { useState } from 'react'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select'
import Image from 'next/image'
import { tokenList } from '@/lib/data/tokenlist'
import { ChevronDown } from 'lucide-react'

export default function CloseFutures() {
  const tokens = tokenList
  const [selectedToken, setSelectedToken] = useState('SOL')
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={`h-fit bg-transparent p-1 text-xs hover:border-primary hover:text-primary ${isOpen ? 'border-primary text-primary' : 'border-border text-secondary-foreground'}`}
        >
          Close
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex flex-col space-y-2">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between gap-10">
            <Label className="font-normal">Size</Label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant={'outline'}
                className="h-fit p-1 text-xs text-secondary-foreground hover:text-foreground"
              >
                25%
              </Button>
              <Button
                variant={'outline'}
                className="h-fit p-1 text-xs text-secondary-foreground hover:text-foreground"
              >
                50%
              </Button>
              <Button
                variant={'outline'}
                className="h-fit p-1 text-xs text-secondary-foreground hover:text-foreground"
              >
                75%
              </Button>
              <Button
                variant={'outline'}
                className="h-fit p-1 text-xs text-secondary-foreground hover:text-foreground"
              >
                100%
              </Button>
            </div>
          </div>
          <Input
            type="number"
            placeholder={'0.00'}
            className="h-auto w-full rounded-sm border-border bg-transparent px-2 py-2 text-right shadow-none"
            step="0.1"
            min="0.1"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Label className="font-normal">Receive In</Label>
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
                <ChevronDown size={14} className="text-secondary-foreground" />
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
        </div>
        <div className="flex w-full justify-between text-sm">
          <span>Size</span>
          <span>xx</span>
        </div>
        <div className="flex w-full justify-between text-sm">
          <span>Collateral</span>
          <span>xx</span>
        </div>
        <div className="flex w-full justify-between text-sm">
          <span>Close Fee</span>
          <span>xx</span>
        </div>
        <div className="flex w-full justify-between text-sm">
          <span>Borrow Fee</span>
          <span>xx</span>
        </div>
        <div className="flex w-full justify-between text-sm">
          <span>Price Impact</span>
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
      </PopoverContent>
    </Popover>
  )
}
