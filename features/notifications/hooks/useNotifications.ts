'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/provider'
import { useApiClient } from '@/lib/api/useApiClient'
import { queryKeys } from '@/lib/query/keys'
import type { Notification } from '@/types/features'

const PAGE_LIMIT = 20
/**
 * Backstop only. `useNotificationToast` invalidates this key the moment a
 * notification-bearing event lands on the trades socket, so the badge is
 * normally already correct before this fires.
 */
const POLL_MS = 30_000

export interface NotificationList {
  notifications: Notification[]
  unread_count: number
}

const EMPTY: NotificationList = { notifications: [], unread_count: 0 }

/**
 * The bell dropdown's list and unread count.
 *
 * Mark-as-read is optimistic: the row greys out and the badge drops on click,
 * as it did with the old local state, but the write is now reconciled against
 * the server on settle instead of being assumed correct forever.
 */
export function useNotifications() {
  const { token, isAuthenticated } = useAuth()
  const client = useApiClient(token ?? undefined)
  const queryClient = useQueryClient()

  const queryKey = queryKeys.notifications.list()

  const query = useQuery<NotificationList>({
    queryKey,
    queryFn: async () => {
      const res = await client.listNotifications({ limit: PAGE_LIMIT })
      if (res.error) throw new Error(res.error)
      return res.data
        ? {
            notifications: res.data.notifications,
            unread_count: res.data.unread_count,
          }
        : EMPTY
    },
    enabled: !!token && isAuthenticated,
    refetchInterval: POLL_MS,
  })

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.markNotificationAsRead(id)
      if (res.error) throw new Error(res.error)
      return id
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<NotificationList>(queryKey)
      queryClient.setQueryData<NotificationList>(queryKey, (prev) => {
        if (!prev) return prev
        const target = prev.notifications.find((n) => n.id === id)
        // Don't decrement for an already-read row — double-clicking one
        // notification would otherwise drive the badge below the truth.
        if (!target || target.is_read) return prev
        return {
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unread_count: Math.max(0, prev.unread_count - 1),
        }
      })
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const res = await client.markAllNotificationsAsRead()
      if (res.error) throw new Error(res.error)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<NotificationList>(queryKey)
      queryClient.setQueryData<NotificationList>(queryKey, (prev) =>
        prev
          ? {
              notifications: prev.notifications.map((n) => ({
                ...n,
                is_read: true,
              })),
              unread_count: 0,
            }
          : prev
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const data = query.data ?? EMPTY

  return {
    notifications: data.notifications,
    unreadCount: data.unread_count,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
  }
}
