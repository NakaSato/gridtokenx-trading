'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import TradingPositionsFallback from '@/components/TradingPositionsFallback'
import TradingPositions from '@/components/TradingPositions'

export default function TradingPositionsPanel() {
    return (
        <div className="w-full flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <ProtectedRoute fallback={<TradingPositionsFallback />}>
                <TradingPositions />
            </ProtectedRoute>
        </div>
    )
}
