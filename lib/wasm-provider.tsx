'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { initWasm, isWasmLoaded } from './wasm-bridge'

interface WasmContextType {
    isLoaded: boolean
    error: Error | null
}

const WasmContext = createContext<WasmContextType>({
    isLoaded: false,
    error: null,
})

export function useWasm() {
    return useContext(WasmContext)
}

interface WasmProviderProps {
    children: ReactNode
}

/**
 * Provider component that initializes WASM on app startup.
 * Wrap your app with this provider to enable WASM-accelerated calculations.
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx or app/providers.tsx
 * import { WasmProvider } from '@/lib/wasm-provider'
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <WasmProvider>
 *       {children}
 *     </WasmProvider>
 *   )
 * }
 * ```
 */
export function WasmProvider({ children }: WasmProviderProps) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        // Only initialize once
        if (isWasmLoaded()) {
            setIsLoaded(true)
            return
        }

        initWasm('/gridtokenx_wasm.wasm')
            .then(() => {
                setIsLoaded(true)
            })
            .catch((err) => {
                console.error('[WasmProvider] Failed to initialize WASM:', err)
                setError(err instanceof Error ? err : new Error(String(err)))
                // App still works - JS fallbacks will be used
            })
    }, [])

    return (
        <WasmContext.Provider value={{ isLoaded, error }}>
            {children}
        </WasmContext.Provider>
    )
}
