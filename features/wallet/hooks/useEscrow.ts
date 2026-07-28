'use client'

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Program } from '@coral-xyz/anchor'
import { connection } from '@/utils/const'
import { getProgram } from '@/lib/program'
import {
    depositEscrow,
    withdrawEscrow,
    fetchEscrowBalance,
    type EscrowActionParams,
    type EscrowBalance,
} from '@/lib/escrow-actions'

/**
 * Anchor Program for the trading program (escrow instructions). Signing goes
 * through the wallet adapter's sendTransaction, so the provider wallet is only
 * used for account resolution — getProgram falls back to a mock wallet when
 * none is connected, which is fine for read paths.
 */
export function useEscrowProgram(): Program | undefined {
    const wallet = useAnchorWallet()
    return useMemo(() => {
        const program = getProgram(connection, wallet)
        const envId = process.env.NEXT_PUBLIC_TRADING_PROGRAM_ID
        if (envId && program.programId.toBase58() !== envId) {
            console.warn(
                `Trading IDL address ${program.programId.toBase58()} differs from ` +
                    `NEXT_PUBLIC_TRADING_PROGRAM_ID ${envId}; the IDL address is used on-chain`
            )
        }
        return program
    }, [wallet])
}

/** On-chain escrow token balance for the connected wallet + mint. */
export function useEscrowBalance(mint?: PublicKey | null) {
    const { publicKey } = useWallet()
    const program = useEscrowProgram()

    return useQuery<EscrowBalance>({
        queryKey: ['escrow-balance', publicKey?.toBase58(), mint?.toBase58()],
        queryFn: () => fetchEscrowBalance(connection, publicKey!, mint!, program!.programId),
        enabled: !!publicKey && !!mint && !!program,
        refetchInterval: 10000,
    })
}

function useEscrowMutation(
    action: typeof depositEscrow | typeof withdrawEscrow
) {
    const { publicKey, sendTransaction } = useWallet()
    const program = useEscrowProgram()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: EscrowActionParams) => {
            if (!program || !publicKey) throw new Error('Wallet not connected')
            return action(program, connection, publicKey, sendTransaction, params)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
            queryClient.invalidateQueries({ queryKey: ['escrow-balance'] })
        },
    })
}

export function useDepositEscrow() {
    return useEscrowMutation(depositEscrow)
}

export function useWithdrawEscrow() {
    return useEscrowMutation(withdrawEscrow)
}
