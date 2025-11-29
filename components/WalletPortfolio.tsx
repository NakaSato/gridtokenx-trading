import { ArrowDown, ArrowUp } from '@/public/svgs/icons'
import Image from 'next/image'
import { Separator } from './ui/separator'
import { useState } from 'react'

export default function WalletPortfolio() {
  const [holdingsOpen, setHoldingsOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [futuresOpen, setFuturesOpen] = useState(false)
  return (
    <div className="flex w-full flex-col space-y-2">
      <div className="flex w-full flex-col rounded-sm border p-4 pt-3">
        <div
          className="flex w-full cursor-pointer justify-between"
          onClick={() => setHoldingsOpen(!holdingsOpen)}
        >
          <div className="flex items-center space-x-[6px]">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              Holdings
            </span>
            <span className="flex h-4 items-center rounded-[4px] border border-primary px-[6px] py-[5px] text-[10px] text-primary">
              4 Tokens
            </span>
          </div>
          <div className="flex items-center space-x-4 text-secondary-foreground">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              $229.38
            </span>
            {holdingsOpen ? <ArrowUp /> : <ArrowDown />}
          </div>
        </div>
        {holdingsOpen && (
          <>
            <div className="py-4">
              <Separator />
            </div>
            <div className="flex w-full flex-col space-y-4">
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/solana.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Solana
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      0.809232976 SOL
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $152.26
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/bitcoin.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Bitcoin
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      2.5756152651 BTC
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $63.54
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/render.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Render
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      0.809232976 Render
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $10.26
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/ethereum.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Ethereum
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      5.482435434 ETH
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $3.68
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex w-full flex-col rounded-sm border p-4 pt-3">
        <div
          className="flex w-full cursor-pointer justify-between"
          onClick={() => setOptionsOpen(!optionsOpen)}
        >
          <div className="flex items-center space-x-[6px]">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              Options
            </span>
            <span className="flex h-4 items-center rounded-[4px] border border-primary px-[6px] py-[5px] text-[10px] text-primary">
              4 Positions
            </span>
          </div>
          <div className="flex items-center space-x-4 text-secondary-foreground">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              $529.38
            </span>
            {optionsOpen ? <ArrowUp /> : <ArrowDown />}
          </div>
        </div>
        {optionsOpen && (
          <>
            <div className="py-4">
              <Separator />
            </div>
            <div className="flex w-full flex-col space-y-4">
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/solana.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Solana
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      0.809232976 SOL
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $152.26
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/bitcoin.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Bitcoin
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      2.5756152651 BTC
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $63.54
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/render.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Render
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      0.809232976 Render
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $10.26
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/ethereum.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Ethereum
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      5.482435434 ETH
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $3.68
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex w-full flex-col rounded-sm border p-4 pt-3">
        <div
          className="flex w-full cursor-pointer justify-between"
          onClick={() => setFuturesOpen(!futuresOpen)}
        >
          <div className="flex items-center space-x-[6px]">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              Futures
            </span>
            <span className="flex h-4 items-center rounded-[4px] border border-primary px-[6px] py-[5px] text-[10px] text-primary">
              4 Positions
            </span>
          </div>
          <div className="flex items-center space-x-4 text-secondary-foreground">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              $129.38
            </span>
            {futuresOpen ? <ArrowUp /> : <ArrowDown />}
          </div>
        </div>
        {futuresOpen && (
          <>
            <div className="py-4">
              <Separator />
            </div>
            <div className="flex w-full flex-col space-y-4">
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/solana.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Solana
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      0.809232976 SOL
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $152.26
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/bitcoin.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Bitcoin
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      2.5756152651 BTC
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $63.54
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/render.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Render
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      0.809232976 Render
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $10.26
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <Image
                    src="/images/ethereum.png"
                    alt="solana"
                    height={32}
                    width={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="h-4 text-xs font-medium text-foreground">
                      Ethereum
                    </span>
                    <span className="h-4 text-xs font-medium text-secondary-foreground">
                      5.482435434 ETH
                    </span>
                  </div>
                </div>
                <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">
                  $3.68
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
