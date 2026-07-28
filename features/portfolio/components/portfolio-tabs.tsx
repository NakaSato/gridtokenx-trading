'use client'

import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import { useAuth } from '@/features/auth/provider'
import { useExpiredOptions, useOptionSettlement } from '@/hooks/useOptions'
import {
  usePositions,
  useOpenOrders,
  useTradeHistory,
} from '@/features/trading/hooks/usePositionsData'
import { useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import OpenPositions from '@/features/trading/components/OpenPositions'
import OpenOptionOrders from '@/features/trading/components/OpenOptionOrders'
import OrderHistory from '@/features/trading/components/OrderHistory'
import { useContext } from 'react'
import { ContractContext } from '@/contexts/contractProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { connection } from '@/utils/const'
import ExpiredOptions from '@/features/trading/components/ExpiredOptions'
import { CarbonCredits } from '@/features/portfolio/components/carbon-credits'
import P2PStatus from '@/features/p2p/components/P2PStatus'

export function PortfolioTabs() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const { data: positions = [], isLoading: positionsLoading } = usePositions()
  const { data: orders = [], isLoading: ordersLoading } = useOpenOrders()
  const { data: history = [], isLoading: historyLoading } = useTradeHistory()
  const { publicKey, sendTransaction } = useWallet()

  const { program } = useContext(ContractContext)

  const { data: expiredInfos = [], isLoading: expiredLoading } = useExpiredOptions(program, publicKey)
  const { claimMutation, exerciseMutation } = useOptionSettlement(program, connection, publicKey, sendTransaction)

  const onClaim = (optionindex: string | number, solPrice: number) => {
    claimMutation.mutate({ index: optionindex as any, solPrice })
  }
  const onExercise = (index: string | number) => {
    exerciseMutation.mutate(index as any)
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!token) return
    try {
      const apiClient = createApiClient(token)
      const res = await apiClient.cancelOrder(orderId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Order canceled successfully')
        queryClient.invalidateQueries({ queryKey: ['portfolio-orders'] })
      }
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  const loading = positionsLoading || ordersLoading || historyLoading || expiredLoading

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
    <Tabs defaultValue="system-status" className="flex w-full flex-1 flex-col space-y-4">
      <div className="overflow-x-auto">
        <TabsList className="flex h-fit w-max rounded-sm border bg-inherit p-1">
          <TabsTrigger value="system-status" className="whitespace-nowrap text-xs sm:text-sm">P2P Activity</TabsTrigger>
          <TabsTrigger value="positions" className="whitespace-nowrap text-xs sm:text-sm">Positions</TabsTrigger>
          <TabsTrigger value="orders" className="whitespace-nowrap text-xs sm:text-sm">Orders</TabsTrigger>
          <TabsTrigger value="order-history" className="whitespace-nowrap text-xs sm:text-sm">Order History</TabsTrigger>
          <TabsTrigger value="trade-history" className="whitespace-nowrap text-xs sm:text-sm">Trade History</TabsTrigger>
          <TabsTrigger value="funding-history" className="whitespace-nowrap text-xs sm:text-sm">Funding</TabsTrigger>
          <TabsTrigger value="carbon-credits" className="whitespace-nowrap text-xs sm:text-sm">Carbon Credits</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="system-status" className="mt-6 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          <P2PStatus />
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="positions" className="mt-6 min-h-[300px]">
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

      <TabsContent value="orders" className="mt-6 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {loading ? renderLoading() : (
            <div className="flex flex-col gap-3">
              {orders.length > 0 ? (
                orders.map((order, idx) => (
                  <OpenOptionOrders key={idx} {...order} orderId={order.index} onCancel={handleCancelOrder} />
                ))
              ) : renderEmptyState("No open orders", "Your pending orders will appear here")}
            </div>
          )}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="order-history" className="mt-6 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {loading ? renderLoading() : (
            history.length > 0 ? (
              <OrderHistory doneOptioninfos={history} />
            ) : renderEmptyState("No order history", "Your order history will appear here")
          )}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="trade-history" className="mt-6 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {loading ? renderLoading() : (
            history.length > 0 ? (
              <OrderHistory doneOptioninfos={history.filter((t: any) => t.transactionType === 'Buy' || t.transactionType === 'Sell')} />
            ) : renderEmptyState("No trade history", "Your completed trades will appear here")
          )}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="funding-history" className="mt-6 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          {renderEmptyState("No funding history", "Funding payments will appear here")}
        </ProtectedRoute>
      </TabsContent>

      <TabsContent value="carbon-credits" className="mt-6 min-h-[300px]">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          <CarbonCredits />
        </ProtectedRoute>
      </TabsContent>
    </Tabs>
  )
}
