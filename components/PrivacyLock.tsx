'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'

interface PrivacyLockProps {
  onUnlock: () => Promise<void>
  isDeriving: boolean
}

export default function PrivacyLock({
  onUnlock,
  isDeriving,
}: PrivacyLockProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Lock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lock your private tokens for enhanced privacy and earn additional
          rewards.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Locked Amount</p>
            <p className="text-lg font-semibold">0.00 GTX</p>
          </div>
          <div>
            <p className="text-muted-foreground">Lock Bonus</p>
            <p className="text-lg font-semibold">+2.5%</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1">Lock Tokens</Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onUnlock}
            disabled={isDeriving}
          >
            {isDeriving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unlocking...
              </>
            ) : (
              'Unlock'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
