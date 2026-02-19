'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function PrivacyRules() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Shielded amounts are private and cannot be traced</li>
          <li>• Private transfers use stealth addresses for anonymity</li>
          <li>• View keys allow selective disclosure of balances</li>
          <li>• All transactions are encrypted end-to-end</li>
          <li>• Zero-knowledge proofs verify transactions without revealing amounts</li>
        </ul>
      </CardContent>
    </Card>
  )
}
