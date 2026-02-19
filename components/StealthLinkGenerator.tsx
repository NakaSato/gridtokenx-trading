'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'

interface StealthLinkGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function StealthLinkGenerator({ open, onOpenChange }: StealthLinkGeneratorProps) {
  const [stealthLink, setStealthLink] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const generateLink = async () => {
    setIsLoading(true)
    try {
      // Generate stealth link logic would go here
      const link = `https://gridtokenx.app/stealth/${Date.now()}`
      setStealthLink(link)
    } catch (error) {
      console.error('Failed to generate stealth link:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stealth Link Generator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a stealth address link for receiving private payments.
          </p>
          {stealthLink && (
            <div className="rounded bg-muted p-2 text-xs break-all">
              {stealthLink}
            </div>
          )}
          <Button onClick={generateLink} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Stealth Link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
