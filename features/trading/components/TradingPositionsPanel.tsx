'use client'

import React from 'react'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import TradingPositionsFallback from '@/features/trading/components/TradingPositionsFallback'
import TradingPositions from '@/features/trading/components/TradingPositions'

const TradingPositionsPanel = React.memo(function TradingPositionsPanel() {
  return (
    <div className="w-full flex-shrink-0 delay-200 duration-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="p-0">
        <div className="m-0 border-none p-0">
          <ProtectedRoute fallback={<TradingPositionsFallback />}>
            <TradingPositions />
          </ProtectedRoute>
        </div>
      </div>
    </div>
  )
})

export default TradingPositionsPanel
