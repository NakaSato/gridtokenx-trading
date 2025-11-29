import Image from 'next/image'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Input } from './ui/input'
import { Search } from 'lucide-react'

interface PoolDropDownProps {
  isOpen: boolean
  handleOpenChange: (state: boolean) => void
  poolDatas: any
  selectedToken: number
  logo: string
  handleClickToken: (idx: number) => void
}

export default function PoolDropdown({
  isOpen,
  handleOpenChange,
  poolDatas,
  selectedToken,
  logo,
  handleClickToken,
}: PoolDropDownProps) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button className="flex h-fit w-fit rounded-full bg-transparent p-0">
          <Image
            src={poolDatas ? poolDatas[selectedToken].img : logo}
            alt={'Sol'}
            width={20}
            height={20}
            className="h-6 w-6 rounded-full"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[420px] rounded-sm bg-accent px-3 py-5"
      >
        <div className="flex w-full flex-col space-y-4 px-2">
          <div className="flex w-full flex-col space-y-3">
            <div className="flex h-fit w-full items-center space-x-2 rounded-sm border bg-secondary px-4 py-[10px] text-sm text-secondary-foreground focus-within:border-primary">
              <Input
                type="text"
                placeholder="Search Token"
                className="h-fit rounded-none border-none p-0 text-foreground shadow-none placeholder:text-secondary-foreground"
              />
              <Search size={16} className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex w-full space-x-[10px]">
              {poolDatas &&
                poolDatas.map((token: any, index: number) => (
                  <div
                    key={index}
                    className="flex w-fit cursor-pointer items-center space-x-[6px] rounded-[8px] bg-secondary p-2"
                    onClick={() => handleClickToken(index)}
                  >
                    <Image
                      src={token.img}
                      alt={token.name}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    <span className="text-sm">{token.symbol}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="flex justify-between text-xs font-normal text-secondary-foreground">
            <span>All Tokens</span>
            <span>Balance</span>
          </div>
        </div>
        {poolDatas &&
          poolDatas.map((token: any, index: number) => (
            <div
              key={index}
              onClick={() => handleClickToken(index)}
              className="flex h-fit w-full cursor-pointer justify-between space-x-4 rounded-[8px] p-2 hover:bg-secondary"
            >
              <div className="flex items-center space-x-[6px]">
                <Image
                  src={token.img}
                  alt={token.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full"
                />
                <div className="flex h-8 flex-col justify-center space-y-0">
                  <div className="flex h-fit items-center space-x-1">
                    <span className="text-base font-medium text-foreground">
                      {token.symbol}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-secondary-foreground">
                    {token.name}
                  </span>
                </div>
              </div>
              <div className="flex h-8 flex-col justify-center space-y-0">
                <div className="flex space-x-1 text-sm font-medium text-foreground">
                  <span>0.346371829</span>
                  <span>•</span>
                  <span>$87.29</span>
                </div>
                <span className="text-end text-xs font-medium text-secondary-foreground">
                  EPjFWd...yTDt1v
                </span>
              </div>
            </div>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
