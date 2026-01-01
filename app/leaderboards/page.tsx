'use client'
import LeaderboardPagination from '@/components/LeaderboardPagination'
import LeaderboardStats from '@/components/LeaderboardStats'
import dynamic from 'next/dynamic'
import SkeletonTable from '@/components/ui/SkeletonTable'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

const LeaderboardTable = dynamic(() => import('@/components/LeaderboardTable'), {
  ssr: false,
  loading: () => <SkeletonTable columns={6} rows={10} height={500} />
})
import LeaderBoardTopRanks from '@/components/LeaderBoardTopRanks'

export default function leaderBoards() {
  return (
    <div className="mx-auto w-full space-y-14 px-0 py-7 md:px-6">
      <LeaderBoardTopRanks />
      <div className="flex w-full flex-col space-y-6">
        <LeaderboardStats />
        <ErrorBoundary name="Leaderboard Table">
          <LeaderboardTable />
        </ErrorBoundary>
        <LeaderboardPagination />
      </div>
    </div>
  )
}
