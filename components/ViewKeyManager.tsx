'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

export default function ViewKeyManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>View Key Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Manage your view keys for decrypting private transaction data.
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Active View Keys</span>
            <span>1</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shared With</span>
            <span>0 parties</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1">Generate Key</Button>
          <Button variant="outline" className="flex-1">Export</Button>
        </div>
      </CardContent>
    </Card>
  )
}
