'use client'

import React from 'react'
import { AdminPortal } from '@/components/admin/AdminPortal'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <main className="min-h-screen bg-background pb-20">
                <AdminPortal />
            </main>
        </ProtectedRoute>
    )
}
