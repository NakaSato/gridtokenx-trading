import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Loading indicator for in-flight work. Use <Skeleton /> instead when you know
 * the shape of the content that is coming.
 *
 * Two deliberate deviations from the upstream shadcn spinner:
 *
 * - It wraps `Loader2`, not `Loader`. Every existing call site used Loader2, and
 *   swapping the glyph would have restyled ~40 loaders in one go.
 * - No default size class. Upstream ships `size-4`, but tailwind-merge does not
 *   treat `size-*` as conflicting with `h-*`/`w-*`, so a caller passing `h-8 w-8`
 *   would keep both and let stylesheet order decide. A default would also beat
 *   lucide's numeric `size={n}` prop, which several call sites use.
 */
function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof Loader2>) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={cn('animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
