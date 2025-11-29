'use client'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export default function PoolMetricFilters() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="flex w-full space-x-2 px-4">
      <Select>
        <SelectTrigger className="w-fit border bg-inherit">
          <SelectValue placeholder="Select Markets" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Markets</SelectLabel>
            <SelectItem value="all">All Markets</SelectItem>
            <SelectItem value="sol">SOL</SelectItem>
            <SelectItem value="eth">ETH</SelectItem>
            <SelectItem value="btc">BTC</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className="w-fit border bg-inherit">
          <SelectValue placeholder="Select Instruments" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Instruments</SelectLabel>
            <SelectItem value="all">All Instruments</SelectItem>
            <SelectItem value="options">Options</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className="w-fit border bg-inherit">
          <SelectValue placeholder="Select Time" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Time</SelectLabel>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="180">Last 180 days</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className="w-fit border bg-inherit">
          <SelectValue placeholder="Select Interval" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Intervals</SelectLabel>
            <SelectItem value="d">Daily</SelectItem>
            <SelectItem value="w">Weekly</SelectItem>
            <SelectItem value="m">Monthly</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
