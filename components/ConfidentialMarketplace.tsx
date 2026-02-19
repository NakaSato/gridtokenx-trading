'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

export default function ConfidentialMarketplace() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidential Marketplace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Trade energy tokens privately with other users. All transactions are confidential.
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Active Listings</span>
            <span>24</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>24h Volume</span>
            <span>1,234.56 GTX</span>
          </div>
        </div>
        <Button className="w-full">Browse Listings</Button>
      </CardContent>
    </Card>
  )
}
