'use client'

import { useQuery } from '@tanstack/react-query'
import { PublicKey } from '@solana/web3.js'
import { Program, BN } from '@coral-xyz/anchor'
import { OptionContract } from '@/lib/idl/option_contract'
import {
    WSOL_MINT,
    WSOL_DECIMALS,
    THB_DECIMALS,
    USDC_DECIMALS
} from '@/utils/const'
import { getPoolPDA, getCustodyPDA, getOptionDetailPDA, getUserPDA } from '@/lib/pda-utils'
import { calculateGreeks } from '@/lib/wasm-bridge'
import { getPythPrice } from './usePythPrice'

export function useOptionPositions(program: Program<OptionContract> | undefined, publicKey: PublicKey | null) {
    return useQuery({
        queryKey: ['optionPositions', publicKey?.toBase58()],
        queryFn: async () => {
            if (!program || !publicKey) return { active: [], expired: [], history: [] }

            const [userPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from('user'), publicKey.toBuffer()],
                program.programId
            )

            const userInfo = await program.account.User.fetch(userPDA).catch(() => null)
            if (!userInfo) return { active: [], expired: [], history: [] }

            const optionIndex = userInfo.option_index.toNumber()
            if (optionIndex === 0) return { active: [], expired: [], history: [] }

            const active: any[] = []
            const expired: any[] = []
            const history: any[] = []

            const poolsToCheck = [
                { name: 'SOL-USDC', decimals: USDC_DECIMALS, token: 'USDC' },
                { name: 'SOL-THB', decimals: THB_DECIMALS, token: 'THB' }
            ]

            const now = Math.round(Date.now() / 1000)

            for (let i = 1; i <= optionIndex; i++) {
                let found = false
                for (const poolInfo of poolsToCheck) {
                    if (found) break

                    const poolPDA = getPoolPDA(poolInfo.name, program.programId)
                    const custodyPDA = getCustodyPDA(poolPDA, WSOL_MINT, program.programId)
                    const optionDetailAccount = getOptionDetailPDA(publicKey, i, poolPDA, custodyPDA, program.programId)

                    const detail = await program.account.OptionDetail.fetch(optionDetailAccount).catch(() => null)
                    if (!detail) continue

                    found = true
                    const isCall = detail.locked_asset.equals(custodyPDA)
                    const assetDecimals = isCall ? WSOL_DECIMALS : poolInfo.decimals
                    const size = detail.amount.toNumber() / 10 ** assetDecimals
                    const strikePrice = detail.strike_price
                    const expiryTime = detail.expired_date.toNumber()

                    if (detail.valid && expiryTime > now) {
                        // Calculate Greeks using WASM
                        // We need current price for Greeks - maybe pass it in?
                        // For now we'll use a placeholder or the caller can handle it.
                        // Actually, let's fetch current price here if needed or just use 0.
                        const greeks = calculateGreeks(0, strikePrice, (expiryTime - now) / (365 * 24 * 3600), isCall)

                        active.push({
                            index: i,
                            token: isCall ? 'SOL' : poolInfo.token,
                            logo: '/images/solana.png',
                            symbol: 'SOL',
                            strikePrice,
                            type: isCall ? 'Call' : 'Put',
                            expiry: new Date(expiryTime * 1000).toString(),
                            size,
                            pnl: 0, // Should be updated with current price
                            greeks: {
                                delta: greeks.delta,
                                gamma: greeks.gamma,
                                theta: greeks.theta,
                                vega: greeks.vega,
                            },
                        })
                    } else if (detail.valid && expiryTime <= now) {
                        expired.push({
                            index: i,
                            token: isCall ? 'SOL' : poolInfo.token,
                            iconPath: '/images/solana.png',
                            symbol: 'SOL',
                            strikePrice,
                            expiryTime,
                            transaction: isCall ? 'Call' : 'Put',
                            tokenAmount: size,
                            profit: detail.profit,
                            // expiryPrice will be fetched later or by caller
                        })
                    } else if (!detail.valid) {
                        history.push({
                            transactionID: `SOL-${i}-${strikePrice}-${isCall ? 'C' : 'P'}`,
                            token: { symbol: 'SOL', logo: '/images/solana.png' },
                            transactionType: isCall ? 'Call' : 'Put',
                            optionType: 'American',
                            strikePrice,
                            expiry: new Date(detail.exercised.toNumber() * 1000).toLocaleString(),
                        })
                    }
                }
            }

            return { active, expired, history }
        },
        enabled: !!program && !!publicKey,
        refetchInterval: 30000,
    })
}

export function useCustodies(program: Program<OptionContract> | undefined, publicKey: PublicKey | null) {
    return useQuery({
        queryKey: ['custodies', program?.programId.toBase58()],
        queryFn: async () => {
            if (!program) return new Map()

            const [pool] = PublicKey.findProgramAddressSync(
                [Buffer.from('pool'), Buffer.from('SOL-THB')],
                program.programId
            )

            const custodies = new Map<string, any>()
            const poolData = await program.account.Pool.fetch(pool)

            for (const custody of poolData.custodies) {
                const c = await program.account.Custody.fetch(new PublicKey(custody))
                custodies.set(c.mint.toBase58(), c)
            }
            return custodies
        },
        enabled: !!program,
    })
}
