'use client'
import Image from 'next/image'
import { Badge } from './ui/badge'
import { useState } from 'react'
import { ArrowDown, ArrowUp } from '@/public/svgs/icons'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import Collateral from './Collateral'
import Tpsl from './Tpsl'
import CloseFutures from './CloseFutures'

interface OpenFuturesProps {
  logo: string
  token: string
  symbol: string
  type: string
  position: string
  leverage: number
  entry: number
  liquidation: number
  size: number
  collateral: number
  tpsl: number
  purchaseDate: string
}

export default function OpenFutures({
  logo,
  token,
  symbol,
  type,
  position,
  leverage,
  entry,
  liquidation,
  size,
  collateral,
  tpsl,
  purchaseDate,
}: OpenFuturesProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <div className="flex w-full flex-col rounded-sm bg-accent">
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
          <Badge
            className={`${position === 'long' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} flex h-fit w-fit items-center justify-center rounded-[3px] px-1 py-[1px] text-xs font-semibold`}
          >
            {leverage}x{' '}
            {position.charAt(0).toUpperCase() + position.slice(1).toLowerCase()}
          </Badge>
          <span className="text-xs font-medium text-secondary-foreground">
            {type === 'dated' ? purchaseDate : 'PERPS'}
          </span>
        </div>
        <div></div>
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
        <div className="w-full space-y-4 border-t-2 border-backgroundSecondary px-4 pb-4 pt-2">
          <Table>
            <TableHeader>
              <TableRow className="grid h-7 w-full grid-cols-10 gap-10 whitespace-nowrap">
                <TableHead className="">Entry Price</TableHead>
                <TableHead className="">Mark Price</TableHead>
                <TableHead className="">Size</TableHead>
                <TableHead className="">Value</TableHead>
                <TableHead className="">Liq. Price</TableHead>
                <TableHead className="">Levarage</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center gap-1">
                    Collateral <Collateral />
                  </div>
                </TableHead>
                <TableHead className="">
                  <div className="flex items-center gap-1">
                    TP/SL <Tpsl />
                  </div>
                </TableHead>
                <TableHead className="">PNL</TableHead>
                <TableHead className=""></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="grid w-full grid-cols-10 gap-10">
                <TableCell className="flex items-center space-x-2">
                  {entry}
                </TableCell>
                <TableCell className="flex items-center space-x-2">
                  $107.32
                </TableCell>
                <TableCell className="flex items-center space-x-2">
                  {size}
                </TableCell>
                <TableCell className="flex items-center space-x-2">
                  $107.32
                </TableCell>
                <TableCell className="flex items-center space-x-2">
                  ${liquidation}
                </TableCell>
                <TableCell className="flex items-center space-x-2">
                  {leverage}x
                </TableCell>
                <TableCell className="flex items-center space-x-1">
                  <span>${collateral}</span>
                </TableCell>
                <TableCell className="flex items-center space-x-1">
                  <span>${tpsl}</span>
                </TableCell>
                <TableCell className="flex items-center space-x-2">
                  $107.32
                </TableCell>
                <TableCell className="flex items-center space-x-2">
                  <CloseFutures />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {/* <div className="w-full grid grid-cols-9 py-1.5 text-xs gap-2">
                        <div className="flex flex-col space-y-0 col-span-1">
                            <span className="text-left align-middle font-medium text-secondary-foreground">
                                Entry Price
                            </span>
                            <span className="flex space-x-2 items-center">
                                {entry}
                            </span>
                        </div>
                        <div className="flex flex-col space-y-0 col-span-1">
                            <span className="text-left align-middle font-medium text-secondary-foreground">
                                Mark Price
                            </span>
                            <span className="flex space-x-2 items-center">
                                {entry}
                            </span>
                        </div>
                        <div className="flex flex-col space-y-0 col-span-1">
                            <span className="text-left align-middle font-medium text-secondary-foreground">
                                Size
                            </span>
                            <span className="flex space-x-2 items-center">
                                {size}
                            </span>
                        </div>
                        <div className="flex flex-col space-y-0 col-span-1">
                            <span className="text-left align-middle font-medium text-secondary-foreground">
                                Value
                            </span>
                            <span className="flex space-x-2 items-center">
                                {entry}
                            </span>
                        </div>
                        <div className="flex flex-col space-y-0 col-span-1">
                            <span className="text-left align-middle font-medium text-secondary-foreground">
                                Liq. Price
                            </span>
                            <span className="flex space-x-2 items-center">
                                {liquidation}
                            </span>
                        </div>
                        <div className="flex flex-col space-y-0 col-span-1">
                            <span className="text-left align-middle font-medium text-secondary-foreground">
                                Leverage
                            </span>
                            <span className="flex space-x-2 items-center">
                                {leverage}x
                            </span>
                        </div>
                        <div className="flex flex-col space-y-0 col-span-1">
                            <span className="text-left align-middle font-medium text-secondary-foreground">
                                Collateral
                            </span>
                            <span className="flex space-x-2 items-center">
                                <span>
                                    ${collateral} 
                                </span>
                                <Collateral />
                            </span>
                        </div>
                        <div className="flex flex-col space-y-0 col-span-1">
                            <span className="text-left align-middle font-medium text-secondary-foreground">
                                TP/SL
                            </span>
                            <span className="flex space-x-2 items-center">
                                <span>
                                    ${tpsl} 
                                </span>
                                <Tpsl />
                            </span>
                        </div>
                        <div className="flex flex-col space-y-0 col-span-1">
                            <span className="text-left align-middle font-medium text-secondary-foreground">
                                PNL
                            </span>
                            <span className="flex space-x-2 items-center">
                                $107.32
                            </span>
                        </div>
                        <div className="flex flex-col space-y-0 col-span-1">
                            <span className="text-left align-middle font-medium text-secondary-foreground">
                                Date
                            </span>
                            <span className="flex space-x-2 items-center">
                                {purchaseDate}
                            </span>
                        </div>
                        <div className="flex flex-col space-y-0 col-span-1">
                            <span className="text-left align-middle font-medium text-secondary-foreground">
                                
                            </span>
                            <span className="flex space-x-2 items-center">
                                <CloseFutures />
                            </span>
                        </div>
                    </div> */}
        </div>
      )}
    </div>
  )
}
