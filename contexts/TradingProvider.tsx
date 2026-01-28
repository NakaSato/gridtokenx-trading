'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, getProvider, Program, Provider, Idl, BN } from '@coral-xyz/anchor'
import { Connection, PublicKey, TransactionSignature, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { connection } from '@/utils/const'
import tradingIdl from '../lib/idl/trading.json'
import toast from 'react-hot-toast'

// Types matched to IDL
export interface OrderAccount {
    publicKey: PublicKey
    account: {
        authority: PublicKey
        amount: BN
        pricePerKwh: BN // or price
        filledAmount: BN
        status: any // Enum
        market: PublicKey
        createdAt: BN
        // Add other fields as per IDL
    }
}

interface TradingContextType {
    program: Program | undefined
    marketAddress: PublicKey | undefined
    orders: OrderAccount[]
    isLoadingOrders: boolean
    refreshOrders: () => void
    createSellOrder: (amount: number, price: number) => Promise<string>
    createBuyOrder: (amount: number, price: number) => Promise<string>
}

export const TradingContext = createContext<TradingContextType>({
    program: undefined,
    marketAddress: undefined,
    orders: [],
    isLoadingOrders: false,
    refreshOrders: () => { },
    createSellOrder: async () => "",
    createBuyOrder: async () => "",
})

export const useTrading = () => useContext(TradingContext)

// Constants
const TRADING_PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_TRADING_PROGRAM_ID!)
const MARKET_SEED = "market"

export const TradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { connected, publicKey, sendTransaction } = useWallet()
    const wallet = useAnchorWallet()
    const [program, setProgram] = useState<Program>()
    const [marketAddress, setMarketAddress] = useState<PublicKey>()

    const queryClient = useQueryClient()

    // Initialize Program
    useEffect(() => {
        if (wallet && publicKey) {
            let provider: Provider
            try {
                provider = getProvider()
            } catch {
                provider = new AnchorProvider(connection, wallet, {})
            }

            // @ts-ignore
            const prog = new Program(tradingIdl as Idl, provider)
            setProgram(prog)

            // Derive Global Market PDA
            const [marketPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(MARKET_SEED)],
                TRADING_PROGRAM_ID
            )
            setMarketAddress(marketPda)
        }
    }, [wallet, publicKey])

    // Fetch Orders Query
    const { data: orders = [], isLoading: isLoadingOrders, refetch: refreshOrders } = useQuery({
        queryKey: ['trading', 'orders', program?.programId?.toString()],
        queryFn: async () => {
            if (!program) return []
            try {
                // Fetch all orders
                const allOrders = await (program.account as any).order.all()
                return allOrders as unknown as OrderAccount[]
            } catch (e) {
                console.error("Failed to fetch orders:", e)
                return []
            }
        },
        enabled: !!program,
        refetchInterval: 5000 // Polling every 5s for demo
    })

    // Helper: Generate random u64 ID
    const generateOrderId = () => {
        const buf = new Uint8Array(8)
        window.crypto.getRandomValues(buf)
        return new BN(buf)
    }

    // Mutation: Create Sell Order
    const createSellOrder = async (amount: number, price: number) => {
        if (!program || !publicKey || !marketAddress) throw new Error("Wallet not connected")

        const loadingId = toast.loading("Creating Sell Order...")

        try {
            // 1. Generate Client-Side ID
            const orderId = generateOrderId()

            // 2. Derive Order PDA: [b"order", authority, orderId (8 bytes LE)]
            const [orderAddress] = PublicKey.findProgramAddressSync(
                [Buffer.from("order"), publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
                program.programId
            )

            // 3. Prepare Arguments
            const amountBn = new BN(amount)
            const priceBn = new BN(price)

            // 4. Call Contract
            const tx = await program.methods.createSellOrder(
                orderId,
                amountBn,
                priceBn
            ).accounts({
                market: marketAddress,
                order: orderAddress,
                authority: publicKey,
                systemProgram: SystemProgram.programId,
            }).rpc()

            toast.success("Sell Order Created!", { id: loadingId })
            refreshOrders()
            return tx
        } catch (e: any) {
            console.error("Create Sell Order Failed:", e)
            toast.error(`Failed: ${e.message}`, { id: loadingId })
            throw e
        }
    }

    // Mutation: Create Buy Order
    const createBuyOrder = async (amount: number, price: number) => {
        if (!program || !publicKey || !marketAddress) throw new Error("Wallet not connected")

        const loadingId = toast.loading("Creating Buy Order...")

        try {
            // 1. Generate Client-Side ID
            const orderId = generateOrderId()

            // 2. Derive Order PDA: [b"order", authority, orderId (8 bytes LE)]
            const [orderAddress] = PublicKey.findProgramAddressSync(
                [Buffer.from("order"), publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
                program.programId
            )

            // 3. Prepare Arguments
            const amountBn = new BN(amount)
            const priceBn = new BN(price)

            // 4. Call Contract
            const tx = await program.methods.createBuyOrder(
                orderId,
                amountBn,
                priceBn
            ).accounts({
                market: marketAddress,
                order: orderAddress,
                authority: publicKey,
                systemProgram: SystemProgram.programId
            }).rpc()

            toast.success("Buy Order Created!", { id: loadingId })
            refreshOrders()
            return tx
        } catch (e: any) {
            console.error("Create Buy Order Failed:", e)
            toast.error(`Failed: ${e.message}`, { id: loadingId })
            throw e
        }
    }

    return (
        <TradingContext.Provider value={{
            program,
            marketAddress,
            orders,
            isLoadingOrders,
            refreshOrders,
            createSellOrder,
            createBuyOrder
        }}>
            {children}
        </TradingContext.Provider>
    )
}
