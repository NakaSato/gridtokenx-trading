import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

export function BorrowChartContainer() {
  const [activeTab, setActiveTab] = useState<string>('interest')
  const handleClick = (state: string) => {
    if (activeTab !== state) {
      setActiveTab(state)
    }
  }
  return (
    <>
      <div className="flex h-full w-full flex-col">
        <div className="border-b">
          <Tabs>
            <TabsList className="grid h-10 w-full grid-cols-3 bg-inherit px-4 py-1">
              <TabsTrigger
                value="interest"
                className="rounded-none border-b px-0 py-2 text-secondary-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
                onClick={() => handleClick('interest')}
              >
                Interest
              </TabsTrigger>
              <TabsTrigger
                value="yield"
                className="rounded-none border-b px-0 py-2 text-secondary-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
                onClick={() => handleClick('yield')}
              >
                Yield Chart
              </TabsTrigger>
              <TabsTrigger
                value="chart"
                className="rounded-none border-b px-0 py-2 text-secondary-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
                onClick={() => handleClick('chart')}
              >
                Chart
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </>
  )
}
