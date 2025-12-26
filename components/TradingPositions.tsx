import { Ban, EllipsisVertical, RotateCw } from 'lucide-react'
import { Button } from './ui/button'
import { useContext, useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { cn } from '@/lib/utils'
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
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import type { Order } from '@/lib/data/Positions'
import { format } from 'date-fns'

export default function TradingPositions() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('Positions')
  const [optioninfos, setOptionInfos] = useState<Position[]>([])
  const [orderInfos, setOrderInfos] = useState<Order[]>([])
  const [expiredInfos, setExpiredInfos] = useState<ExpiredOption[]>([])
  const [doneInfo, setDoneInfo] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

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
    const fetchData = async () => {
      if (!token) return
      setLoading(true)
      try {
        const apiClient = createApiClient(token)

        // 1. Fetch Futures Positions
        const positionsRes = await apiClient.getFuturesPositions() as any
        if (positionsRes.data && positionsRes.data.data) {
          const mappedPositions: Position[] = positionsRes.data.data.map(
            (pos: any) => ({
              index: pos.id,
              token: pos.product_symbol || 'Unknown',
              logo: '/images/solana.png', // Default logo
              symbol: pos.product_symbol || 'GRX',
              type: pos.side === 'long' ? 'Call' : 'Put',
              strikePrice: parseFloat(pos.entry_price),
              expiry: 'Perpetual', // Futures don't have fixed expiry in this context
              size: parseFloat(pos.quantity),
              pnl: parseFloat(pos.unrealized_pnl || '0'),
              greeks: {
                delta: 0,
                gamma: 0,
                theta: 0,
                vega: 0,
              },
            })
          )
          setOptionInfos(mappedPositions)
        }

        // 2. Fetch Trading Orders
        const ordersRes = await apiClient.getOrders({ status: 'active' }) as any
        if (ordersRes.data && ordersRes.data.data) {
          const mappedOrders: Order[] = ordersRes.data.data.map(
            (order: any) => ({
              index: order.id,
              token: 'GRID',
              logo: '/images/grid.png',
              symbol: 'GRX',
              type: order.order_type || 'Limit',
              transaction: order.side.toLowerCase(),
              limitPrice: parseFloat(order.price_per_kwh),
              strikePrice: 0,
              expiry: order.expires_at
                ? format(new Date(order.expires_at), 'MM/dd/yyyy')
                : 'N/A',
              orderDate: format(new Date(order.created_at), 'MM/dd/yyyy'),
              size: parseFloat(order.energy_amount),
            }))
          setOrderInfos(mappedOrders)
        }

        // 3. Fetch Trade History
        const tradesRes = await apiClient.getTrades({ limit: 50 }) as any
        if (tradesRes.data && tradesRes.data.trades) {
          const mappedHistory: Transaction[] = tradesRes.data.trades.map(
            (trade: any) => ({
              transactionID: trade.id,
              token: {
                name: 'GridToken',
                symbol: 'GRX',
                logo: '/images/grid.png',
              },
              transactionType: trade.role === 'buyer' ? 'Buy' : 'Sell',
              optionType: 'Spot',
              strikePrice: parseFloat(trade.price),
              expiry: format(new Date(trade.executed_at), 'dd MMM, yyy HH:mm:ss'),
            })
          )
          setDoneInfo(mappedHistory)
        }
      } catch (err) {
        console.error('Error fetching trading data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  useEffect(() => {
    if (program && pub) {
      // Keep legacy blockchain fetching for now if needed, or replace entirely
      // This part currently only fills expiredInfos which we don't have a clear API for yet
      ; (async () => {
        const [_, expiredpinfo, __] = await getDetailInfos(program, pub)
        setExpiredInfos(expiredpinfo)
      })()
    }
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
        <div className={cn(
          "flex min-h-[300px] flex-col px-3 py-4 pb-[10px] md:px-6",
          optioninfos && optioninfos.length > 0 ? "justify-between space-y-[10px]" : "justify-center"
        )}>
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
        <div className={cn(
          "flex min-h-[300px] flex-col px-3 py-4 pb-[10px] md:px-6",
          orderInfos && orderInfos.length > 0 ? "justify-between space-y-[10px]" : "justify-center"
        )}>
          {orderInfos.length > 0 ? (
            <>
              <div className="flex flex-col space-y-[10px]">
                {orderInfos
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
                  totalItems={orderInfos.length}
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
