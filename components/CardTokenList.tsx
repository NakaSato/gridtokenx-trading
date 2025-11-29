'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { ChevronDown, Search, XIcon } from 'lucide-react'
import { Input } from './ui/input'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { tokenList, Token, USDC } from '@/lib/data/tokenlist'

interface CardTokenListProps {
  onSymbolChange: (symbol: string) => void
  onPaymentTokenChange: (symbol: string) => void
  onIdxChange: (idx: number) => void
  active: number
  type: 'chart' | 'paying'
}

export default function CardTokenList({
  onSymbolChange,
  onIdxChange,
  active,
  type,
  onPaymentTokenChange,
}: CardTokenListProps) {
  const tokens = tokenList
  const [paymentTokens, setPaymentTokens] = useState<Token[]>([tokens[active]])

  const [isOpen, setIsOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<Token>(tokens[active])
  const [payment, setPayment] = useState<Token>(paymentTokens[0])

  useEffect(() => {
    setSelectedToken(tokens[active])
    const newPaymentTokens = [tokens[active], USDC]
    setPaymentTokens(newPaymentTokens)
    setPayment(newPaymentTokens[0])
  }, [active, tokens])

  const handleTokenSelect = (value: Token, idx: number) => {
    if (type === 'chart') {
      setSelectedToken(value)
      setIsOpen(false)
      onSymbolChange(value.pythSymbol)
      onPaymentTokenChange(value.pythSymbol)
      onIdxChange(idx)
    } else {
      setIsOpen(false)
      setPayment(value)
      onPaymentTokenChange(value.pythSymbol)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {type === 'chart' ? (
          <Button
            variant="outline"
            className="h-12 rounded-sm border-border pl-3 pr-4"
          >
            <Image
              src={selectedToken.iconPath}
              alt={selectedToken.symbol}
              className="mr-3 h-7 w-7 rounded-full"
              width={28}
              height={28}
            />
            <div className="mr-2 flex flex-col items-start">
              <span className="text-base font-semibold">
                {selectedToken.symbol.toUpperCase()}-USD
              </span>
              <span className="text-xs text-secondary-foreground">
                {selectedToken.name}
              </span>
            </div>
            <ChevronDown size={18} className="text-muted-foreground" />
          </Button>
        ) : (
          <Button className="flex h-fit w-fit gap-1 rounded-sm bg-backgroundSecondary p-1">
            <Image
              src={payment.iconPath}
              alt={payment.symbol}
              className="h-5 w-5 rounded-full"
              width={24}
              height={24}
            />
            <span className="text-base text-secondary-foreground">
              {payment.symbol}
            </span>
            <ChevronDown className="text-secondary-foreground" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex h-full w-full flex-col gap-0 bg-accent p-5 shadow-none sm:rounded-sm md:h-auto md:max-w-md">
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center justify-between p-0 text-base font-medium text-foreground">
            <span>Tokens</span>
            <Button
              className="rounded-sm border bg-transparent p-[9px] shadow-none [&_svg]:size-[18px]"
              onClick={() => setIsOpen(false)}
            >
              <XIcon className="text-foreground" />
            </Button>
          </DialogTitle>
          <Separator />
          <div className="flex h-fit w-full items-center space-x-2 rounded-sm bg-secondary px-4 py-[10px] text-sm text-secondary-foreground">
            <Input
              type="text"
              placeholder="Search Token"
              className="h-fit rounded-none border-none p-0 text-foreground shadow-none placeholder:text-secondary-foreground"
            />
            <Search size={16} className="h-4 w-4 text-foreground" />
          </div>
        </DialogHeader>

        {type === 'chart' ? (
          <ScrollArea className="mt-4 h-72 pr-3">
            <div className="grid grid-cols-3 gap-4">
              {tokens.map((token, idx) => (
                <Button
                  className="grid h-fit grid-cols-[auto_1fr] items-center gap-4 rounded-sm border bg-inherit p-2"
                  key={idx}
                  onClick={() => handleTokenSelect(token, idx)}
                >
                  <Image
                    src={token.iconPath}
                    alt={token.symbol}
                    className="rounded-full"
                    width={28}
                    height={28}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-semibold text-foreground">
                      {token.symbol.toUpperCase()}
                    </span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-left text-xs text-secondary-foreground">
                      {token.name}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {paymentTokens.map((token, idx) => (
              <Button
                className="grid h-fit grid-cols-[auto_1fr] items-center gap-4 rounded-sm border bg-inherit p-2"
                key={idx}
                onClick={() => handleTokenSelect(token, idx)}
              >
                <Image
                  src={token.iconPath}
                  alt={token.symbol}
                  className="rounded-full"
                  width={28}
                  height={28}
                />
                <div className="flex min-w-0 flex-col">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-semibold text-foreground">
                    {token.symbol.toUpperCase()}
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-left text-xs text-secondary-foreground">
                    {token.name}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
