'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js'
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

interface Leg {
  side: 'Long' | 'Short'
  type: 'Call' | 'Put'
  strikePrice: number
  bidPrice: number
}

interface OptionChainChartProps {
  legs?: Leg[]
  currentPrice?: number
}

export function OptionChainChart({ legs = [], currentPrice = 100 }: OptionChainChartProps) {
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgb(255, 255, 255)',
        titleColor: 'rgb(0, 0, 0)',
        bodyColor: 'rgb(0, 0, 0)',
        borderColor: 'rgb(128, 128, 128)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: (tooltipItems: any) => `Price: $${tooltipItems[0].label}`,
          label: (context: any) => `PnL: $${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Price at Expiry', color: '#808693', font: { size: 10 } },
        grid: { display: false },
        ticks: { color: '#808693', font: { size: 10 } },
      },
      y: {
        title: { display: true, text: 'Profit / Loss', color: '#808693', font: { size: 10 } },
        grid: { color: '#333339' },
        ticks: {
          color: '#808693',
          font: { size: 10 },
          callback: (value: any) => `$${value}`,
        },
      },
    },
  }), [])

  const { labels, dataPoints } = useMemo(() => {
    const range = 40 // +/- 20%
    const minPrice = Math.max(0, currentPrice * 0.8)
    const maxPrice = currentPrice * 1.2
    const step = (maxPrice - minPrice) / 20

    const lbs: string[] = []
    const dps: number[] = []

    for (let p = minPrice; p <= maxPrice; p += step) {
      lbs.push(p.toFixed(0))

      let totalPnL = 0
      legs.forEach(leg => {
        const isCall = leg.type === 'Call'
        const isLong = leg.side === 'Long'

        let pnl = 0
        if (isCall) {
          pnl = Math.max(0, p - leg.strikePrice)
        } else {
          pnl = Math.max(0, leg.strikePrice - p)
        }

        if (isLong) {
          totalPnL += (pnl - leg.bidPrice)
        } else {
          totalPnL += (leg.bidPrice - pnl)
        }
      })
      dps.push(totalPnL)
    }

    return { labels: lbs, dataPoints: dps }
  }, [legs, currentPrice])

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        fill: true,
        data: dataPoints,
        borderColor: '#B1A3FB',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)'); // Red for loss
          gradient.addColorStop(0.5, 'rgba(177, 163, 251, 0.1)');
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0.2)'); // Green for profit
          return gradient;
        },
        tension: 0.2,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }), [labels, dataPoints])

  return (
    <div className="h-full w-full rounded-sm p-2">
      <Line options={options} data={chartData} />
    </div>
  )
}
