import { useState } from 'react'
import { Button } from './ui/button'

export function BorrowCard() {
  const [selectedType, setSelectedType] = useState('fixed')
  return (
    <div className="flex flex-1 flex-col rounded-sm rounded-t-none border py-0.5">
      <div className="flex-1 space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className={`group flex items-center justify-center space-x-2 rounded-sm border px-4 py-3 transition-all ${
              selectedType === 'fixed'
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                : 'hover:border-secondary-foreground'
            }`}
            onClick={() => setSelectedType('fixed')}
          >
            <span className="text-base font-medium">Fixed</span>
          </Button>
          <Button
            variant="outline"
            className={`group flex items-center justify-center space-x-2 rounded-sm border px-4 py-3 transition-all ${
              selectedType === 'variable'
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                : 'hover:border-secondary-foreground'
            }`}
            onClick={() => setSelectedType('variable')}
          >
            <span className="text-base font-medium">Variable</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
