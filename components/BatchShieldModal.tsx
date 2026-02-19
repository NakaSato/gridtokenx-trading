'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface BatchShieldModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BatchShieldModal({ open, onOpenChange }: BatchShieldModalProps) {
  const [amounts, setAmounts] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleBatchShield = async () => {
    if (!amounts) return
    setIsLoading(true)
    try {
      // Batch shield logic would go here
      setAmounts('')
      onOpenChange(false)
    } catch (error) {
      console.error('Batch shield failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batch Shield Tokens</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Shield multiple token amounts in a single transaction for better privacy and efficiency.
          </p>
          <Input
            type="text"
            placeholder="Enter amounts (comma separated)"
            value={amounts}
            onChange={(e) => setAmounts(e.target.value)}
          />
          <Button onClick={handleBatchShield} disabled={isLoading || !amounts}>
            {isLoading ? 'Processing...' : 'Batch Shield'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
