'use client'
import { FuturesTransaction } from '@/lib/data/WalletActivity'
import { CopyIcon, SendIcon } from '@/public/svgs/icons'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface FuturesOrderHistoryProps {
  dummyFutures: FuturesTransaction[]
}

export default function FuturesOrderHistory({
  dummyFutures,
}: FuturesOrderHistoryProps) {
  return (
    <div className="hidden w-full flex-col space-y-[14px] md:flex">
      {dummyFutures.map((tx, idx) => (
        <div className="flex w-full items-center justify-between" key={idx}>
          <div className="flex w-full items-center space-x-[10px]">
            <Image
              src={tx.token.iconPath}
              alt={tx.token.symbol}
              width={28}
              height={28}
              className="rounded-full"
            />
            <div className="flex flex-col justify-center">
              <span className="text-xs font-medium text-foreground">
                {tx.transactionID}
              </span>
              <span className="flex items-center text-xs font-normal text-secondary-foreground">
                {tx.token.name} • {tx.futureType}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex justify-end space-x-2">
              <CopyIcon />
              <SendIcon />
            </div>
            <span className="flex items-center whitespace-nowrap text-xs font-normal text-secondary-foreground">
              {tx.purchaseDate}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
