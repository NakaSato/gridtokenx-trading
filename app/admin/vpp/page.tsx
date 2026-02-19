'use client'

import React from 'react'
import { VppDashboard } from '@/components/admin/VppDashboard'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function VppOrchestrationPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <main className="min-h-screen bg-background pb-20">
                <VppDashboard />
            </main>
        </ProtectedRoute>
    )
}
