'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import toast from 'react-hot-toast'
import {
  Loader2,
  MapPin,
  Zap,
  CheckCircle,
  Gauge,
  SearchX,
  ShieldCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react'
import { PublicMeterResponse } from '@/types/meter'
import { Label } from '@/components/ui/label'

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
  const { token } = useAuth()
  const [meterId, setMeterId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [matchedMeter, setMatchedMeter] = useState<PublicMeterResponse | null>(null)
  const [searchDone, setSearchDone] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const client = useMemo(() => createApiClient(token || undefined), [token])

  // Auto-search for meter when ID is entered (debounced)
  const searchMeter = useCallback(async (serial: string) => {
    setIsSearching(true)
    setSearchError(null)
    setSearchDone(false)

    try {
      // Fetch public meters and match the entered ID against live meters
      const response = await client.getPublicMeters()
      if (response.error) {
        setSearchError('Failed to fetch meter data')
        setMatchedMeter(null)
        return
      }

      const query = serial.trim().toLowerCase()
      const meters = response.data || []
      const match =
        meters.find((m) => m.meter_id?.toLowerCase() === query) ??
        meters.find((m) => m.meter_id?.toLowerCase().includes(query)) ??
        null
      setMatchedMeter(match)
      setSearchDone(true)
    } catch (error) {
      setSearchError('Error searching for meter')
      setMatchedMeter(null)
    } finally {
      setIsSearching(false)
    }
  }, [client])

  // Debounced search effect
  useEffect(() => {
    if (meterId.trim().length < 3) {
      setMatchedMeter(null)
      setSearchError(null)
      setSearchDone(false)
      return
    }

    const timer = setTimeout(() => searchMeter(meterId), 500)
    return () => clearTimeout(timer)
  }, [meterId, searchMeter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meterId.trim()) {
      toast.error('Please enter a meter ID')
      return
    }

    setIsSubmitting(true)
    try {
      // Call register API with only serial_number - backend will auto-populate all data from simulator
      const result = await client.registerMeter({
        serial_number: meterId.trim(),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.data?.success) {
        toast.success(result.data.message || 'Smart meter registered successfully!')
        onSuccess?.()
        onClose()
        setMeterId('')
        setMatchedMeter(null)
        setSearchDone(false)
      } else {
        toast.error(result.data?.message || 'Failed to register meter')
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setMeterId('')
    setMatchedMeter(null)
    setSearchError(null)
    setSearchDone(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Gauge className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <DialogTitle>Register Smart Meter</DialogTitle>
              <DialogDescription>
                Enter your meter ID — location, type, and readings are fetched
                automatically.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meterId">Meter ID (Serial Number)</Label>
            <div className="relative">
              <Input
                id="meterId"
                className="pr-9 font-mono"
                placeholder="e.g. GRID-SM-001"
                value={meterId}
                onChange={(e) => setMeterId(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                required
                disabled={isSubmitting}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The system will automatically fetch location, type, and readings for this meter.
            </p>
          </div>

          {/* Live meter preview — matched against public meter feed */}
          {matchedMeter && (
            <div className="rounded-lg border border-green-600/30 bg-green-500/5 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Live meter found</span>
                </div>
                {matchedMeter.is_verified && (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              <div className="grid gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 shrink-0" />
                  <span className="capitalize">{matchedMeter.meter_type || 'Unknown type'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{matchedMeter.location || 'Location on record'}</span>
                </div>
                {(matchedMeter.current_generation != null ||
                  matchedMeter.current_consumption != null) && (
                  <div className="flex items-center gap-3 pt-0.5">
                    {matchedMeter.current_generation != null && (
                      <span className="flex items-center gap-1">
                        <ArrowUpFromLine className="h-3 w-3 text-green-600" />
                        {matchedMeter.current_generation.toFixed(2)} kWh
                      </span>
                    )}
                    {matchedMeter.current_consumption != null && (
                      <span className="flex items-center gap-1">
                        <ArrowDownToLine className="h-3 w-3 text-amber-600" />
                        {matchedMeter.current_consumption.toFixed(2)} kWh
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No live match — registration still allowed, data links when online */}
          {searchDone && !matchedMeter && !searchError && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
              <SearchX className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                No live meter matches this ID yet. You can still register — data
                links automatically once the meter comes online.
              </span>
            </div>
          )}

          {searchError && (
            <p className="text-xs text-red-500">{searchError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !meterId.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
