'use client'

import { AlertCircle } from 'lucide-react'

/**
 * ExpiredFutures component - displays funding history for futures positions.
 * TODO: Implement actual funding rate history fetching and display.
 */
export default function ExpiredFutures() {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No funding history</p>
            <p className="text-xs opacity-70">Funding payments will appear here</p>
        </div>
    )
}
