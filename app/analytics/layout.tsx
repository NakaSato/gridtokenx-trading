import AnalyticSidebar from '@/components/AnalyticSidebar'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex h-[calc(100vh-52px)] w-full rounded-r-sm border-t">
      <div className="h-full w-1/6 border-r">
        <AnalyticSidebar />
      </div>
      <div className="h-full w-full rounded-sm border-r">
        <ScrollArea className="h-full w-full">{children}</ScrollArea>
      </div>
    </main>
  )
}
