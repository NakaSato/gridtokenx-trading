'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface StakePrivateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function StakePrivateModal({ open, onOpenChange }: StakePrivateModalProps) {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleStake = async () => {
    if (!amount) return
    setIsLoading(true)
    try {
      // Stake logic would go here
      setAmount('')
      onOpenChange(false)
    } catch (error) {
      console.error('Stake failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stake Private Tokens</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Stake your private tokens to earn rewards while maintaining privacy.
          </p>
          <Input
            type="number"
            placeholder="Amount to stake"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={handleStake} disabled={isLoading || !amount}>
            {isLoading ? 'Processing...' : 'Stake'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
