import { ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Card, CardContent } from '../ui/card'
import { PortfolioChart } from './portfolio-chart'
import ProtectedRoute from '../ProtectedRoute'

export function PortfolioTabs() {
  return (
    <Tabs
      defaultValue="positions"
      className="flex w-full flex-1 flex-col space-y-4"
    >
      <div className="grid grid-cols-12 gap-5">
        <TabsList className="col-span-10 grid h-fit w-full grid-cols-5 rounded-sm border bg-inherit p-2">
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="orders">Open Orders</TabsTrigger>
          <TabsTrigger value="order-history">Order History</TabsTrigger>
          <TabsTrigger value="trade-history">Trade History</TabsTrigger>
          <TabsTrigger value="funding-history">Funding History</TabsTrigger>
        </TabsList>
        <Button variant={'outline'} className="col-span-2 h-fit py-3">
          Filter
          <ChevronDown />
        </Button>
      </div>
      <TabsContent value="positions" className="flex-1">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          <Card className="h-full rounded-sm">
            <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
              <p>No open positions</p>
              <p className="mt-2 text-sm">
                Your trading positions will appear here
              </p>
            </CardContent>
          </Card>
        </ProtectedRoute>
      </TabsContent>
      <TabsContent value="orders" className="flex-1">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          <Card className="h-full rounded-sm">
            <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
              <p>No open orders</p>
              <p className="mt-2 text-sm">
                Your pending orders will appear here
              </p>
            </CardContent>
          </Card>
        </ProtectedRoute>
      </TabsContent>
      <TabsContent value="order-history" className="flex-1">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          <Card className="h-full rounded-sm">
            <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
              <p>No order history</p>
              <p className="mt-2 text-sm">
                Your order history will appear here
              </p>
            </CardContent>
          </Card>
        </ProtectedRoute>
      </TabsContent>
      <TabsContent value="trade-history" className="flex-1">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          <Card className="h-full rounded-sm">
            <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
              <p>No trade history</p>
              <p className="mt-2 text-sm">
                Your completed trades will appear here
              </p>
            </CardContent>
          </Card>
        </ProtectedRoute>
      </TabsContent>
      <TabsContent value="funding-history" className="flex-1">
        <ProtectedRoute requireWallet={false} requireAuth={true}>
          <Card className="h-full rounded-sm">
            <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
              <p>No funding history</p>
              <p className="mt-2 text-sm">Funding payments will appear here</p>
            </CardContent>
          </Card>
        </ProtectedRoute>
      </TabsContent>
    </Tabs>
  )
}
