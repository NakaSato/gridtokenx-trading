import { Card, CardContent } from '../ui/card'

export function PointsCard() {
  return (
    <Card className="w-full rounded-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <h1>Points</h1>
        </div>
        <div className="mb-2 text-3xl font-bold">0</div>
      </CardContent>
    </Card>
  )
}
