'use client'

import React, { useState } from 'react'
import {
    useRevenueSummary,
    useRevenueRecords,
    useAuth
} from '@/hooks/useApi'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, TrendingUp, DollarSign, Zap, AlertCircle, Download } from 'lucide-react'
import { format } from 'date-fns'

export function RevenueDashboard() {
    const { token } = useAuth()
    const { summary, loading: summaryLoading, error: summaryError } = useRevenueSummary(token ?? undefined)
    const { records, loading: recordsLoading, error: recordsError } = useRevenueRecords(token ?? undefined)
    const [exporting, setExporting] = useState(false)

    const handleExport = async () => {
        if (!token) return
        setExporting(true)
        try {
            // Reusing existing export method from ApiClient
            const { createApiClient } = await import('@/lib/api-client')
            const client = createApiClient(token)
            const response = await client.exportTradingHistory('csv')

            if (response.data) {
                const url = window.URL.createObjectURL(response.data as any)
                const a = document.createElement('a')
                a.href = url
                a.download = `revenue_report_${format(new Date(), 'yyyyMMdd')}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error('Export failed:', error)
        } finally {
            setExporting(false)
        }
    }

    if (summaryLoading || recordsLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading revenue data...</span>
            </div>
        )
    }

    if (summaryError || recordsError) {
        return (
            <div className="rounded-lg bg-destructive/10 p-6 text-destructive">
                <div className="flex items-center">
                    <AlertCircle className="h-6 w-6 mr-2" />
                    <h3 className="text-lg font-semibold">Error Loading Dashboard</h3>
                </div>
                <p className="mt-2">{summaryError || recordsError}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6 bg-background">
            <header className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Platform Revenue & Collection
                    </h1>
                    <p className="text-muted-foreground mt-1">Real-time overview of on-chain trading fees and platform income.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex gap-2"
                    >
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export to CSV
                    </Button>
                    <Badge variant="outline" className="text-sm font-medium px-3 py-1 bg-primary/5">Admin View</Badge>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                    title="Total Revenue"
                    value={summary?.total_revenue ?? '0'}
                    icon={<DollarSign className="h-5 w-5 text-green-500" />}
                    description="Total fees collected across all trades"
                />
                <SummaryCard
                    title="Platform Fees"
                    value={summary?.platform_fees ?? '0'}
                    icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
                    description="Base trading commissions"
                />
                <SummaryCard
                    title="Wheeling Charges"
                    value={summary?.wheeling_charges ?? '0'}
                    icon={<Zap className="h-5 w-5 text-yellow-500" />}
                    description="Grid utilization revenue"
                />
                <SummaryCard
                    title="Settlements"
                    value={summary?.settlement_count?.toString() ?? '0'}
                    icon={<AlertCircle className="h-5 w-5 text-purple-500" />}
                    description="Total successful trades processed"
                    isNumber
                />
            </div>

            {/* Collection Records Table */}
            <Card className="border shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="text-xl flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                        Collection History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-semibold">ID</TableHead>
                                <TableHead className="font-semibold">Type</TableHead>
                                <TableHead className="font-semibold">Amount</TableHead>
                                <TableHead className="font-semibold">Description</TableHead>
                                <TableHead className="font-semibold text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No collection records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                records?.map((record) => (
                                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {record.id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <RevenueBadge type={record.revenue_type} />
                                        </TableCell>
                                        <TableCell className="font-bold text-primary">
                                            {record.amount} GRX
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-sm">
                                            {record.description || 'System collection'}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {format(new Date(record.created_at), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function SummaryCard({
    title,
    value,
    icon,
    description,
    isNumber = false
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    description: string;
    isNumber?: boolean;
}) {
    return (
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50 overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{title}</CardTitle>
                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {!isNumber && <span className="text-primary mr-1"></span>}
                    {value}
                    {!isNumber && <span className="text-xs font-normal text-muted-foreground ml-1">GRX</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}

function RevenueBadge({ type }: { type: string }) {
    const variants: Record<string, { label: string; className: string }> = {
        platform_fee: { label: 'Platform Fee', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        wheeling_charge: { label: 'Wheeling', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
        loss_cost: { label: 'Loss Cost', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    }

    const config = variants[type] || { label: type, className: 'bg-gray-500/10 text-gray-500' }

    return (
        <Badge variant="outline" className={`${config.className} font-medium`}>
            {config.label}
        </Badge>
    )
}
