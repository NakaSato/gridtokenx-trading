'use client'

import React from 'react'
import { AdminAnalytics } from '@/components/admin/AdminAnalytics'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminAnalyticsPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <main className="min-h-screen bg-background pb-20">
                <AdminAnalytics />
            </main>
        </ProtectedRoute>
    )
}
