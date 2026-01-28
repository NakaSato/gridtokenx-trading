"use client"

import { useEffect, useState } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor"
import { PublicKey } from "@solana/web3.js"
import { AuctionStatus } from "@/components/auction/AuctionStatus"
import { OrderForm } from "@/components/auction/OrderForm"
import { ClearingPriceChart } from "@/components/auction/ClearingPriceChart"
import tradingIdl from "@/lib/idl/trading.json"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function AuctionPage() {
    const { connection } = useConnection()
    const wallet = useWallet()
    const [program, setProgram] = useState<Program<any> | null>(null)
    const [batchData, setBatchData] = useState<any>(null)
    const [orders, setOrders] = useState<any[]>([])

    // Initialize Program
    useEffect(() => {
        if (wallet && wallet.publicKey) {
            const provider = new AnchorProvider(connection, wallet as any, {})
            const prog = new Program(tradingIdl as Idl, provider)
            setProgram(prog)

            // Mock fetch batch data (In real app, fetch fetch from PDA)
            // For demo visualization loop
            setBatchData({
                status: 0, // Open
                startTime: Math.floor(Date.now() / 1000),
                endTime: Math.floor(Date.now() / 1000) + 900, // 15 mins
                batchId: new Date().toISOString()
            })
        }
    }, [wallet, connection])

    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Periodic Double Auction</h1>
            <p className="text-muted-foreground">
                Batch-based energy trading. Orders are collected and matched every 15 minutes at a uniform clearing price.
            </p>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Market Status</AlertTitle>
                <AlertDescription>
                    Next clearing round in distributed mode. Predict price using the chart below.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Status & Order Form */}
                <div className="space-y-6">
                    {batchData && (
                        <AuctionStatus
                            status={batchData.status}
                            startTime={batchData.startTime}
                            endTime={batchData.endTime}
                            batchId={batchData.batchId}
                        />
                    )}

                    {/* Placeholder for batch PDA - using system program ID for mock/demo so form doesn't crash on null */}
                    <OrderForm
                        batchPda={PublicKey.default}
                        program={program}
                    />
                </div>

                {/* Right Column: Chart & Info */}
                <div className="md:col-span-2 space-y-6">
                    <ClearingPriceChart orders={orders} />

                    <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">How it works</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li><strong>Submission Phase</strong>: Submit bids (buy) and asks (sell).</li>
                            <li><strong>Clearing Phase</strong>: At the end of the batch, a single Clearing Price (MCP) is calculated.</li>
                            <li><strong>Settlement</strong>: All matched orders trade at the MCP, ensuring fairness.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
