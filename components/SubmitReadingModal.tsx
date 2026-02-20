'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface SubmitReadingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  meterSerial?: string
}

export function SubmitReadingModal({
  isOpen,
  onClose,
  onSuccess,
  meterSerial = '',
}: SubmitReadingModalProps) {
  const [reading, setReading] = useState('')
  const [meterId, setMeterId] = useState(meterSerial)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // TODO: Implement actual submission logic
      await new Promise(resolve => setTimeout(resolve, 1000))
      onSuccess?.()
      onClose()
      setReading('')
      if (!meterSerial) setMeterId('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Meter Reading</DialogTitle>
          <DialogDescription>
            Submit your smart meter reading to mint energy tokens.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!meterSerial && (
            <div className="space-y-2">
              <Label htmlFor="meterId">Meter ID</Label>
              <Input
                id="meterId"
                placeholder="Enter meter ID"
                value={meterId}
                onChange={(e) => setMeterId(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="reading">Reading (kWh)</Label>
            <Input
              id="reading"
              type="number"
              step="0.01"
              placeholder="Enter reading"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
