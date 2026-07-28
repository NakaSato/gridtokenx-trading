'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth/provider'
import { createApiClient } from '@/lib/api-client'
import type { NotificationPreferences } from '@/types/features'
import { Button } from '@/components/ui/button'
import { Settings2, Bell, Mail, Smartphone, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Spinner } from '@/components/ui/spinner'

type PreferenceToggleProps = {
  label: string
  description: string
  icon: any
  active: boolean
  saving: boolean
  onToggle: () => void
}

function PreferenceToggle({
  label,
  description,
  icon: Icon,
  active,
  saving,
  onToggle,
}: PreferenceToggleProps) {
  return (
    <div className="group flex items-start justify-between rounded-sm border bg-background p-4 transition-all hover:border-primary/30">
      <div className="flex gap-3">
        <div
          className={cn(
            'h-fit rounded-full p-2',
            active
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon size={18} />
        </div>
        <div className="flex flex-col space-y-1">
          <span className="text-sm font-semibold">{label}</span>
          <span className="max-w-[200px] text-[10px] leading-relaxed text-muted-foreground">
            {description}
          </span>
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={saving}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          active ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
            active ? 'translate-x-4' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )
}

export default function NotificationPreferences() {
  const { token } = useAuth()
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchPrefs = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const apiClient = createApiClient(token)
      const response = await apiClient.getNotificationPreferences()
      if (response.data) {
        setPrefs(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchPrefs()
  }, [fetchPrefs])

  const togglePref = async (key: keyof NotificationPreferences) => {
    if (!token || !prefs) return
    const newVal = !prefs[key]
    const updatedPrefs = { ...prefs, [key]: newVal }

    // Optimistic update
    setPrefs(updatedPrefs)

    setSaving(true)
    try {
      const apiClient = createApiClient(token)
      await apiClient.updateNotificationPreferences({ [key]: newVal })
    } catch (error) {
      toast.error('Failed to update preference')
      // Rollback
      setPrefs(prefs)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !prefs) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2 py-10 opacity-50">
        <Spinner className="h-6 w-6 text-primary" />
        <span className="text-sm">Loading settings...</span>
      </div>
    )
  }

  if (!prefs) return null

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Settings2 size={12} />
          Channel Settings
        </h4>
        <div className="grid gap-3">
          <PreferenceToggle
            saving={saving}
            icon={Mail}
            label="Email Notifications"
            description="Receive trading summaries and security alerts via email."
            active={prefs.email_enabled}
            onToggle={() => togglePref('email_enabled')}
          />
          <PreferenceToggle
            saving={saving}
            icon={Smartphone}
            label="Push Notifications"
            description="Real-time alerts directly on your browser or device."
            active={prefs.push_enabled}
            onToggle={() => togglePref('push_enabled')}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Bell size={12} />
          Trigger Settings
        </h4>
        <div className="grid gap-3">
          <PreferenceToggle
            saving={saving}
            icon={ShieldCheck}
            label="Trade Alerts"
            description="Get notified when your P2P or Recurring orders are executed."
            active={prefs.trade_notifications}
            onToggle={() => togglePref('trade_notifications')}
          />
          <PreferenceToggle
            saving={saving}
            icon={Bell}
            label="Price Alerts"
            description="Notifications for custom price targets you've set."
            active={prefs.alert_notifications}
            onToggle={() => togglePref('alert_notifications')}
          />
          <PreferenceToggle
            saving={saving}
            icon={Settings2}
            label="System Notifications"
            description="Core platform updates, maintenance, and security announcements."
            active={prefs.system_notifications}
            onToggle={() => togglePref('system_notifications')}
          />
        </div>
      </div>
    </div>
  )
}
