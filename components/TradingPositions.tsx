import { Ban, EllipsisVertical, RotateCw } from 'lucide-react'
import { Button } from './ui/button'
import { useContext, useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import OpenPositions from './OpenPositions'
import OrderHistory from './OrderHistory'
import { orders, Position, positions } from '@/lib/data/Positions'
import ExpiredOptions from './ExpiredOptions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { ContractContext, ExpiredOption } from '@/contexts/contractProvider'
import { Transaction } from '@/lib/data/WalletActivity'
import { BN } from '@coral-xyz/anchor'
import Pagination from './Pagination'
import OpenOptionOrders from './OpenOptionOrders'
import OrderBook from './OrderBook'

export default function TradingPositions() {
  const [activeTab, setActiveTab] = useState<string>('Positions')
  const [optioninfos, setOptionInfos] = useState<Position[]>([])
  const [expiredInfos, setExpiredInfos] = useState<ExpiredOption[]>([])
  const [doneInfo, setDoneInfo] = useState<Transaction[]>([])
  const { program, getDetailInfos, pub, onClaimOption, onExerciseOption } =
    useContext(ContractContext)

  const handleClickTab = (state: string) => {
    if (activeTab !== state) {
      setActiveTab(state)
    }
  }
  const onClaim = (optionindex: number, solPrice: number) => {
    onClaimOption(optionindex, solPrice)
  }
  const onExercise = (index: number) => {
    onExerciseOption(index)
  }
  useEffect(() => {
    ; (async () => {
      if (program && pub) {
        const [pinfo, expiredpinfo, doneinfo] = await getDetailInfos(
          program,
          pub
        )
        setOptionInfos(pinfo)
        setExpiredInfos(expiredpinfo)
        setDoneInfo(doneinfo)
      }
    })()
  }, [program, pub, getDetailInfos])

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const dummyPositions = positions
  const dummyOrders = orders

  const actionTextMap: Record<string, string> = {
    Positions: 'Close all',
    OpenOrders: 'Cancel all',
    Expired: 'Claim all',
  }

  return (
    <div className="flex h-fit w-full flex-col rounded-sm border">
      <div className="flex w-full justify-between border-b px-3 py-1 md:px-6 md:py-3">
        <Tabs defaultValue={activeTab} className="p-0">
          <TabsList className="flex w-full gap-2 bg-inherit p-0 text-secondary-foreground md:gap-3 lg:gap-6">
            <TabsTrigger
              value="Positions"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
              onClick={() => handleClickTab('Positions')}
            >
              Positions
            </TabsTrigger>
            <TabsTrigger
              value="OpenOrders"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
              onClick={() => handleClickTab('OpenOrders')}
            >
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="Expired"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
              onClick={() => handleClickTab('Expired')}
            >
              Expired
            </TabsTrigger>
            <TabsTrigger
              value="History"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
              onClick={() => handleClickTab('History')}
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="OrderBook"
              className="rounded-none border-b border-transparent px-2 py-[2px] text-[11px] data-[state=active]:border-primary md:text-sm"
              onClick={() => handleClickTab('OrderBook')}
            >
              Order Book
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="hidden items-center gap-3 md:flex">
          <Button className="h-auto w-full rounded-sm bg-secondary p-2">
            <RotateCw className="text-secondary-foreground" />
          </Button>
          {activeTab !== 'History' && (
            <Button className="h-auto w-full rounded-sm bg-secondary px-[10px] py-[6px]">
              <Ban className="p-0 text-secondary-foreground" />
              {actionTextMap[activeTab] && (
                <span className="p-0 text-sm font-normal text-secondary-foreground">
                  {actionTextMap[activeTab]}
                </span>
              )}
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-auto w-fit rounded-sm bg-inherit p-[6px] shadow-none md:hidden">
              <EllipsisVertical className="text-secondary-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-fit rounded-[12px] p-1"
          >
            <DropdownMenuItem className="w-fit gap-0 space-x-[6px]">
              <RotateCw className="w-fit text-secondary-foreground" />
              <span>Reload</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="w-fit gap-0 space-x-[6px]">
              <Ban className="text-secondary-foreground" />
              {actionTextMap[activeTab] && (
                <span className="p-0 text-sm font-normal text-secondary-foreground">
                  {actionTextMap[activeTab]}
                </span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {activeTab === 'Positions' && (
        <div className="flex min-h-[300px] flex-col justify-between space-y-[10px] px-3 py-4 pb-[10px] md:px-6">
          {optioninfos && optioninfos.length > 0 ? (
            <>
              {optioninfos.map((position, index) => (
                <OpenPositions
                  key={index}
                  index={position.index}
                  token={position.token}
                  logo={position.logo}
                  symbol={position.symbol}
                  type={position.type}
                  strikePrice={position.strikePrice}
                  expiry={position.expiry}
                  size={position.size}
                  pnl={position.pnl}
                  greeks={position.greeks}
                  onExercise={() => onExercise(position.index)}
                />
              ))}
              <div className="w-full pb-4">
                <Pagination
                  currentPage={currentPage}
                  totalItems={optioninfos.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-grow items-center justify-center text-center text-sm text-muted-foreground">
              No Positions Open <br /> Start Trading Now
            </div>
          )}

          {/* {dummyPositions.map((position, index) => (
            <OpenPositions
              key={index}
              index={position.index}
              token={position.token}
              logo={position.logo}
              symbol={position.symbol}
              type={position.type}
              strikePrice={position.strikePrice}
              expiry={position.expiry}
              size={position.size}
              pnl={position.pnl}
              greeks={position.greeks}
              onExercise={() => onExercise(position.index)}
            />
          ))}
          <div className="pb-4 w-full">
            <Pagination
              currentPage={currentPage}
              totalItems={dummyPositions.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div> */}
        </div>
      )}
      {activeTab === 'Expired' && (
        <div className="flex min-h-[300px] md:pb-[44px]">
          {expiredInfos.length > 0 ? (
            <ExpiredOptions infos={expiredInfos} onClaim={onClaim} />
          ) : (
            <div className="flex flex-grow items-center justify-center text-center text-sm text-muted-foreground">
              No Expired Positions <br /> Start Trading Now
            </div>
          )}
        </div>
      )}
      {activeTab === 'OpenOrders' && (
        <div className="flex min-h-[300px] flex-col justify-between space-y-[10px] px-3 py-4 pb-[10px] md:px-6">
          {dummyOrders.length > 0 ? (
            <>
              <div className="flex flex-col space-y-[10px]">
                {dummyOrders
                  .slice(indexOfFirstItem, indexOfLastItem)
                  .map((pos, idx) => (
                    <OpenOptionOrders
                      key={idx}
                      logo={pos.logo}
                      token={pos.token}
                      symbol={pos.symbol}
                      type={pos.type}
                      limitPrice={pos.limitPrice}
                      transaction={pos.transaction}
                      strikePrice={pos.strikePrice}
                      expiry={pos.expiry}
                      size={pos.size}
                      orderDate={pos.orderDate}
                    />
                  ))}
              </div>
              <div className="w-full pb-4">
                <Pagination
                  currentPage={currentPage}
                  totalItems={dummyOrders.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-grow items-center justify-center text-center text-sm text-muted-foreground">
              No Orders Open <br /> Start Trading Now
            </div>
          )}
        </div>
      )}
      {activeTab === 'History' && (
        <div className="flex min-h-[300px] flex-col justify-between space-y-[10px] px-3 py-4 pb-[20px] md:px-6 md:pb-[10px]">
          {doneInfo.length > 0 ? (
            <OrderHistory doneOptioninfos={doneInfo} />
          ) : (
            <div className="flex flex-grow items-center justify-center text-center text-sm text-muted-foreground">
              No History Available
              <br /> Start Trading Now
            </div>
          )}
        </div>
      )}
      {activeTab === 'OrderBook' && (
        <div className="min-h-[300px] p-0">
          <OrderBook />
        </div>
      )}
    </div>
  )
}
