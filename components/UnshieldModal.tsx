'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface UnshieldModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UnshieldModal({ open, onOpenChange }: UnshieldModalProps) {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleUnshield = async () => {
    if (!amount) return
    setIsLoading(true)
    try {
      // Unshield logic would go here
      setAmount('')
      onOpenChange(false)
    } catch (error) {
      console.error('Unshield failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unshield Tokens</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Convert private tokens back to public tokens.
          </p>
          <Input
            type="number"
            placeholder="Amount to unshield"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={handleUnshield} disabled={isLoading || !amount}>
            {isLoading ? 'Processing...' : 'Unshield'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
