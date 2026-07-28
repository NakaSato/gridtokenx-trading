import { InfoIcon, NotificationIcon, RedCircle } from '@/public/svgs/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { XIcon, BellOff, CheckCheck, Settings2, Bell } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/features/auth/provider'
import { createApiClient } from '@/lib/api-client'
import type { Notification } from '@/types/features'
import { formatDistanceToNow } from 'date-fns'
import NotificationPreferences from '@/features/notifications/components/NotificationPreferences'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

function NotificationItem({
  item,
  isMobile = false,
  onMarkRead,
}: {
  item: Notification
  isMobile?: boolean
  onMarkRead: (id: string) => void
}) {
  return (
    <div
      className={cn(
        'w-full p-4 transition-colors hover:bg-secondary/30',
        !item.is_read && 'bg-primary/5'
      )}
    >
      <div className="flex w-full space-x-3">
        <div
          className={cn(
            'h-fit rounded-sm p-[9px]',
            item.is_read
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-primary/20 text-primary'
          )}
        >
          <InfoIcon />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-normal leading-relaxed text-foreground">
            {item.message}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] text-secondary-foreground opacity-70">
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
              })}
            </span>
            {!item.is_read && (
              <button
                onClick={() => onMarkRead(item.id)}
                className="text-[10px] font-medium text-primary hover:underline"
              >
                Mark read
              </button>
            )}
          </div>
        </div>
        {!item.is_read && (
          <div className="pt-1">
            <RedCircle />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Notifications() {
  const { token, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [view, setView] = useState<'list' | 'settings'>('list')

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const apiClient = createApiClient(token)
      const data = await apiClient.listNotifications({ limit: 20 })
      if (data && data.data) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unread_count)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, fetchNotifications])

  const markAsRead = async (id: string) => {
    if (!token) return
    try {
      const apiClient = createApiClient(token)
      await apiClient.markNotificationAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!token || unreadCount === 0) return
    try {
      const apiClient = createApiClient(token)
      await apiClient.markAllNotificationsAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  return (
    <>
      <DropdownMenu onOpenChange={(open) => !open && setView('list')}>
        <DropdownMenuTrigger className="relative hidden focus:outline-none sm:flex">
          <div className="rounded-sm bg-secondary p-[9px] text-foreground transition-all hover:text-primary">
            <NotificationIcon />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="flex w-[350px] flex-col rounded-sm border border-border bg-accent p-0 shadow-2xl"
        >
          <div className="flex w-full items-center justify-between border-b border-border/50 px-4 py-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
              {view === 'list' ? (
                <>Notifications {unreadCount > 0 && `(${unreadCount})`}</>
              ) : (
                <>
                  <Settings2 size={12} />
                  Preferences
                </>
              )}
            </span>
            <div className="flex items-center gap-1">
              {view === 'list' ? (
                <>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-[10px] text-primary hover:bg-primary/5 hover:text-primary/80"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck size={12} />
                      Mark read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => setView('settings')}
                  >
                    <Settings2 size={14} />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-primary hover:text-primary/80"
                  onClick={() => setView('list')}
                >
                  Back
                </Button>
              )}
            </div>
          </div>
          <div className="custom-scrollbar max-h-[450px] overflow-y-auto p-3">
            {view === 'list' ? (
              <>
                {loading && notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center space-y-2 py-12 opacity-50">
                    <Spinner className="h-5 w-5 text-primary" />
                    <span className="text-xs">Loading alerts...</span>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="-m-3">
                    {notifications.map((n) => (
                      <div key={n.id}>
                        <NotificationItem item={n} onMarkRead={markAsRead} />
                        <Separator className="opacity-30" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 py-12 opacity-50">
                    <BellOff className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs">No notifications yet</span>
                  </div>
                )}
              </>
            ) : (
              <NotificationPreferences />
            )}
          </div>
          {view === 'list' && notifications.length > 0 && (
            <div className="border-t border-border/50 p-2">
              <Button
                variant="ghost"
                className="h-8 w-full text-xs text-secondary-foreground hover:text-foreground"
              >
                View All Activity
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="relative focus:outline-none sm:hidden">
          <div className="rounded-[12px] bg-secondary p-[9px] text-foreground hover:text-primary">
            <NotificationIcon />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                {unreadCount}
              </span>
            )}
          </div>
        </DialogTrigger>
        <DialogContent className="flex h-full w-full flex-col gap-0 border-none bg-accent p-0 outline-none">
          <div className="flex w-full items-center justify-between border-b border-border px-4 py-3">
            <DialogTitle className="text-base font-medium text-foreground">
              Notifications
            </DialogTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <CheckCheck size={16} />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0"
                onClick={() => setIsOpen(false)}
              >
                <XIcon size={18} className="text-secondary-foreground" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-1">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id}>
                  <NotificationItem item={n} isMobile onMarkRead={markAsRead} />
                  <Separator className="opacity-50" />
                </div>
              ))
            ) : (
              <div className="flex h-full flex-col items-center justify-center space-y-4 opacity-50">
                <BellOff size={48} className="text-muted-foreground" />
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
