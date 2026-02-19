'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface ShieldModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ShieldModal({ open, onOpenChange }: ShieldModalProps) {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleShield = async () => {
    if (!amount) return
    setIsLoading(true)
    try {
      // TODO: Implement shield tokens functionality
      console.log('Shielding tokens:', parseFloat(amount))
      setAmount('')
      onOpenChange(false)
    } catch (error) {
      console.error('Shield failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shield Tokens</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Convert public tokens to private tokens using ElGamal encryption.
          </p>
          <Input
            type="number"
            placeholder="Amount to shield"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={handleShield} disabled={isLoading || !amount}>
            {isLoading ? 'Processing...' : 'Shield'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
