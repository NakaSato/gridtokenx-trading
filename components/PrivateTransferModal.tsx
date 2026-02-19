'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import { PublicKey } from '@solana/web3.js'

interface PrivateTransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PrivateTransferModal({
  open,
  onOpenChange,
}: PrivateTransferModalProps) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { transfer } = usePrivacy()

  const handleTransfer = async () => {
    if (!recipient || !amount) return
    setIsLoading(true)
    try {
      await transfer(new PublicKey(recipient), parseFloat(amount))
      setRecipient('')
      setAmount('')
      onOpenChange(false)
    } catch (error) {
      console.error('Private transfer failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Private Transfer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send tokens privately using stealth addresses and ElGamal
            encryption.
          </p>
          <Input
            placeholder="Recipient address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button
            onClick={handleTransfer}
            disabled={isLoading || !recipient || !amount}
          >
            {isLoading ? 'Processing...' : 'Send Privately'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
