'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    ClipboardList,
    Search,
    Filter,
    ArrowRightLeft,
    UserPlus,
    Key,
    ShieldAlert,
    Loader2,
    Calendar
} from 'lucide-react'
import { useAdminActivity, useAuth } from '@/hooks/useApi'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'

export function ActivityLog() {
    const { token } = useAuth()
    const { activities, loading } = useAdminActivity(token ?? undefined)

    const getEventIcon = (type: string) => {
        if (type.includes('login')) return <Key className="h-4 w-4 text-blue-500" />
        if (type.includes('register')) return <UserPlus className="h-4 w-4 text-green-500" />
        if (type.includes('order')) return <ArrowRightLeft className="h-4 w-4 text-primary" />
        if (type.includes('unauthorized') || type.includes('failed')) return <ShieldAlert className="h-4 w-4 text-red-500" />
        return <ClipboardList className="h-4 w-4 text-muted-foreground" />
    }

    if (loading && !activities) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-3 text-lg font-medium">Retrieving Platform Trail...</span>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-8 rounded-2xl border shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-500/10 rounded-2xl">
                        <ClipboardList className="h-10 w-10 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white">Platform Activity</h1>
                        <p className="text-muted-foreground mt-2 text-lg">Comprehensive audit trail of security and operational events.</p>
                    </div>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search logs (type, user, IP)..." className="pl-10 bg-white/5 border-white/10" />
                </div>
            </header>

            <Card className="border-none shadow-2xl overflow-hidden bg-card/60 backdrop-blur-md">
                <CardHeader className="border-b border-white/5 bg-muted/20 py-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-4 w-4 text-primary" />
                            Audit Stream
                        </CardTitle>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="bg-primary/5 text-primary">All Events</Badge>
                            <Badge variant="outline" className="opacity-50">Security Only</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="font-bold">Event</TableHead>
                                <TableHead className="font-bold">Actor (User ID)</TableHead>
                                <TableHead className="font-bold">IP Address</TableHead>
                                <TableHead className="font-bold">Timestamp</TableHead>
                                <TableHead className="font-bold text-right">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activities?.map((activity) => (
                                <TableRow key={activity.id} className="hover:bg-white/5 transition-colors border-white/5 group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                                                {getEventIcon(activity.event_type)}
                                            </div>
                                            <span className="font-bold text-sm uppercase tracking-tight">{activity.event_type.replace('_', ' ')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {activity.user_id ? `${activity.user_id.substring(0, 8)}...` : 'System / Guest'}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{activity.ip_address || 'Internal'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(activity.created_at), 'MMM dd, HH:mm:ss')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <button className="text-[10px] font-bold text-primary uppercase hover:underline">View Metadata</button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!activities || activities.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                        No activity logs recorded in the last 24 hours.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
