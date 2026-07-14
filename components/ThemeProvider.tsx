'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // No `mounted` gate: next-themes must render on the server so its
  // pre-hydration <script> lands in the initial HTML (prevents theme flash).
  // Deferring it to a client-only mount made React 19 try to render that
  // <script> on the client — which it refuses to execute — and returned null
  // on the server, dropping all children from SSR. <html suppressHydrationWarning>
  // in app/layout.tsx already absorbs the attribute mismatch.
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
