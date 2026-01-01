'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ScriptableLineSegmentContext,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { Line } from 'react-chartjs-2'
import { useId, useMemo } from 'react'
import { generatePnLBatch } from '@/lib/wasm-bridge'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
)

interface PnLChartProps {
  strikePrice: number
  premium: number
  contractType: string
  positionType: string
  currentPrice?: number
  invested: number
}

const generatePnLData = ({
  strikePrice,
  premium,
  contractType,
  positionType,
}: PnLChartProps) => {
  // Use WASM-accelerated batch generation (with JS fallback)
  const { prices, pnlData, minPnL, maxPnL } = generatePnLBatch(
    strikePrice,
    premium,
    contractType,
    positionType,
    0.2, // ±20% range
    400  // 400 points
  )

  const pnlRange = Math.max(Math.abs(maxPnL), Math.abs(minPnL))

  return {
    labels: prices,
    priceRange: prices,
    datasets: [
      {
        label: 'Option P&L',
        data: pnlData,
        segment: {
          borderColor: (ctx: ScriptableLineSegmentContext) => {
            const value = ctx.p1.parsed.y ?? 0
            return value < 0
              ? 'rgba(177, 163, 251, 1)'
              : 'rgba(83, 192, 141, 1)'
          },
          backgroundColor: (ctx: ScriptableLineSegmentContext) => {
            const value = ctx.p1.parsed.y ?? 0
            return value < 0
              ? 'rgba(177, 163, 251, 0.2)'
              : 'rgba(83, 192, 141, 0.2)'
          },
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: 'white',
        pointBorderColor: 'white',
        pointHoverBackgroundColor: 'white',
        pointHoverBorderColor: 'white',
      },
    ],
    pnlRange,
    maxPnL,
    minPnL,
  }
}


export function PnLChart({
  strikePrice,
  premium,
  contractType,
  positionType,
  currentPrice,
  invested = 1,
}: PnLChartProps) {
  const chartId = useId()
  const { datasets, labels, priceRange, pnlRange, maxPnL, minPnL } =
    generatePnLData({
      strikePrice,
      premium,
      contractType,
      positionType,
      currentPrice,
      invested,
    })
  const premiumPerContract = premium
  const breakEvenPrice =
    contractType === 'call'
      ? strikePrice + premiumPerContract
      : strikePrice - premiumPerContract

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    animation: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxTicksLimit: 10,
          callback: (value) => {
            const price = labels[value as number]
            return price ? `$${Math.round(price).toLocaleString()}` : 0
          },
        },
        title: {
          display: false,
          text: 'SOL Price',
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      y: {
        grid: {
          color: 'rgba(29, 30, 34, 1)',
        },
        ticks: {
          color: 'rgba(128, 134, 147, 1)',
          callback: (value) => `$${value.toLocaleString()}`,
        },
        title: {
          display: true,
          text: 'Profit/Loss ($)',
          color: 'rgba(77, 79, 88, 0.7)',
        },
        min: -pnlRange,
        max: pnlRange,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const price = labels[context[0].dataIndex]
            return `SOL Price: $${Math.round(price).toLocaleString()}`
          },
          label: (context) => {
            const pnlValue =
              (context.parsed.y ?? 0) *
              Math.max(Math.floor(invested / premium), 1)
            return `P&L: $${pnlValue.toLocaleString()}`
          },
        },
      },
      annotation: {
        annotations: {
          strikePrice: {
            type: 'line',
            xMin: priceRange.findIndex((p) => p >= strikePrice),
            xMax: priceRange.findIndex((p) => p >= strikePrice),
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: `Strike: $${strikePrice.toLocaleString()}`,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: 4,
              position: 'start',
              yAdjust: -10,
            },
          },
          currentPrice: currentPrice
            ? {
              type: 'line',
              xMin: priceRange.findIndex((p) => p >= (currentPrice || 0)),
              xMax: priceRange.findIndex((p) => p >= (currentPrice || 0)),
              borderColor: 'white',
              borderWidth: 2,
              label: {
                display: true,
                content: `Current: $${currentPrice.toLocaleString()}`,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: 4,
                position: 'end',
                yAdjust: 10,
              },
            }
            : undefined,
          // breakEven: {
          //   type: 'line',
          //   xMin: priceRange.findIndex(p => p >= breakEvenPrice),
          //   xMax: priceRange.findIndex(p => p >= breakEvenPrice),
          //   borderColor: 'rgba(255, 255, 255, 0.5)',
          //   borderWidth: 1,
          //   borderDash: [2, 2],
          //   label: {
          //     display: true,
          //     content: `Break-even: $${breakEvenPrice.toLocaleString()}`,
          //     backgroundColor: 'rgba(0, 0, 0, 0.8)',
          //     color: 'white',
          //     padding: 4,
          //     position: 'start',
          //     yAdjust: 20,
          //   }
          // }
        },
      },
    },
  }

  return (
    <div className="h-full w-full rounded-lg bg-background px-1">
      <div className="h-full p-1">
        <Line id={chartId} options={options} data={{ labels, datasets }} />
      </div>
    </div>
  )
}
