import { useCallback, useContext, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { Activity, History, BookOpen, Clock, TrendingUp, RotateCw, Ban, EllipsisVertical } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

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
  const fetchData = useCallback(async () => {
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
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Error fetching trading data:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [fetchData])

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
    <Card className="flex h-[200px] w-full flex-col rounded-sm border border-border bg-card overflow-hidden">
      <CardHeader className="border-b bg-muted/20 px-4 py-3 md:px-6">
        <div className="flex w-full items-center justify-between">
          <Tabs defaultValue={activeTab} className="h-9">
            <TabsList className="h-full bg-secondary/50 p-1">
              <TabsTrigger
                value="Positions"
                className="h-full rounded-sm px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                onClick={() => handleClickTab('Positions')}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Positions</span>
                  {optioninfos.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {optioninfos.length}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="OpenOrders"
                className="h-full rounded-sm px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                onClick={() => handleClickTab('OpenOrders')}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Orders</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="History"
                className="h-full rounded-sm px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                onClick={() => handleClickTab('History')}
              >
                <div className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">History</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="Expired"
                className="h-full rounded-sm px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                onClick={() => handleClickTab('Expired')}
              >
                <div className="flex items-center gap-2">
                  <Ban className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Expired</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="OrderBook"
                className="h-full rounded-sm px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                onClick={() => handleClickTab('OrderBook')}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Order Book</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="mr-2 hidden items-center gap-1.5 text-[10px] text-muted-foreground md:flex">
              <Clock className="h-3 w-3" />
              <span>Refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-[11px] font-medium"
            >
              Liquidation
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-[11px] font-medium"
            >
              TP/SL
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                fetchData()
              }}
            >
              <RotateCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-hidden">
        <div className="animate-in fade-in duration-500 h-full flex flex-col">
          {loading ? (
            <div className="flex flex-col space-y-3 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'Positions' && (
                <div className={cn(
                  "flex h-full overflow-y-auto flex-col px-3 py-4 md:px-6",
                  optioninfos && optioninfos.length > 0 ? "space-y-4" : "justify-center items-center"
                )}>
                  {optioninfos && optioninfos.length > 0 ? (
                    <>
                      <div className="flex flex-col space-y-3">
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
                      </div>
                      <div className="pt-2">
                        <Pagination
                          currentPage={currentPage}
                          totalItems={optioninfos.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                        <Activity className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">No Positions Open</p>
                        <p className="text-xs text-muted-foreground">Your active futures and options will appear here.</p>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2 text-xs">
                        Start Trading
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'OpenOrders' && (
                <div className={cn(
                  "flex h-full overflow-y-auto flex-col px-3 py-4 md:px-6",
                  orderInfos && orderInfos.length > 0 ? "space-y-4" : "justify-center items-center"
                )}>
                  {orderInfos.length > 0 ? (
                    <>
                      <div className="flex flex-col space-y-3">
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
                      <div className="pt-2">
                        <Pagination
                          currentPage={currentPage}
                          totalItems={orderInfos.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">No Orders Open</p>
                        <p className="text-xs text-muted-foreground">Your pending limit orders will be listed here.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'History' && (
                <div className={cn(
                  "flex h-full overflow-y-auto flex-col px-3 py-4 md:px-6",
                  doneInfo.length > 0 ? "space-y-4" : "justify-center items-center"
                )}>
                  {doneInfo.length > 0 ? (
                    <OrderHistory doneOptioninfos={doneInfo} />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                        <History className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">No History Available</p>
                        <p className="text-xs text-muted-foreground">Your trade history will be compiled once you start trading.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Expired' && (
                <div className={cn(
                  "flex h-full overflow-y-auto flex-col px-3 py-4 md:px-6",
                  expiredInfos.length > 0 ? "space-y-4" : "justify-center items-center"
                )}>
                  {expiredInfos.length > 0 ? (
                    <ExpiredOptions infos={expiredInfos} onClaim={onClaim} />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                        <Ban className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">No Expired Positions</p>
                        <p className="text-xs text-muted-foreground">Your expired options and claims will appear here.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'OrderBook' && (
                <div className="h-full overflow-y-auto">
                  <OrderBook />
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
