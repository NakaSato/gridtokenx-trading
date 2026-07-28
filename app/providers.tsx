'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import QueryProvider from '@/components/shared/QueryProvider'
import Connectionprovider from '@/lib/solana/connection-provider'
import { ContractProvider } from '@/features/trading/contract-provider'
import { AuthProvider } from '@/features/auth/provider'
import { PrivacyProvider } from '@/features/privacy/provider'
import { SidebarProvider } from '@/components/shared/SidebarContext'
import { WasmProvider } from '@/lib/wasm-provider'
import { OrderFillProvider } from '@/features/p2p/order-fill-context'
import { NotificationToastProvider } from '@/features/notifications/hooks/useNotificationToast'

// The single place the provider stack is composed. Order matters:
// ContractProvider needs the wallet adapters from Connectionprovider,
// everything auth-gated sits under AuthProvider.
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark-purple">
      <QueryProvider>
        <Connectionprovider>
          <ContractProvider>
            <AuthProvider>
                <PrivacyProvider>
                  <SidebarProvider>
                    <WasmProvider>
                      <OrderFillProvider>
                        <NotificationToastProvider>
                          {children}
                        </NotificationToastProvider>
                      </OrderFillProvider>
                    </WasmProvider>
                  </SidebarProvider>
                </PrivacyProvider>
            </AuthProvider>
          </ContractProvider>
        </Connectionprovider>
      </QueryProvider>
    </ThemeProvider>
  )
}
