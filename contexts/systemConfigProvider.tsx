'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface SystemConfig {
  environment: string
  solana_rpc_url: string
  solana_cluster: string
  registry_program_id: string
  oracle_program_id: string
  governance_program_id: string
  energy_token_program_id: string
  trading_program_id: string
  energy_token_mint: string
  currency_token_mint: string
}

interface SystemConfigContextType {
  config: SystemConfig | null
  loading: boolean
  error: string | null
}

const SystemConfigContext = createContext<SystemConfigContextType>({
  config: null,
  loading: true,
  error: null,
})

export const SystemConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Use the public API gateway to fetch system configuration
        const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://apisix.gridtokenx-coresystem.orb.local'
        const response = await fetch(`${apiBase}/api/v1/system/config`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch system config: ${response.statusText}`)
        }

        const data = await response.json()
        setConfig(data)
        setLoading(false)
        console.log('🚀 System Configuration Loaded via API:', data)
      } catch (err: any) {
        console.error('❌ Failed to discover system configuration:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  return (
    <SystemConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </SystemConfigContext.Provider>
  )
}

export const useSystemConfig = () => useContext(SystemConfigContext)
