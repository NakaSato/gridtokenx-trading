'use client'

import React from 'react'
import { RevenueDashboard } from '@/components/admin/RevenueDashboard'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminRevenuePage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <main className="min-h-screen bg-background">
                <RevenueDashboard />
            </main>
        </ProtectedRoute>
    )
}
