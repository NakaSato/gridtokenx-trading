'use client'

import { Download, Send, Upload } from 'lucide-react'
import { Button } from '../ui/button'

export function PortfolioHeader() {
  return (
    <div className="mb-8 flex flex-col items-start justify-between lg:flex-row lg:items-center">
      <h1 className="mb-4 text-3xl font-medium lg:mb-0">Portfolio</h1>
      <div className="flex flex-wrap gap-2">
        {/* <Button variant="outline">
                    <Send className="w-4 h-4 mr-2" />
                    Send
                </Button>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Withdraw
                </Button>
                <Button variant="outline" className="text-primary border-primary">
                    <Upload className="w-4 h-4 mr-2" />
                    Deposit
                </Button> */}
      </div>
    </div>
  )
}
