'use client'

import { createContext, useMemo, ReactNode } from 'react'
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, getProvider, Program, Provider, Idl } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { connection } from '@/utils/const'
import registryIdl from '../lib/idl/registry.json'
import energyTokenIdl from '../lib/idl/energy_token.json'

// Read-only on-chain access for the energy dashboard. Token minting is NOT done
// here: the Aggregator Bridge mints surplus server-side per 15-min billing bin
// (aggregator-signed, via Chain Bridge). The UI never initiates a mint — it only
// reads chain/program state. Do not re-add a client-side mint path.
interface EnergyContextType {
    registryProgram: Program | undefined
    energyTokenProgram: Program | undefined
    fetchMeterReading: (meterId: string) => Promise<any>
}

export const EnergyContext = createContext<EnergyContextType>({
    registryProgram: undefined,
    energyTokenProgram: undefined,
    fetchMeterReading: async () => null,
})

export const EnergyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { publicKey } = useWallet()
    const wallet = useAnchorWallet()

    // Programs are derived state from (wallet, publicKey) — memoize rather than
    // setState-in-effect. `undefined` until a wallet is connected.
    const { registryProgram, energyTokenProgram } = useMemo(() => {
        if (!wallet || !publicKey) {
            return { registryProgram: undefined, energyTokenProgram: undefined }
        }
        let provider: Provider
        try {
            provider = getProvider()
        } catch {
            provider = new AnchorProvider(connection, wallet, {})
        }

        const REGISTRY_ID = new PublicKey(process.env.NEXT_PUBLIC_REGISTRY_PROGRAM_ID!)
        const ENERGY_TOKEN_ID = new PublicKey(process.env.NEXT_PUBLIC_ENERGY_TOKEN_PROGRAM_ID!)

        return {
            // @ts-expect-error anchor Program 3-arg ctor (programId, provider) overload
            registryProgram: new Program(registryIdl as Idl, REGISTRY_ID, provider) as Program,
            // @ts-expect-error anchor Program 3-arg ctor (programId, provider) overload
            energyTokenProgram: new Program(energyTokenIdl as Idl, ENERGY_TOKEN_ID, provider) as Program,
        }
    }, [wallet, publicKey])

    const fetchMeterReading = async (meterId: string) => {
        if (!registryProgram || !publicKey) return null
        try {
            const [meterAccount] = PublicKey.findProgramAddressSync(
                [Buffer.from("meter"), publicKey.toBuffer(), Buffer.from(meterId)],
                registryProgram.programId
            );
            const account = await (registryProgram.account as any).meter.fetch(meterAccount)
            return account
        } catch (e) {
            console.error("Fetch meter failed", e)
            return null
        }
    }

    return (
        <EnergyContext.Provider value={{
            registryProgram,
            energyTokenProgram,
            fetchMeterReading
        }}>
            {children}
        </EnergyContext.Provider>
    )
}
