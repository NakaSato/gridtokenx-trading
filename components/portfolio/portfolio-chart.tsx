import { TrendingUp } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

export function PortfolioChart() {
  return (
    <Card className="col-span-12 w-full rounded-sm lg:col-span-6">
      <CardContent className="h-full p-6">
        <div className="flex h-full items-center justify-center border-2 border-dashed">
          <div className="text-center">
            <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>Portfolio Performance Chart</p>
            <p className="text-sm">
              Connect wallet to view your portfolio data
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
