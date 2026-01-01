'use client'

import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
const { FixedSizeList: List } = require('react-window')
import { Rank1Icon, Rank2Icon, Rank3Icon, StarIcon } from '@/public/svgs/icons'
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Separator } from './ui/separator'
import SkeletonTable from './ui/SkeletonTable'

export default function LeaderboardTable() {
  const { data: leaderboardData = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      // Simulating API fetch with delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const numEntries = 500
      const baseAddress = [
        '4FDKx3S3',
        'CA14Dxk6',
        '7WVG5b9b',
        '53gDPFjM',
        'GWE2zPNp',
        'HDG5LNix',
      ]
      const data = []

      for (let i = 1; i <= numEntries; i++) {
        const basePoints = 130000000000 - i * 100000000
        const totalPoints = basePoints * 5

        data.push({
          rank: i,
          address: `${baseAddress[i % baseAddress.length]}...${Math.random().toString(36).substring(2, 10)}`,
          tradingPoints: basePoints.toLocaleString(),
          liquidityPoints: (basePoints - 100000000).toLocaleString(),
          referralPoints: (basePoints - 200000000).toLocaleString(),
          totalPoints: totalPoints.toLocaleString(),
        })
      }
      return data
    },
    staleTime: 60000,
  })

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = leaderboardData[index]
    if (!row) return null

    return (
      <div style={style}>
        <TableRow className="border-none w-full flex items-center">
          <TableCell className="w-[100px] py-3 text-center text-foreground">
            {row.rank === 1 && (
              <span className="flex justify-center">
                <Rank1Icon />
              </span>
            )}
            {row.rank === 2 && (
              <span className="flex justify-center">
                <Rank2Icon />
              </span>
            )}
            {row.rank === 3 && (
              <span className="flex justify-center">
                <Rank3Icon />
              </span>
            )}
            {row.rank > 3 && row.rank}
          </TableCell>
          <TableCell className="flex-1 py-3 text-foreground">
            {row.address}
          </TableCell>
          <TableCell className="w-[150px] py-3 text-center text-foreground">
            {row.tradingPoints}
          </TableCell>
          <TableCell className="w-[150px] py-3 text-center text-foreground">
            {row.liquidityPoints}
          </TableCell>
          <TableCell className="w-[150px] py-3 text-center text-foreground">
            {row.referralPoints}
          </TableCell>
          <TableCell className="w-[180px] flex justify-center py-3">
            <div className="flex items-center gap-2 rounded-sm bg-shade px-2 py-1">
              <StarIcon />
              <span className="text-sm font-normal text-foreground">
                {row.totalPoints}
              </span>
            </div>
          </TableCell>
        </TableRow>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-fit rounded-sm border">
        <SkeletonTable columns={6} rows={10} height={500} />
      </div>
    )
  }

  return (
    <div className="h-fit rounded-sm border">
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="w-full flex items-center">
              <TableHead className="w-[100px] px-3 py-4 text-center font-normal text-secondary-foreground">
                Rank
              </TableHead>
              <TableHead className="flex-1 px-3 py-4 font-normal text-secondary-foreground">
                Address
              </TableHead>
              <TableHead className="w-[150px] px-3 py-4 text-center font-normal text-secondary-foreground">
                Trading Points
              </TableHead>
              <TableHead className="w-[150px] px-3 py-4 text-center font-normal text-secondary-foreground">
                Liquidity Points
              </TableHead>
              <TableHead className="w-[150px] px-3 py-4 text-center font-normal text-secondary-foreground">
                Borrowing Points
              </TableHead>
              <TableHead className="w-[180px] px-3 py-4 text-center font-normal text-secondary-foreground">
                Total Points
              </TableHead>
            </TableRow>
          </TableHeader>
          <div className="h-[500px]">
            <List
              height={500}
              itemCount={leaderboardData.length}
              itemSize={60}
              width="100%"
            >
              {Row}
            </List>
          </div>
        </Table>
      </div>
      <div className="flex flex-col p-3 md:hidden">
        {leaderboardData.slice(0, 50).map((data, index) => (
          <div className="flex w-full flex-col" key={index}>
            <div className="flex w-full flex-col space-y-[10px]">
              <div className="flex w-full justify-start space-x-[10px]">
                <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-backgroundSecondary px-[7px] py-[10px] text-sm font-normal">
                  {data.rank}
                </div>
                <span className="flex items-center text-sm font-normal">
                  {data.address}
                </span>
              </div>
              <div className="flex w-full space-x-[14px]">
                <div className="flex w-full flex-col space-y-1">
                  <span className="text-xs font-medium text-secondary-foreground">
                    Trading Points
                  </span>
                  <span className="text-sm font-normal">
                    {data.tradingPoints}
                  </span>
                </div>
                <div className="flex w-full flex-col space-y-1">
                  <span className="text-xs font-medium text-secondary-foreground">
                    Liquidity Points
                  </span>
                  <span className="text-sm font-normal">
                    {data.liquidityPoints}
                  </span>
                </div>
              </div>
              <div className="flex w-full space-x-[14px]">
                <div className="flex w-full flex-col space-y-1">
                  <span className="text-xs font-medium text-secondary-foreground">
                    Referral Points
                  </span>
                  <span className="text-sm font-normal">
                    {data.referralPoints}
                  </span>
                </div>
                <div className="flex w-full flex-col space-y-1">
                  <span className="text-xs font-medium text-secondary-foreground">
                    Total Points
                  </span>
                  <div className="flex w-fit items-center gap-1 rounded-sm bg-shade px-[6px] py-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="14"
                      viewBox="0 0 15 14"
                      fill="none"
                    >
                      <path
                        d="M8.51296 1.96764L9.54115 3.93431C9.67971 4.2063 10.0516 4.46433 10.3652 4.52013L12.2247 4.81303C13.4133 5.00133 13.6904 5.82426 12.8372 6.6472L11.3861 8.03502C11.1454 8.26516 11.0069 8.71847 11.0871 9.04625L11.5027 10.7619C11.8309 12.1148 11.0725 12.6448 9.82555 11.9335L8.08272 10.9432C7.76916 10.7619 7.24412 10.7619 6.93056 10.9432L5.18773 11.9335C3.94077 12.6379 3.18239 12.1148 3.51053 10.7619L3.92619 9.04625C3.99182 8.7115 3.85327 8.25819 3.61263 8.02805L2.16148 6.64022C1.3083 5.82426 1.5854 5.00133 2.77403 4.80606L4.63353 4.51315C4.94709 4.46433 5.31899 4.19932 5.45754 3.92734L6.48574 1.96067C7.04723 0.900622 7.95146 0.900623 8.51296 1.96764Z"
                        fill="url(#paint0_linear_572_47468)"
                      />
                      <defs>
                        <linearGradient
                          id="paint0_linear_572_47468"
                          x1="11.3882"
                          y1="2.71618"
                          x2="0.692242"
                          y2="4.01554"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stop-color="#F4CA99" />
                          <stop offset="1" stop-color="#FFF0D1" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="text-xs font-normal">
                      {data.totalPoints}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full py-4">
              <Separator />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
