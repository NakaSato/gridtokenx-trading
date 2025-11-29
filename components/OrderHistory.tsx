'use client'

import { Transaction } from '@/lib/data/WalletActivity'
import {
  CallIconDark,
  CopyIcon,
  PutIconDark,
  SendIcon,
} from '@/public/svgs/icons'
import Image from 'next/image'
import { Separator } from './ui/separator'

export default function OrderHistory({
  doneOptioninfos,
}: {
  doneOptioninfos: Transaction[]
}) {
  return (
    <>
      <div className="hidden w-full flex-col space-y-[14px] md:flex">
        {doneOptioninfos &&
          doneOptioninfos.map((tx) => (
            <div
              className="flex w-full items-center justify-between"
              key={tx.transactionID}
            >
              <div className="flex w-full items-center space-x-[10px]">
                <div className="flex h-9 flex-col items-center justify-center -space-y-0.5">
                  <Image
                    src={tx.token.logo}
                    alt="eth icon"
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <div className="rounded-full ring ring-background">
                    {tx.transactionType === 'Put' ? (
                      <PutIconDark width="20" height="20" />
                    ) : (
                      <CallIconDark width="20" height="20" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-medium text-foreground">
                    {tx.transactionID}
                  </span>
                  <span className="flex items-center text-xs font-normal text-secondary-foreground">
                    {tx.token.name} • {tx.transactionType} Option •
                    <span className="px-1">Vanilla</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex justify-end space-x-2">
                  <CopyIcon />
                  <SendIcon />
                </div>
                <span className="flex items-center whitespace-nowrap text-xs font-normal text-secondary-foreground">
                  {tx.expiry}
                </span>
              </div>
            </div>
          ))}
      </div>
      <div className="flex w-full flex-col md:hidden">
        {doneOptioninfos &&
          doneOptioninfos.map((tx, index) => (
            <>
              <div
                className="flex w-full flex-col items-center space-y-3"
                key={tx.transactionID}
              >
                <div className="flex w-full items-center space-x-[10px]">
                  <div className="flex h-9 flex-col items-center justify-center -space-y-0.5">
                    <Image
                      src={tx.token.logo}
                      alt="eth icon"
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <div className="rounded-full ring ring-background">
                      {tx.transactionType === 'Put' ? (
                        <PutIconDark width="20" height="20" />
                      ) : (
                        <CallIconDark width="20" height="20" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-medium text-foreground">
                      {tx.transactionID}
                    </span>
                    <span className="flex items-center text-xs font-normal text-secondary-foreground">
                      {tx.token.name} • {tx.transactionType} Option •
                      <span className="px-1">Vanilla</span>
                    </span>
                  </div>
                </div>
                <div className="flex w-full justify-between">
                  <span className="flex items-center whitespace-nowrap text-xs font-normal text-secondary-foreground">
                    {tx.expiry}
                  </span>
                  <div className="flex justify-end space-x-2 text-secondary-foreground">
                    <CopyIcon />
                    <SendIcon />
                  </div>
                </div>
              </div>
              {index !== 8 && <Separator className="my-[14px]" />}
            </>
          ))}
      </div>
    </>
  )
}
