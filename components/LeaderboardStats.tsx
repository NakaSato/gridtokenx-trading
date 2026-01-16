import { TooltipIcon } from '@/public/svgs/icons'

export default function LeaderboardStats() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5 md:gap-4">
      <div className="flex flex-col gap-1.5 rounded-sm bg-accent p-4 md:p-5">
        <div className="flex items-center justify-start gap-2 text-xs md:text-sm">
          <span className="text-secondary-foreground">Total Points</span>
          <TooltipIcon />
        </div>
        <div className="text-2xl md:text-[32px]">425.25K</div>
      </div>
      <div className="flex flex-col gap-1.5 rounded-sm bg-accent p-4 md:p-5">
        <div className="flex items-center justify-start gap-2 text-xs md:text-sm">
          <span className="text-secondary-foreground">Global Rank</span>
          <TooltipIcon />
        </div>
        <div className="text-2xl md:text-[32px]">#42.25K</div>
      </div>
      <div className="flex flex-col gap-1.5 rounded-sm bg-accent p-4 md:p-5">
        <div className="flex items-center justify-start gap-2 text-xs md:text-sm">
          <span className="text-secondary-foreground">Lending Points</span>
          <TooltipIcon />
        </div>
        <div className="text-2xl md:text-[32px]">302.7K</div>
      </div>
      <div className="flex flex-col gap-1.5 rounded-sm bg-accent p-4 md:p-5">
        <div className="flex items-center justify-start gap-2 text-xs md:text-sm">
          <span className="text-secondary-foreground">Borrowing Points</span>
          <TooltipIcon />
        </div>
        <div className="text-2xl md:text-[32px]">142.25K</div>
      </div>
      <div className="flex flex-col gap-1.5 rounded-sm bg-accent p-4 md:p-5">
        <div className="flex items-center justify-start gap-2 text-xs md:text-sm">
          <span className="text-secondary-foreground">Referral Points</span>
          <TooltipIcon />
        </div>
        <div className="text-2xl md:text-[32px]">12.25K</div>
      </div>
    </div>
  )
}
