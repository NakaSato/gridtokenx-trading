'use client'

import { CircleCheck, Plus } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateStrategyCard() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const router = useRouter()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="unselected" className="h-8 w-8 rounded-sm py-[6px]">
          <Plus size={10} />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-sm bg-background sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl text-foreground">
            I want to...
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <button
            className={`w-full rounded-sm bg-backgroundSecondary p-4 text-left transition-colors ${selectedOption === 'create-options-pool' ? 'border border-foreground' : 'hover:bg-secondary'}`}
            onClick={() => setSelectedOption('create-options-pool')}
          >
            <div className="flex items-start justify-between">
              <span className="font-medium text-foreground">
                Create Liquidity Pool
              </span>
              {selectedOption === 'create-options-pool' && (
                <CircleCheck className="text-foreground" />
              )}
            </div>
          </button>
          {/* <button 
                        className={`w-full p-4 text-left rounded-sm transition-colors bg-backgroundSecondary 
                            ${selectedOption === 'create-futures-pool' ? 'border border-foreground' : 'hover:bg-secondary'}`}
                        onClick={() => setSelectedOption('create-futures-pool')}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-foreground font-medium">Create Futures Pool</span>
                            {selectedOption === 'create-futures-pool' && (
                                <CircleCheck className="text-foreground"/>
                            )}
                        </div>
                    </button>
                    <button 
                        className={`w-full p-4 text-left rounded-sm transition-colors bg-backgroundSecondary 
                            ${selectedOption === 'create-exotic-pool' ? 'border border-foreground' : 'hover:bg-secondary'}`}
                        onClick={() => setSelectedOption('create-exotic-pool')}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-foreground font-medium">Create Exotic Options Pool</span>
                            {selectedOption === 'create-exotic-pool' && (
                                <CircleCheck className="text-foreground"/>
                            )}
                        </div>
                    </button> */}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            className="w-full rounded-sm bg-primary font-medium text-black hover:opacity-85 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:bg-primary-foreground"
            disabled={!selectedOption}
            onClick={() => router.push(`/${selectedOption}`)}
          >
            Continue
          </Button>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="text-foreground hover:bg-secondary hover:text-red-500"
            >
              Cancel
            </Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  )
}
