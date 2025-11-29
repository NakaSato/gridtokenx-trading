import Image from 'next/image'
import { Badge } from './ui/badge'
import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ExpiryIcon,
  PurchaseDateIcon,
  PurchasePriceIcon,
  SizeIcon,
  StrikePriceIcon,
} from '@/public/svgs/icons'
import { Button } from './ui/button'
import { Ban, Calendar, SquarePen } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar as CalendarComponent } from './ui/calendar'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

interface OpenOptionOrdersProps {
  token: string
  logo: string
  symbol: string
  type: string
  transaction: string
  limitPrice: number
  strikePrice: number
  expiry: string
  orderDate: string
  size: number
}

export default function OpenOptionOrders({
  logo,
  token,
  symbol,
  type,
  transaction,
  limitPrice,
  strikePrice,
  expiry,
  orderDate,
  size,
}: OpenOptionOrdersProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isLimit, setIsLimit] = useState<boolean>(false)
  const [isStrike, setIsStrike] = useState<boolean>(false)
  const [isSize, setIsSize] = useState<boolean>(false)

  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isExpiry, setIsExpiry] = useState(false)
  const [customDate, setCustomDate] = useState<Date>()

  return (
    <div className="w-full flex-col rounded-sm bg-accent">
      <div
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-[6px]">
          <Image
            src={logo}
            alt={token}
            width={16}
            height={16}
            className="h-4 w-4 rounded-full"
          />
          <span className="text-sm font-medium text-foreground">{symbol}</span>
          <Badge className="flex h-fit w-fit items-center justify-center rounded-[3px] border-none bg-gradient-primary px-1 py-[1px] text-[8px] font-semibold text-black">
            {type}
          </Badge>
          <Badge
            className={`${transaction === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} flex h-fit w-fit items-center justify-center rounded-[3px] px-1 py-[1px] text-[8px] font-semibold`}
          >
            {transaction.charAt(0).toUpperCase() +
              transaction.slice(1).toLowerCase()}
          </Badge>
        </div>
        {isOpen ? (
          <span className="text-secondary-foreground">
            <ArrowUp />
          </span>
        ) : (
          <span className="text-secondary-foreground">
            <ArrowDown />
          </span>
        )}
      </div>
      {isOpen && (
        <div className="w-full space-y-2 border-t px-4 py-4">
          <div className="flex w-full items-center justify-between text-sm font-normal text-secondary-foreground">
            <div className="flex items-center space-x-2">
              <PurchasePriceIcon />
              <span>Limit Price</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>{limitPrice}</span>
              {transaction === 'buy' && (
                <Popover open={isLimit} onOpenChange={setIsLimit}>
                  <PopoverTrigger asChild>
                    <SquarePen
                      size={13}
                      className="cursor-pointer text-foreground hover:text-primary"
                    />
                  </PopoverTrigger>
                  <PopoverContent align="end" className="space-y-4 p-3">
                    <div className="flex flex-col space-y-2">
                      <Label>New Limit Price</Label>
                      <Input className="rounded-sm border-border p-2 text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsLimit(false)}
                      >
                        Cancel
                      </Button>
                      <Button>Confirm</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <div className="flex w-full items-center justify-between text-sm font-normal text-secondary-foreground">
            <div className="flex items-center space-x-2">
              <StrikePriceIcon />
              <span>Strike Price:</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>{strikePrice}</span>
              {transaction === 'buy' && (
                <Popover open={isStrike} onOpenChange={setIsStrike}>
                  <PopoverTrigger asChild>
                    <SquarePen
                      size={13}
                      className="cursor-pointer text-foreground hover:text-primary"
                    />
                  </PopoverTrigger>
                  <PopoverContent align="end" className="space-y-4 p-3">
                    <div className="flex flex-col space-y-2">
                      <Label>New Strike Price</Label>
                      <Input className="rounded-sm border-border p-2 text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsStrike(false)}
                      >
                        Cancel
                      </Button>
                      <Button>Confirm</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <div className="flex w-full items-center justify-between text-sm font-normal text-secondary-foreground">
            <div className="flex items-center space-x-2">
              <SizeIcon />
              <span>Size:</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>{size}</span>
              {transaction === 'buy' && (
                <Popover open={isSize} onOpenChange={setIsSize}>
                  <PopoverTrigger asChild>
                    <SquarePen
                      size={13}
                      className="cursor-pointer text-foreground hover:text-primary"
                    />
                  </PopoverTrigger>
                  <PopoverContent align="end" className="space-y-4 p-3">
                    <div className="flex flex-col space-y-2">
                      <Label>New Size</Label>
                      <Input className="rounded-sm border-border p-2 text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsSize(false)}
                      >
                        Cancel
                      </Button>
                      <Button>Confirm</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <div className="flex w-full items-center justify-between text-sm font-normal text-secondary-foreground">
            <div className="flex items-center space-x-2">
              <ExpiryIcon />
              <span>Expiry:</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>{expiry}</span>
              {transaction === 'buy' && (
                <Popover open={isExpiry} onOpenChange={setIsExpiry}>
                  <PopoverTrigger asChild>
                    <SquarePen
                      size={13}
                      className="cursor-pointer text-foreground hover:text-primary"
                    />
                  </PopoverTrigger>
                  <PopoverContent align="end" className="space-y-4 p-3">
                    <div className="space-y-2">
                      <Label className="text-xs">New Expiry</Label>
                      <Popover
                        open={isCalendarOpen}
                        onOpenChange={setIsCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start border-border p-2 text-left text-xs font-normal hover:bg-inherit hover:text-secondary-foreground [&_svg]:size-3',
                              !customDate && 'text-muted-foreground'
                            )}
                          >
                            <Calendar className="h-3 w-3" />
                            {customDate
                              ? format(customDate, 'PPP')
                              : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={customDate}
                            onSelect={(date) => {
                              setCustomDate(date)
                              setIsCalendarOpen(false)
                            }}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsExpiry(false)}
                      >
                        Cancel
                      </Button>
                      <Button>Confirm</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <div className="flex w-full items-center justify-between text-sm font-normal text-secondary-foreground">
            <div className="flex items-center space-x-2">
              <PurchaseDateIcon />
              <span>Date Order Placed:</span>
            </div>
            <span>{orderDate}</span>
          </div>

          <div className="flex w-full justify-end gap-2">
            <Button className="h-auto w-fit rounded-sm bg-secondary px-[10px] py-[6px]">
              <Ban className="p-0 text-secondary-foreground" />
              <span className="p-0 text-sm font-normal text-secondary-foreground">
                Cancel
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
