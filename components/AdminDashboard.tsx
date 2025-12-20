'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useApiClient } from '@/hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import {
    Users,
    Activity,
    ArrowUpDown,
    ShieldCheck,
    Server,
    Zap,
    TrendingUp,
    AlertCircle
} from 'lucide-react'
import { Skeleton } from './ui/skeleton'

interface AdminStats {
    total_users: number
    total_meters: number
    active_meters: number
    total_volume_kwh: number
    total_orders: number
    settlement_success_rate: number
}

interface ActivityLog {
    id: string
    event_type: string
    user_id: string | null
    event_data: any
    created_at: string
}

interface SystemHealth {
    status: string
    dependencies: {
        name: string
        status: 'healthy' | 'degraded' | 'unhealthy'
    }[]
}

export default function AdminDashboard() {
    const { user } = useAuth()
    const apiClient = useApiClient()
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [activities, setActivities] = useState<ActivityLog[]>([])
    const [health, setHealth] = useState<SystemHealth | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 15000) // Refresh every 15s
        return () => clearInterval(interval)
    }, [])

    const fetchData = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            const token = localStorage.getItem('access_token')
            const headers = { 'Authorization': `Bearer ${token}` }

            // Fetch all in parallel
            const [statsRes, activityRes, healthRes] = await Promise.all([
                fetch(`${baseUrl}/api/v1/analytics/admin/stats`, { headers }),
                fetch(`${baseUrl}/api/v1/analytics/admin/activity`, { headers }),
                fetch(`${baseUrl}/api/v1/analytics/admin/health`, { headers })
            ])

            if (statsRes.ok) setStats(await statsRes.ok ? await statsRes.json() : null)
            if (activityRes.ok) setActivities(await activityRes.json())
            if (healthRes.ok) setHealth(await healthRes.json())

        } catch (err) {
            console.error('Admin Fetch Error:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    if (user?.role !== 'admin') {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-secondary-foreground">You do not have administrative privileges to view this page.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 px-4 py-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-secondary-foreground">Platform-wide performance and monitoring metrics.</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 border-primary/50 text-primary px-3 py-1">
                    <ShieldCheck className="h-4 w-4" />
                    System Administrator
                </Badge>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-destructive flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={stats?.total_users}
                    icon={<Users className="h-4 w-4 text-primary" />}
                    description="Total registered accounts"
                    loading={loading}
                />
                <StatCard
                    title="Active Meters"
                    value={`${stats?.active_meters} / ${stats?.total_meters}`}
                    icon={<Activity className="h-4 w-4 text-green-500" />}
                    description="Currently reporting energy"
                    loading={loading}
                />
                <StatCard
                    title="Platform Volume"
                    value={`${stats?.total_volume_kwh.toFixed(2)} kWh`}
                    icon={<Zap className="h-4 w-4 text-yellow-500" />}
                    description="Total energy traded"
                    loading={loading}
                />
                <StatCard
                    title="Settlement Health"
                    value={`${stats?.settlement_success_rate}%`}
                    icon={<ShieldCheck className="h-4 w-4 text-primary" />}
                    description="Success rate of on-chain trades"
                    loading={loading}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4 bg-backgroundSecondary/50 border-secondary">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Platform Activity</CardTitle>
                        <CardDescription>Real-time monitor of smart meter and trading events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activities.length > 0 ? activities.map(item => (
                                <ActivityItem
                                    key={item.id}
                                    user={item.user_id ? `User ${item.user_id.substring(0, 8)}` : 'System'}
                                    action={item.event_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                    detail={formatActivityDetail(item)}
                                    time={formatTimeAgo(item.created_at)}
                                />
                            )) : (
                                <p className="text-sm text-secondary-foreground py-4 text-center">No recent activity detected.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 bg-backgroundSecondary/50 border-secondary">
                    <CardHeader>
                        <CardTitle className="text-lg">Grid Health</CardTitle>
                        <CardDescription>Infrastructure and Service Status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {health ? health.dependencies.map(dep => (
                            <HealthIndicator
                                key={dep.name}
                                name={dep.name}
                                status={mapStatus(dep.status)}
                            />
                        )) : (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-6 w-full opacity-20" />)}
                            </div>
                        )}
                        {!health && !loading && <p className="text-xs text-destructive text-center">Health data unavailable</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Helper: Format relative time
function formatTimeAgo(dateStr: string) {
    try {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
        if (diff < 10) return 'Just now'
        if (diff < 60) return `${diff}s ago`
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return date.toLocaleDateString()
    } catch (e) {
        return 'Recently'
    }
}

// Helper: Format activity-specific details
function formatActivityDetail(activity: ActivityLog) {
    const data = activity.event_data
    if (!data) return ''

    switch (activity.event_type) {
        case 'order_created': return `${data.amount} kWh @ ${data.price} GRX`
        case 'order_matched': return `${data.amount} kWh matched`
        case 'user_login': return `IP: ${data.ip || 'Unknown'}`
        case 'blockchain_registration': return `Wallet: ${data.wallet_address?.substring(0, 8)}...`
        default: return activity.event_type.includes('fail') ? 'Error logged' : 'System event'
    }
}

// Helper: Map Backend Status to UI Status
function mapStatus(status: string): 'operational' | 'degraded' | 'offline' {
    if (status === 'healthy') return 'operational'
    if (status === 'degraded') return 'degraded'
    return 'offline'
}

function StatCard({ title, value, icon, description, loading }: any) {
    return (
        <Card className="bg-backgroundSecondary border-secondary overflow-hidden group hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-24 mb-1" />
                ) : (
                    <div className="text-2xl font-bold">{value ?? 0}</div>
                )}
                <p className="text-xs text-secondary-foreground">{description}</p>
            </CardContent>
            <div className="h-1 w-full bg-secondary">
                <div className="h-1 bg-primary w-1/3 group-hover:w-full transition-all duration-500" />
            </div>
        </Card>
    )
}

function ActivityItem({ user, action, detail, time }: any) {
    return (
        <div className="flex items-center justify-between text-sm py-2 border-b border-secondary last:border-0">
            <div className="flex flex-col">
                <span className="font-medium text-primary">{user}</span>
                <span className="text-secondary-foreground">{action}</span>
            </div>
            <div className="text-right flex flex-col">
                <span className="text-xs font-mono">{detail}</span>
                <span className="text-[10px] text-secondary-foreground opacity-70">{time}</span>
            </div>
        </div>
    )
}

function HealthIndicator({ name, status }: { name: string, status: 'operational' | 'degraded' | 'offline' | 'processing' }) {
    const colors = {
        operational: 'bg-green-500',
        degraded: 'bg-yellow-500',
        offline: 'bg-red-500',
        processing: 'bg-blue-500'
    }

    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium">{name}</span>
            <div className="flex items-center gap-2">
                <span className="text-xs capitalize text-secondary-foreground">{status}</span>
                <div className={`h-2 w-2 rounded-full ${colors[status]} shadow-[0_0_8px_rgba(34,197,94,0.4)]`} />
            </div>
        </div>
    )
}
