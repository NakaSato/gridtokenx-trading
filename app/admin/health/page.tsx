'use client'

import React from 'react'
import { SystemHealth } from '@/components/admin/SystemHealth'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminHealthPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <main className="min-h-screen bg-background pb-20">
                <SystemHealth />
            </main>
        </ProtectedRoute>
    )
}
