import LeaderboardPagination from '@/components/LeaderboardPagination'
import LeaderboardStats from '@/components/LeaderboardStats'
import LeaderboardTable from '@/components/LeaderboardTable'
import LeaderBoardTopRanks from '@/components/LeaderBoardTopRanks'

export default function leaderBoards() {
  return (
    <div className="mx-auto w-full space-y-14 px-0 py-7 md:px-6">
      <LeaderBoardTopRanks />
      <div className="flex w-full flex-col space-y-6">
        <LeaderboardStats />
        <LeaderboardTable />
        <LeaderboardPagination />
      </div>
    </div>
  )
}
