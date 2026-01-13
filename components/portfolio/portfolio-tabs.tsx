'use client'

import { ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Card, CardContent } from '../ui/card'
import ProtectedRoute from '../ProtectedRoute'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import { Position, Order } from '@/lib/data/Positions'
import { Transaction } from '@/lib/data/WalletActivity'
import { format } from 'date-fns'
import OpenPositions from '../OpenPositions'
import OpenOptionOrders from '../OpenOptionOrders'
import OrderHistory from '../OrderHistory'
import { useContext } from 'react'
import { ContractContext, ExpiredOption } from '@/contexts/contractProvider'
import ExpiredOptions from '../ExpiredOptions'
import { CarbonCredits } from './carbon-credits'

export function PortfolioTabs() {
  const { token, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('positions')
  const [positions, setPositions] = useState<Position[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [history, setHistory] = useState<Transaction[]>([])
  const [expiredInfos, setExpiredInfos] = useState<ExpiredOption[]>([])
  const [loading, setLoading] = useState(false)

  const { program, getDetailInfos, pub, onClaimOption, onExerciseOption } =
    useContext(ContractContext)

  const onClaim = (optionindex: number, solPrice: number) => {
    onClaimOption(optionindex, solPrice)
  }
  const onExercise = (index: number) => {
    onExerciseOption(index)
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !isAuthenticated) return
      setLoading(true)
      try {
        const apiClient = createApiClient(token)

        // Fetch Positions
        const positionsRes = await apiClient.getFuturesPositions() as any
        if (positionsRes.data && positionsRes.data.data) {
          const mappedPositions: Position[] = positionsRes.data.data.map(
            (pos: any) => ({
              index: pos.id,
              token: pos.product_symbol || 'Unknown',
              logo: '/images/solana.png',
              symbol: pos.product_symbol || 'GRX',
              type: pos.side === 'long' ? 'Call' : 'Put',
              strikePrice: parseFloat(pos.entry_price),
              expiry: 'Perpetual',
              size: parseFloat(pos.quantity),
              pnl: parseFloat(pos.unrealized_pnl || '0'),
              greeks: { delta: 0, gamma: 0, theta: 0, vega: 0 },
            })
          )
          setPositions(mappedPositions)
        }

        // Fetch Orders
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
          setOrders(mappedOrders)
        }

        // Fetch Trade History
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
              quantity: parseFloat(trade.quantity),
              totalValue: parseFloat(trade.total_value),
              wheelingCharge: trade.wheeling_charge ? parseFloat(trade.wheeling_charge) : undefined,
              lossCost: trade.loss_cost ? parseFloat(trade.loss_cost) : undefined,
              effectiveEnergy: trade.effective_energy ? parseFloat(trade.effective_energy) : undefined,
              buyerZoneId: trade.buyer_zone_id,
              sellerZoneId: trade.seller_zone_id,
            })
          )
          setHistory(mappedHistory)
        }
      } catch (err) {
        console.error('Error fetching portfolio data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchData()
    }
  }, [token, isAuthenticated])

  useEffect(() => {
    if (program && pub) {
      ; (async () => {
        const [_, expiredpinfo, __] = await getDetailInfos(program, pub)
        setExpiredInfos(expiredpinfo)
      })()
    }
  }, [program, pub, getDetailInfos])

  const renderEmptyState = (message: string, subMessage: string) => (
    <Card className="h-full rounded-sm border-dashed">
      <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
        <p className="font-medium text-foreground">{message}</p>
        <p className="mt-2 text-sm text-muted-foreground">{subMessage}</p>
      </CardContent>
    </Card>
  )

  const renderLoading = () => (
    <div className="flex min-h-[300px] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <Tabs
      defaultValue="positions"
      className="flex w-full flex-1 flex-col space-y-4"
      onValueChange={setActiveTab}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="grid h-fit w-full grid-cols-2 rounded-sm border bg-inherit p-1 sm:w-fit sm:grid-cols-6">
          <TabsTrigger value="positions" className="text-xs sm:text-sm">Positions</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs sm:text-sm">Orders</TabsTrigger>
          <TabsTrigger value="order-history" className="text-xs sm:text-sm">Order History</TabsTrigger>
          <TabsTrigger value="trade-history" className="text-xs sm:text-sm">Trade History</TabsTrigger>
          <TabsTrigger value="funding-history" className="text-xs sm:text-sm">Funding</TabsTrigger>
          <TabsTrigger value="carbon-credits" className="text-xs sm:text-sm">Carbon Credits</TabsTrigger>
        </TabsList>
        <Button variant={'outline'} className="h-fit py-2 text-sm">
          Filter
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <TabsContent value="positions" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {loading ? renderLoading() : (
            <div className="flex flex-col gap-3">
              {positions.length > 0 || expiredInfos.length > 0 ? (
                <>
                  {positions.map((pos, idx) => (
                    <OpenPositions key={idx} {...pos} onExercise={() => onExercise(pos.index)} />
                  ))}
                  {expiredInfos.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">Expired Positions</h4>
                      <ExpiredOptions infos={expiredInfos} onClaim={onClaim} />
                    </div>
                  )}
                </>
              ) : renderEmptyState("No open positions", "Your trading positions will appear here")}
            </div>
          )}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="orders" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {loading ? renderLoading() : (
            <div className="flex flex-col gap-3">
              {orders.length > 0 ? (
                orders.map((order, idx) => (
                  <OpenOptionOrders key={idx} {...order} />
                ))
              ) : renderEmptyState("No open orders", "Your pending orders will appear here")}
            </div>
          )}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="order-history" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {loading ? renderLoading() : (
            history.length > 0 ? (
              <OrderHistory doneOptioninfos={history} />
            ) : renderEmptyState("No order history", "Your order history will appear here")
          )}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="trade-history" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {loading ? renderLoading() : (
            history.length > 0 ? (
              <OrderHistory doneOptioninfos={history} />
            ) : renderEmptyState("No trade history", "Your completed trades will appear here")
          )}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="funding-history" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {renderEmptyState("No funding history", "Funding payments will appear here")}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="carbon-credits" className="mt-2 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          <CarbonCredits />
        </ProtectedRoute>
      </TabsContent>
    </Tabs>
  )
}
