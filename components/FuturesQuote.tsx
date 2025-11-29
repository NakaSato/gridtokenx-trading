import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export default function FuturesQuote() {
  const [dropDownActive, setDropDownActive] = useState<boolean>(true)
  return (
    <div className="rounded-sm border">
      <button
        className="classname flex w-full cursor-pointer items-center justify-between px-6 py-3"
        onClick={() => setDropDownActive(!dropDownActive)}
      >
        <span className="text-sm font-medium text-secondary-foreground">
          Order Summary
        </span>
        {dropDownActive ? (
          <ChevronUp className="h-4 w-4 text-sm text-secondary-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-sm text-secondary-foreground" />
        )}
      </button>
      {dropDownActive && (
        <section className="flex flex-col gap-1 border-t px-6 py-3">
          <div className="flex justify-between text-sm font-normal text-secondary-foreground">
            <span>Entry Price</span>
            <span>X</span>
          </div>
          <div className="flex justify-between text-sm font-normal text-secondary-foreground">
            <span>Liquidation Price</span>
            <span>X</span>
          </div>
          <div className="flex justify-between text-sm font-normal text-secondary-foreground">
            <span>Open Fee</span>
            <span>X</span>
          </div>
          <div className="flex justify-between text-sm font-normal text-secondary-foreground">
            <span>Price Impact</span>
            <span>X</span>
          </div>
          <div className="flex justify-between text-sm font-normal text-secondary-foreground">
            <span>Borrow Fees Due</span>
            <span>X</span>
          </div>
          <div className="flex justify-between text-sm font-normal text-secondary-foreground">
            <span>Transaction Fee</span>
            <span>X</span>
          </div>
          <div className="flex justify-between text-sm font-normal text-secondary-foreground">
            <span>Account Rent</span>
            <span>X</span>
          </div>
        </section>
      )}
    </div>
  )
}
