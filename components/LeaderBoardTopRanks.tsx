'use client'
import {
  Rank1Big,
  Rank1BoxDark,
  Rank1BoxLight,
  Rank2Big,
  Rank2BoxDark,
  Rank2BoxLight,
  Rank3Big,
  Rank3BoxDark,
  Rank3BoxLight,
  StarIcon,
} from '@/public/svgs/icons'
import { useTheme } from 'next-themes'

export default function LeaderBoardTopRanks() {
  const { theme } = useTheme()
  return (
    <div className="mx-auto hidden justify-center gap-4 lg:flex">
      <div className="flex flex-col space-y-5">
        <div className="mt-[30px] flex flex-col items-center space-y-[14px]">
          <div>
            <Rank2Big />
          </div>
          <span className="text-sm font-medium text-foreground">
            CAi4Dxk6...wb7oUYRQ
          </span>
        </div>
        <div>
          <div>
            {theme === 'dark-purple' ? <Rank2BoxDark /> : <Rank2BoxLight />}
            <div className="relative -mt-[90px] flex flex-col items-center space-y-2">
              <div className="flex items-center gap-2 rounded-[10px] bg-shade px-2 py-1">
                <StarIcon />
                <span className="text-sm font-normal text-foreground">
                  57,983,412,105
                </span>
              </div>
              <span className="text-sm text-secondary-foreground">
                Total Points
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-5">
        <div className="flex flex-col items-center space-y-[14px]">
          <div>
            <Rank1Big />
          </div>
          <span className="text-sm font-medium text-foreground">
            4FDKx3S3...1GTUWkti
          </span>
        </div>
        <div>
          <div>
            {theme === 'dark-purple' ? <Rank1BoxDark /> : <Rank1BoxLight />}
            <div className="relative -mt-[90px] flex flex-col items-center space-y-2">
              <div className="flex items-center gap-2 rounded-[10px] bg-shade px-2 py-1">
                <StarIcon />
                <span className="text-sm font-normal text-foreground">
                  57,983,412,105
                </span>
              </div>
              <span className="text-sm text-secondary-foreground">
                Total Points
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-5">
        <div className="mt-[60px] flex flex-col items-center space-y-[14px]">
          <div>
            <Rank3Big />
          </div>
          <span className="text-sm font-medium text-foreground">
            7WVG5b9b...iuuCr8jE
          </span>
        </div>
        <div>
          <div>
            {theme === 'dark' ? <Rank3BoxDark /> : <Rank3BoxLight />}
            <div className="relative -mt-[90px] flex flex-col items-center space-y-2">
              <div className="flex items-center gap-2 rounded-[10px] bg-shade px-2 py-1">
                <StarIcon />
                <span className="text-sm font-normal text-foreground">
                  57,983,412,105
                </span>
              </div>
              <span className="text-sm text-secondary-foreground">
                Total Points
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
