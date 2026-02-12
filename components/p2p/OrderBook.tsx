import { useTrading, OrderAccount } from '@/contexts/TradingProvider'
import { PublicKey } from '@solana/web3.js'
import { format } from 'date-fns'
import { ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react'
import { useState, useMemo } from 'react'
import { clsx } from 'clsx'
import { BN } from '@coral-xyz/anchor'

import { useWallet } from '@solana/wallet-adapter-react'

export const OrderBook = ({ myOrdersOnly = false }: { myOrdersOnly?: boolean }) => {
    const { orders, isLoadingOrders, setActiveOrderFill } = useTrading()
    const { publicKey } = useWallet()
    const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')

    // Helper to check if a Pubkey is "empty" (System Program or Zero)
    const isEmptyKey = (key: PublicKey) => {
        return key.equals(PublicKey.default) || key.toBase58() === '11111111111111111111111111111111'
    }

    // Process and sort orders
    const processedOrders = useMemo(() => {
        if (!orders) return { bids: [], asks: [] }

        // Filter active orders (Status check - assuming 0 or {active:{}} is active)
        // Since we don't know the exact enum mapping yet, we'll list all for now
        // or try to infer. We'll show all orders that look open.
        // An open Buy order has a Buyer but NO Seller.
        // An open Sell order has a Seller but NO Buyer.

        let openOrders = orders.filter(o => {
            const hasBuyer = !isEmptyKey(o.account.buyer)
            const hasSeller = !isEmptyKey(o.account.seller)
            const isMatched = hasBuyer && hasSeller

            // Filter out matched orders (where both are set)
            // Also check status if possible, but structure matching is robust.
            return !isMatched
        })

        if (myOrdersOnly && publicKey) {
            openOrders = openOrders.filter(o => o.account.authority.equals(publicKey))
        }

        const bids = openOrders.filter(o => !isEmptyKey(o.account.buyer)).sort((a, b) => b.account.pricePerKwh.cmp(a.account.pricePerKwh)) // Descending price
        const asks = openOrders.filter(o => !isEmptyKey(o.account.seller)).sort((a, b) => a.account.pricePerKwh.cmp(b.account.pricePerKwh)) // Ascending price

        return { bids, asks }
    }, [orders, myOrdersOnly, publicKey])

    // Precision (micro-kWh, micro-USDC?)
    // Need to verify units. IDL comments say "kWh * 1000" or similar?
    // TradingProvider defines PRECISION_FACTOR = 1_000_000.
    // Let's assume on-chain values are scaled by 1e6.
    const fromBn = (bn: BN) => {
        return bn.toNumber() / 1_000_000
    }

    const handleTake = (order: OrderAccount, isSellOrder: boolean) => {
        // Taking a Sell Order (Ask) means we want to BUY.
        // Taking a Buy Order (Bid) means we want to SELL.

        setActiveOrderFill({
            amount: fromBn(order.account.amount.sub(order.account.filledAmount)), // Remaining amount
            price: fromBn(order.account.pricePerKwh),
            targetOrder: order
        })

        // Scroll to form? handled by UI update or user action
    }

    // Combine for display based on filter
    const displayOrders = useMemo(() => {
        let list: { order: OrderAccount, type: 'bid' | 'ask' }[] = []
        if (filter !== 'sell') {
            list = list.concat(processedOrders.bids.map(o => ({ order: o, type: 'bid' as const })))
        }
        if (filter !== 'buy') {
            list = list.concat(processedOrders.asks.map(o => ({ order: o, type: 'ask' as const })))
        }
        // Sort by time created? or price?
        // Usually mixed list is sorted by time or proximity to market price.
        // Let's just list them nicely.
        return list
    }, [processedOrders, filter])

    if (isLoadingOrders) {
        return <div className="p-4 text-center text-gray-500">Loading Order Book...</div>
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{myOrdersOnly ? 'My Active Orders' : 'Order Book'}</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={clsx("px-3 py-1 text-xs rounded-full font-medium transition-colors", filter === 'all' ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('buy')}
                        className={clsx("px-3 py-1 text-xs rounded-full font-medium transition-colors", filter === 'buy' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                    >
                        Bids
                    </button>
                    <button
                        onClick={() => setFilter('sell')}
                        className={clsx("px-3 py-1 text-xs rounded-full font-medium transition-colors", filter === 'sell' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                    >
                        Asks
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Side</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">Price (USDC/kWh)</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">Amount (kWh)</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {displayOrders.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                    No active orders found
                                </td>
                            </tr>
                        ) : (
                            displayOrders.map(({ order, type }) => (
                                <tr key={order.publicKey.toBase58()} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {type === 'bid' ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-medium">
                                                    <ArrowDownLeft className="w-3 h-3" />
                                                    Bid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-medium">
                                                    <ArrowUpRight className="w-3 h-3" />
                                                    Ask
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                                        {fromBn(order.account.pricePerKwh).toFixed(4)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600">
                                        {fromBn(order.account.amount.sub(order.account.filledAmount)).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleTake(order, type === 'ask')}
                                            className={clsx(
                                                "px-3 py-1 rounded text-xs font-medium transition-all opacity-0 group-hover:opacity-100",
                                                type === 'ask'
                                                    ? "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow" // Buying from Ask
                                                    : "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow"   // Selling to Bid
                                            )}
                                        >
                                            {type === 'ask' ? 'Buy' : 'Sell'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
