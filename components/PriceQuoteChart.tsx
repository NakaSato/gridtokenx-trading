import { Card, CardContent } from './ui/card'

export default function PriceQuoteChart() {
  return (
    <Card className="border-none bg-inherit shadow-none">
      <CardContent className="p-6 shadow-none">
        <div className="relative h-[200px] w-full border border-l-0 border-r-0 border-dashed border-foreground">
          <div className="absolute left-1/2 top-0 h-full w-0 border-l border-dashed border-foreground"></div>
          <div className="absolute left-0 top-1/2 h-0 w-full border-t border-solid border-foreground"></div>
          <div className="absolute left-0 top-1/2 h-[25%] w-[calc(50%-1px)] bg-purple-100">
            <div className="absolute bottom-0 left-0 h-0 w-full border-t-2 border-purple-300"></div>
            <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-purple-300"></div>
          </div>
          <div className="absolute left-[calc(50%+1px)] top-[25%] h-[25%] w-[calc(50%-1px)] bg-green-100">
            <div className="absolute left-0 top-0 h-0 w-full border-t-2 border-green-300"></div>
            <div className="absolute left-0 top-0 h-2 w-2 rounded-full bg-green-300"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
