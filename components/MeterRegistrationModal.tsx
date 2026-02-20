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

interface MeterRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function MeterRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: MeterRegistrationModalProps) {
  const [meterId, setMeterId] = useState('')
  const [location, setLocation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // TODO: Implement actual registration logic
      await new Promise(resolve => setTimeout(resolve, 1000))
      onSuccess?.()
      onClose()
      setMeterId('')
      setLocation('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register Smart Meter</DialogTitle>
          <DialogDescription>
            Enter your smart meter details to register it on the GridTokenX network.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Enter location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
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
              {isSubmitting ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
