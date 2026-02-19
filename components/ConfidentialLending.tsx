'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

export default function ConfidentialLending() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidential Lending</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lend your private tokens to earn interest while maintaining confidentiality.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Available to Lend</p>
            <p className="text-lg font-semibold">0.00 GTX</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current APY</p>
            <p className="text-lg font-semibold">5.2%</p>
          </div>
        </div>
        <Button className="w-full">Start Lending</Button>
      </CardContent>
    </Card>
  )
}
