'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="bg-destructive/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Something went wrong!
          </h1>
          <p className="text-sm text-muted-foreground">
            An error occurred while loading this page. This might be due to a
            network issue or a temporary problem.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-destructive/5 rounded-lg p-4 text-left">
            <p className="text-xs font-medium text-destructive">
              Error Details:
            </p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {error?.message || 'Unknown error'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          If this problem persists, please contact{' '}
          <a
            href="https://discord.gg/gridtokenx"
            className="text-primary hover:underline"
          >
            support
          </a>
        </p>
      </div>
    </div>
  )
}
