'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import QueryProvider from '@/components/shared/QueryProvider'
import Connectionprovider from '@/contexts/connectionprovider'
import { ContractProvider } from '@/contexts/contractProvider'
import { AuthProvider } from '@/contexts/AuthProvider'
import { SocketProvider } from '@/contexts/SocketContext'
import { PrivacyProvider } from '@/contexts/PrivacyProvider'
import { SidebarProvider } from '@/components/shared/SidebarContext'
import { WasmProvider } from '@/lib/wasm-provider'
import { TradingProvider } from '@/contexts/TradingProvider'
import { NotificationToastProvider } from '@/hooks/useNotificationToast'

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
              <SocketProvider>
                <PrivacyProvider>
                  <SidebarProvider>
                    <WasmProvider>
                      <TradingProvider>
                        <NotificationToastProvider>
                          {children}
                        </NotificationToastProvider>
                      </TradingProvider>
                    </WasmProvider>
                  </SidebarProvider>
                </PrivacyProvider>
              </SocketProvider>
            </AuthProvider>
          </ContractProvider>
        </Connectionprovider>
      </QueryProvider>
    </ThemeProvider>
  )
}
