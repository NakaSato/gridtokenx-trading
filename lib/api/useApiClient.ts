'use client'

import { useEffect, useState } from 'react'
import { createApiClient } from '@/lib/api-client'

/**
 * Stable ApiClient instance whose token tracks the argument. Kept as a hook
 * (rather than a module singleton) so a token change re-authorizes the same
 * client without tearing down callers' references.
 */
export function useApiClient(token?: string) {
  const [client] = useState(() => createApiClient(token))

  useEffect(() => {
    if (token) {
      client.setToken(token)
    } else {
      client.clearToken()
    }
  }, [client, token])

  return client
}
