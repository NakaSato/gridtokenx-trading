'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

function ConfidentialWallet() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidential Wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Manage your private token balances with zero-knowledge privacy.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div>
              <p className="font-medium">Private GTX</p>
              <p className="text-xs text-muted-foreground">Shielded Balance</p>
            </div>
            <p className="text-lg font-semibold">0.00</p>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div>
              <p className="font-medium">Pending Shield</p>
              <p className="text-xs text-muted-foreground">Processing</p>
            </div>
            <p className="text-lg font-semibold">0.00</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1">Shield</Button>
          <Button variant="outline" className="flex-1">
            Unshield
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { ConfidentialWallet }
export default ConfidentialWallet
