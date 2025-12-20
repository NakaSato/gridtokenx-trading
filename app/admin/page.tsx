'use client'

import AdminDashboard from '@/components/AdminDashboard'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminPage() {
    return (
        <ProtectedRoute>
            <AdminDashboard />
        </ProtectedRoute>
    )
}
