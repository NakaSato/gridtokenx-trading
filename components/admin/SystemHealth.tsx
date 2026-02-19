'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    Activity,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    Cpu,
    Database,
    Globe,
    Mail,
    Server,
    RefreshCw,
    Loader2
} from 'lucide-react'
import { useSystemHealth, useAuth } from '@/hooks/useApi'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export function SystemHealth() {
    const { token } = useAuth()
    const { health, loading, refetch } = useSystemHealth(token ?? undefined)

    if (loading && !health) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <span className="ml-4 text-xl font-medium">Probing System Dependencies...</span>
            </div>
        )
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-500" />
            case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
            case 'unhealthy': return <XCircle className="h-5 w-5 text-red-500" />
            default: return <Clock className="h-5 w-5 text-muted-foreground" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'healthy': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Operational</Badge>
            case 'degraded': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Degraded</Badge>
            case 'unhealthy': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Critical</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-center bg-card p-8 rounded-2xl border shadow-lg backdrop-blur-xl bg-opacity-80">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-purple-500/10 rounded-2xl">
                        <Server className="h-10 w-10 text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">System Health</h1>
                        <p className="text-muted-foreground mt-2 text-lg">Real-time status of platform infrastructure and dependencies.</p>
                    </div>
                </div>
                <Button variant="outline" size="lg" onClick={() => refetch()} className="flex gap-2">
                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Status
                </Button>
            </header>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Overall Status */}
                <Card className="md:col-span-2 border-none shadow-xl bg-card/60 backdrop-blur-md">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                <Activity className="h-6 w-6 text-primary" />
                                Service Status
                            </CardTitle>
                            {health && getStatusBadge(health.status)}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {health?.dependencies.map((dep) => (
                                <div key={dep.name} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-white/5 group hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-background rounded-lg shadow-sm">
                                            {dep.name.includes('Postgre') && <Database className="h-4 w-4" />}
                                            {dep.name.includes('Redis') && <Cpu className="h-4 w-4" />}
                                            {dep.name.includes('Solana') && <Globe className="h-4 w-4" />}
                                            {dep.name.includes('Email') && <Mail className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{dep.name}</div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {dep.response_time_ms ? `${dep.response_time_ms}ms` : 'No latency data'}
                                            </div>
                                        </div>
                                    </div>
                                    {getStatusIcon(dep.status)}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* System Metrics */}
                <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Cpu className="h-5 w-5 text-primary" />
                            Environment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">CPU Usage</span>
                                <span className="font-bold">{health?.metrics.cpu_usage?.toFixed(1) ?? 0}%</span>
                            </div>
                            <Progress value={health?.metrics.cpu_usage ?? 0} className="h-1.5" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Memory</span>
                                <span className="font-bold">
                                    {Math.round((health?.metrics.memory_used_mb ?? 0) / 1024)} / {Math.round((health?.metrics.memory_total_mb ?? 0) / 1024)} GB
                                </span>
                            </div>
                            <Progress
                                value={((health?.metrics.memory_used_mb ?? 0) / (health?.metrics.memory_total_mb ?? 1)) * 100}
                                className="h-1.5"
                            />
                        </div>

                        <div className="pt-4 border-t border-white/5 space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Uptime:</span>
                                <span className="font-mono">{Math.floor((health?.uptime_seconds ?? 0) / 3600)}h {Math.floor(((health?.uptime_seconds ?? 0) % 3600) / 60)}m</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Version:</span>
                                <span className="font-mono text-primary">{health?.version}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Environment:</span>
                                <Badge variant="outline" className="text-[10px] uppercase">{health?.environment}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dependency Details Section */}
            <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-xl">Dependency Details</CardTitle>
                    <CardDescription>Full error reporting and subsystem metadata.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg overflow-hidden border border-white/5">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[200px]">SubSystem</TableHead>
                                    <TableHead>Details / Error Message</TableHead>
                                    <TableHead className="text-right">Last Sync</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {health?.dependencies.map((dep) => (
                                    <TableRow key={dep.name} className="hover:bg-muted/20 border-white/5">
                                        <TableCell className="font-bold">{dep.name}</TableCell>
                                        <TableCell className="font-mono text-xs max-w-xl truncate">
                                            {dep.error_message ? (
                                                <span className="text-red-500">{dep.error_message}</span>
                                            ) : (
                                                <span className="text-muted-foreground">{dep.details || 'N/A'}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {format(new Date(dep.last_check), 'HH:mm:ss')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
