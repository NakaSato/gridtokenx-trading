"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    auctionInit,
    auctionAddOrder,
    auctionCalculateClearingPrice,
    auctionClear
} from "@/lib/wasm-bridge"
import { Line } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    annotationPlugin
)

interface OrderData {
    id: number
    price: number
    amount: number
    isBid: boolean
}

// Mock data generator for visualization if real data is empty
const generateMockOrders = (): OrderData[] => {
    const orders: OrderData[] = []
    // Demands (Bids) - Higher prices
    for (let i = 0; i < 10; i++) {
        orders.push({ id: i, price: 60 - i * 2, amount: 10 + i * 5, isBid: true })
    }
    // Supply (Asks) - Lower prices
    for (let i = 0; i < 10; i++) {
        orders.push({ id: 100 + i, price: 40 + i * 2, amount: 10 + i * 5, isBid: false })
    }
    return orders
}

interface ClearingPriceChartProps {
    orders?: OrderData[]
}

export function ClearingPriceChart({ orders = [] }: ClearingPriceChartProps) {
    const [clearingPrice, setClearingPrice] = useState<number>(0)
    const [clearingVolume, setClearingVolume] = useState<number>(0)

    // Process orders via Wasm to find intersection
    useEffect(() => {
        // Initialize Auction Engine
        auctionInit()
        auctionClear()

        const activeOrders = orders.length > 0 ? orders : generateMockOrders()

        // Load orders into Wasm
        activeOrders.forEach(o => {
            auctionAddOrder(o.id, o.price, o.amount, o.isBid)
        })

        // Calculate
        const result = auctionCalculateClearingPrice()
        setClearingPrice(result.price)
        setClearingVolume(result.volume)

    }, [orders])

    // Prepared data for chart
    // We need to plot cumulative Supply vs Demand
    const getChartData = () => {
        const activeOrders = orders.length > 0 ? orders : generateMockOrders()

        // Manual aggregation for JS Chart (Logic duplicated from Rust roughly for visual)
        const bids = activeOrders.filter(o => o.isBid).sort((a, b) => b.price - a.price)
        const asks = activeOrders.filter(o => !o.isBid).sort((a, b) => a.price - b.price)

        // Generate aggregate points for steps
        // This is simplified. Real supply/demand curve is a step function.
        // We will just plot points for now.

        // Demand Curve: (Price, Cumulative Quantity)
        // Supply Curve: (Price, Cumulative Quantity)

        // To plot properly on Price(X) vs Qty(Y) or Price(Y) vs Qty(X)?
        // Econ standard: Price on Y axis, Qty on X axis.
        // ChartJS standard line: X is labels (categories) or linear.
        // Let's us Quantity on X axis? No, Price is the independent variable usually in these matching algos visually?
        // Actually market depth chart usually has Price on X axis, Cumulative Volume on Y axis.
        // Let's do Price on X.

        const allPrices = Array.from(new Set(activeOrders.map(o => o.price))).sort((a, b) => a - b)

        const demandPoints = allPrices.map(p => {
            // Demand at price P is sum of all bids >= P
            return bids.filter(b => b.price >= p).reduce((sum, b) => sum + b.amount, 0)
        })

        const supplyPoints = allPrices.map(p => {
            // Supply at price P is sum of all asks <= P
            return asks.filter(a => a.price <= p).reduce((sum, a) => sum + a.amount, 0)
        })

        return {
            labels: allPrices,
            datasets: [
                {
                    label: 'Demand',
                    data: demandPoints,
                    borderColor: 'rgb(34, 197, 94)', // Green
                    backgroundColor: 'rgba(34, 197, 94, 0.5)',
                    stepped: true,
                },
                {
                    label: 'Supply',
                    data: supplyPoints,
                    borderColor: 'rgb(239, 68, 68)', // Red
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    stepped: true,
                }
            ]
        }
    }

    // Helper for annotation index finding
    const activeOrders = orders.length > 0 ? orders : generateMockOrders()
    const allPrices = Array.from(new Set(activeOrders.map(o => o.price))).sort((a, b) => a - b)

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: 'Market Clearing Price Projection' },
            annotation: {
                annotations: {
                    line1: {
                        type: 'line' as const,
                        yMin: 0,
                        yMax: Math.max(clearingVolume * 1.5, 100),
                        xMin: allPrices.indexOf(clearingPrice), // Approximate index match
                        xMax: allPrices.indexOf(clearingPrice),
                        borderColor: 'rgb(255, 255, 0)',
                        borderWidth: 2,
                        label: {
                            content: `MCP: ${clearingPrice}`,
                            display: true
                        }
                    }
                }
            }
        },
        scales: {
            y: { title: { display: true, text: 'Cumulative Volume' } },
            x: { title: { display: true, text: 'Price' } }
        }
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Market Depth & Clearing</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                    <Line options={options} data={getChartData()} />
                </div>
                <div className="flex justify-between mt-4 text-sm">
                    <div>Projected Clearing Price: <span className="font-bold">{clearingPrice}</span></div>
                    <div>Clearing Volume: <span className="font-bold">{clearingVolume}</span></div>
                </div>
            </CardContent>
        </Card>
    )
}
