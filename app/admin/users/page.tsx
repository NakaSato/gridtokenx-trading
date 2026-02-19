'use client'

import React from 'react'
import { UserManagement } from '@/components/admin/UserManagement'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminUsersPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <main className="min-h-screen bg-background pb-20">
                <UserManagement />
            </main>
        </ProtectedRoute>
    )
}
