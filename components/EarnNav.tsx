'use client'

import { ChevronDown, Search } from 'lucide-react'
import CreateStrategyCard from './CreateStrategyCard'
import { Input } from './ui/input'
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from './ui/select'

interface EarnNavProps {
  sortBy: string
  setSortBy: (value: string) => void
}

export default function EarnNav({ sortBy, setSortBy }: EarnNavProps) {
  return (
    <div className="flex h-8 w-full justify-between gap-2">
      <div className="flex items-center justify-start gap-2">
        <div className="flex h-full w-fit items-center space-x-2 rounded-sm border px-[10px] py-[6px] text-secondary-foreground focus-within:border-primary lg:w-[200px]">
          <Search size={20} className="h-5 w-5" />
          <Input
            type="text"
            placeholder="Search"
            className="h-full rounded-none border-none p-0 shadow-none placeholder:text-secondary-foreground"
          />
        </div>
        <CreateStrategyCard />
      </div>
      <div className="flex items-center justify-between gap-3">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-full w-fit items-center overflow-hidden whitespace-nowrap rounded-sm border border-transparent px-[10px] py-[6px] text-foreground hover:border-primary lg:w-[200px]">
            <SelectValue placeholder="Featured Strategies" className="" />
            <ChevronDown size={16} />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="featured">Featured Strategies</SelectItem>
            <SelectItem value="tvl">Popularity (TVL)</SelectItem>
            <SelectItem value="apy">APY</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="hidden h-full w-fit items-center rounded-sm border border-transparent px-[10px] py-[6px] text-foreground hover:border-primary lg:flex lg:w-[200px]">
            <SelectValue placeholder="All Assets" />
            <ChevronDown size={16} />
          </SelectTrigger>
        </Select>
      </div>
    </div>
  )
}
