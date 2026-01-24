'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { usePrivacy } from './PrivacyProvider'
import { toast } from 'react-hot-toast'
import * as zk from '@/lib/zk-utils'

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

interface GovernanceContextType {
    proposals: Proposal[]
    votePrivate: (proposalId: string, support: boolean) => Promise<string>
    createProposal: (title: string, description: string) => void
}

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined)

export const useGovernance = () => {
    const context = useContext(GovernanceContext)
    if (!context) throw new Error('useGovernance must be used within GovernanceProvider')
    return context
}

export const GovernanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { privateBalance, rootSeed } = usePrivacy()
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

    const votePrivate = async (proposalId: string, support: boolean) => {
        if (!privateBalance || !rootSeed) throw new Error('Privacy module locked')
        if (privateBalance.amount === null) throw new Error('Private balance unknown')

        const toastId = toast.loading('Generating ZK Stake Weight Proof...')

        try {
            // In a real system:
            // 1. User generates a ZK proof that their commitment C hides weight W.
            // 2. The vote itself is submitted as a nullifier to prevent double-voting.
            // For this demo, we simulate the cryptographic work.
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
        <GovernanceContext.Provider value={{ proposals, votePrivate, createProposal }}>
            {children}
        </GovernanceContext.Provider>
    )
}
