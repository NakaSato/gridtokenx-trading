'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Program, AnchorProvider, Idl, setProvider, BN } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { usePrivacy } from './PrivacyProvider'
import { toast } from 'react-hot-toast'
import governanceIdl from '@/lib/idl/governance.json'

// Hardcoded for localnet dev - same as in Anchor.toml
const GOVERNANCE_PROGRAM_ID = new PublicKey("8bNpJqZoqqUWKu55VWhR8LWS66BX7NPpwgYBAKhBzu2L")
const SOLANA_RPC_URL = "http://127.0.0.1:8899"

interface Proposal {
    id: string
    title: string
    description: string
    supportWeight: number
    opposeWeight: number
    deadline: number
    status: 'ACTIVE' | 'PASSED' | 'FAILED'
    hasVoted: boolean
}

export interface PoAConfig {
    authority: string
    emergencyPaused: boolean
    ercValidationEnabled: boolean
    minEnergyAmount: number
    maxErcAmount: number
    ercValidityPeriod: number
}

interface GovernanceContextType {
    proposals: Proposal[]
    poaConfig: PoAConfig | null
    votePrivate: (proposalId: string, support: boolean) => Promise<string>
    createProposal: (title: string, description: string) => void
    isConnected: boolean
}

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined)

export const useGovernance = () => {
    const context = useContext(GovernanceContext)
    if (!context) throw new Error('useGovernance must be used within GovernanceProvider')
    return context
}

export const GovernanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { privateBalance, rootSeed } = usePrivacy()
    const [program, setProgram] = useState<Program<Idl> | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [poaConfig, setPoaConfig] = useState<PoAConfig | null>(null)

    // Mock proposals for now
    const [proposals, setProposals] = useState<Proposal[]>([
        {
            id: 'PROP-001',
            title: 'Increase Solar Feed-in Tariff',
            description: 'Proposed increase of 12% to the confidential solar feed-in tariff for residential meters.',
            supportWeight: 45000,
            opposeWeight: 12000,
            deadline: Date.now() + 86400000 * 3,
            status: 'ACTIVE',
            hasVoted: false
        },
        {
            id: 'PROP-002',
            title: 'Deploy Windsor Wind Farm Relay',
            description: 'Confidential funding for a new private node in the Windsor offshore wind cluster.',
            supportWeight: 89000,
            opposeWeight: 5000,
            deadline: Date.now() + 86400000 * 5,
            status: 'ACTIVE',
            hasVoted: false
        }
    ])

    // Initialize Anchor Program
    useEffect(() => {
        try {
            const connection = new Connection(SOLANA_RPC_URL, "confirmed")
            const provider = new AnchorProvider(
                connection,
                {
                    publicKey: PublicKey.default,
                    signTransaction: async (tx: any) => tx,
                    signAllTransactions: async (txs: any[]) => txs
                },
                { commitment: "confirmed" }
            )
            setProvider(provider)
            const prog = new Program(governanceIdl as Idl, provider)
            setProgram(prog)
            setIsConnected(true)
        } catch (err) {
            console.error("Failed to init Governance program:", err)
            setIsConnected(false)
        }
    }, [])

    // Fetch PoA Config
    useEffect(() => {
        if (!program || !isConnected) return

        const fetchConfig = async () => {
            try {
                const [poaConfigPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("poa_config")],
                    GOVERNANCE_PROGRAM_ID
                )

                // @ts-ignore
                const account = await program.account.poAConfig.fetch(poaConfigPda)

                setPoaConfig({
                    authority: account.authority.toBase58(),
                    emergencyPaused: account.emergencyPaused,
                    ercValidationEnabled: account.ercValidationEnabled,
                    minEnergyAmount: account.minEnergyAmount.toNumber(),
                    maxErcAmount: account.maxErcAmount.toNumber(),
                    ercValidityPeriod: account.ercValidityPeriod.toNumber()
                })
            } catch (err) {
                console.error("Error fetching PoA Config:", err)
            }
        }

        fetchConfig()
    }, [program, isConnected])

    const votePrivate = async (proposalId: string, support: boolean) => {
        if (!privateBalance || !rootSeed) throw new Error('Privacy module locked')
        if (privateBalance.amount === null) throw new Error('Private balance unknown')

        const toastId = toast.loading('Generating ZK Stake Weight Proof...')

        try {
            // Simulation
            await new Promise(r => setTimeout(r, 1200))
            const weight = privateBalance.amount

            setProposals(prev => prev.map(p => {
                if (p.id === proposalId) {
                    return {
                        ...p,
                        supportWeight: support ? p.supportWeight + weight : p.supportWeight,
                        opposeWeight: !support ? p.opposeWeight + weight : p.opposeWeight,
                        hasVoted: true
                    }
                }
                return p
            }))

            toast.success(`Cast ${weight} confidential votes!`, { id: toastId })
            return 'SIG_VOTE_CONFIDENTIAL_SUCCESS'
        } catch (e: any) {
            toast.error(`Voting failed: ${e.message}`, { id: toastId })
            throw e
        }
    }

    const createProposal = (title: string, description: string) => {
        const newProp: Proposal = {
            id: `PROP-${Math.floor(Math.random() * 1000)}`,
            title,
            description,
            supportWeight: 0,
            opposeWeight: 0,
            deadline: Date.now() + 86400000 * 7,
            status: 'ACTIVE',
            hasVoted: false
        }
        setProposals(prev => [newProp, ...prev])
    }

    return (
        <GovernanceContext.Provider value={{ proposals, poaConfig, isConnected, votePrivate, createProposal }}>
            {children}
        </GovernanceContext.Provider>
    )
}
