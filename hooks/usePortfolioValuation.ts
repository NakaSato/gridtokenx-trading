'use client'

import { useMemo } from 'react'
import { useOptionPositions } from './useOptions'
import { usePythPrice } from './usePythPrice'
import { Program } from '@coral-xyz/anchor'
import { OptionContract } from '@/lib/idl/option_contract'
import { PublicKey } from '@solana/web3.js'

export function usePortfolioValuation(program: Program<OptionContract> | undefined, publicKey: PublicKey | null) {
    const { data: positions, isLoading: positionsLoading } = useOptionPositions(program, publicKey)
    const { priceData: solPriceData, loading: priceLoading } = usePythPrice('Crypto.SOL/USD')

    const solPrice = solPriceData.price ?? 0

    const summary = useMemo(() => {
        if (!positions || solPrice === 0) return { totalValue: 0, totalPnL: 0, positions: [] }

        const mapped = positions.active.map(pos => {
            const isCall = pos.type === 'Call'
            // Simplified PnL for now: (Current - Strike) * Size for Call, (Strike - Current) * Size for Put
            // Real options PnL is based on premium, but here we might be showing intrinsic value or similar.
            // If these are covered calls/cash secured puts, PnL is different.
            // For now, let's use intrinsic value relative to strike as a placeholder for "Live PnL"

            const intrinsic = isCall
                ? Math.max(0, solPrice - pos.strikePrice)
                : Math.max(0, pos.strikePrice - solPrice)

            return {
                ...pos,
                currentPnL: intrinsic * pos.size
            }
        })

        const totalPnL = mapped.reduce((acc, curr) => acc + curr.currentPnL, 0)
        const totalValue = mapped.reduce((acc, curr) => acc + (curr.strikePrice * curr.size), 0) // Placeholder for Value

        return {
            totalValue,
            totalPnL,
            positions: mapped
        }
    }, [positions, solPrice])

    return {
        ...summary,
        isLoading: positionsLoading || priceLoading
    }
}
