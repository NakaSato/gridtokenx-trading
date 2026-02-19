'use client'

import React from 'react'
import { ActivityLog } from '@/components/admin/ActivityLog'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminActivityPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <main className="min-h-screen bg-background pb-20">
                <ActivityLog />
            </main>
        </ProtectedRoute>
    )
}
