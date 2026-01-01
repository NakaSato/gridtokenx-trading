'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Program } from '@coral-xyz/anchor'
import { Connection, PublicKey, TransactionSignature } from '@solana/web3.js'
import { OptionContract } from '@/lib/idl/option_contract'
import * as actions from '@/lib/contract-actions'

export function useContractMutations(
    program: Program<OptionContract> | undefined,
    connection: Connection,
    publicKey: PublicKey | null,
    sendTransaction: (tx: any, connection: Connection) => Promise<TransactionSignature>
) {
    const queryClient = useQueryClient()

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['optionPositions'] })
        queryClient.invalidateQueries({ queryKey: ['custodies'] })
    }

    const openOptionMutation = useMutation({
        mutationFn: async (params: Parameters<typeof actions.openOption>[4]) => {
            if (!program || !publicKey) throw new Error('Not connected')
            return actions.openOption(program, connection, publicKey, sendTransaction, params)
        },
        onSuccess: (success) => {
            if (success) invalidateAll()
        }
    })

    const closeOptionMutation = useMutation({
        mutationFn: async (index: number) => {
            if (!program || !publicKey) throw new Error('Not connected')
            return actions.closeOption(program, connection, publicKey, sendTransaction, index)
        },
        onSuccess: (success) => {
            if (success) invalidateAll()
        }
    })

    const claimOptionMutation = useMutation({
        mutationFn: async ({ index, solPrice }: { index: number, solPrice: number }) => {
            if (!program || !publicKey) throw new Error('Not connected')
            return actions.claimOption(program, connection, publicKey, sendTransaction, index, solPrice)
        },
        onSuccess: (success) => {
            if (success) invalidateAll()
        }
    })

    const exerciseOptionMutation = useMutation({
        mutationFn: async (index: number) => {
            if (!program || !publicKey) throw new Error('Not connected')
            return actions.exerciseOption(program, connection, publicKey, sendTransaction, index)
        },
        onSuccess: (success) => {
            if (success) invalidateAll()
        }
    })

    const addLiquidityMutation = useMutation({
        mutationFn: async (params: Parameters<typeof actions.addLiquidity>[4]) => {
            if (!program || !publicKey) throw new Error('Not connected')
            return actions.addLiquidity(program, connection, publicKey, sendTransaction, params)
        },
        onSuccess: (success) => {
            if (success) invalidateAll()
        }
    })

    const removeLiquidityMutation = useMutation({
        mutationFn: async (params: Parameters<typeof actions.removeLiquidity>[4]) => {
            if (!program || !publicKey) throw new Error('Not connected')
            return actions.removeLiquidity(program, connection, publicKey, sendTransaction, params)
        },
        onSuccess: (success) => {
            if (success) invalidateAll()
        }
    })

    return {
        openOptionMutation,
        closeOptionMutation,
        claimOptionMutation,
        exerciseOptionMutation,
        addLiquidityMutation,
        removeLiquidityMutation
    }
}
