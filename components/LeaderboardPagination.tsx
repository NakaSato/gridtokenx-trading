import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

export default function LeaderboardPagination() {
  return (
    <div className="hidden items-center justify-between text-sm md:flex">
      <div className="flex items-center gap-3">
        <span className="text-secondary-foreground">Showing</span>
        <Select>
          <SelectTrigger className="flex w-full items-center justify-between gap-2 rounded-sm bg-backgroundSecondary px-3 py-[6px]">
            <SelectValue placeholder="1-10" />
            <ChevronDown className="opacity-50" size={14} />
          </SelectTrigger>
          <SelectContent className="w-full" align="start">
            <SelectItem value="10">1-10</SelectItem>
            <SelectItem value="20">2-20</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-secondary-foreground">258,152</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-sm bg-secondary p-2">
          <ChevronLeft className="h-4 w-4 text-secondary-foreground" />
        </button>
        <button className="h-[32px] w-[32px] rounded-sm bg-backgroundSecondary p-[6px]">
          1
        </button>
        <button className="h-[32px] w-[32px] rounded-sm bg-backgroundSecondary p-[6px]">
          2
        </button>
        <button className="h-[32px] w-[32px] rounded-sm bg-backgroundSecondary p-[6px]">
          3
        </button>
        <span>...</span>
        <button className="rounded-sm bg-backgroundSecondary p-[6px]">
          5169
        </button>
        <button className="rounded-sm bg-secondary p-2">
          <ChevronRight className="h-4 w-4 text-secondary-foreground" />
        </button>
      </div>
    </div>
  )
}
