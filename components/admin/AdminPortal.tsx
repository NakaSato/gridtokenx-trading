'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import {
    CircleDollarSign,
    Zap,
    Users,
    Activity,
    ArrowRight,
    ShieldCheck,
    LayoutDashboard
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function AdminPortal() {
    const adminTools = [
        {
            title: 'Revenue & Collection',
            description: 'Monitor platform fees, wheeling charges, and on-chain settlement revenue.',
            href: '/admin/revenue',
            icon: <CircleDollarSign className="h-8 w-8 text-green-500" />,
            badge: 'Financial',
            color: 'border-l-green-500'
        },
        {
            title: 'VPP Orchestration',
            description: 'Manage Virtual Power Plant clusters and trigger grid balancing dispatches.',
            href: '/admin/vpp',
            icon: <Zap className="h-8 w-8 text-yellow-500" />,
            badge: 'Grid Ops',
            color: 'border-l-yellow-500'
        },
        {
            title: 'User Management',
            description: 'Review user registrations, roles, and linked wallet addresses.',
            href: '/admin/users',
            icon: <Users className="h-8 w-8 text-blue-500" />,
            badge: 'Governance',
            color: 'border-l-blue-500',
        },
        {
            title: 'System Health',
            description: 'Monitor API gateway performance, database status, and blockchain sync.',
            href: '/admin/health',
            icon: <Activity className="h-8 w-8 text-purple-500" />,
            badge: 'DevOps',
            color: 'border-l-purple-500',
        },
        {
            title: 'Activity Log',
            description: 'Comprehensive audit trail of security and operational events.',
            href: '/admin/activity',
            icon: <LayoutDashboard className="h-8 w-8 text-indigo-500" />,
            badge: 'Audit',
            color: 'border-l-indigo-500',
        }
    ]

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        <span className="text-sm font-bold uppercase tracking-widest text-primary/80">Command Center</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Admin Portal</h1>
                    <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
                        Centralized orchestration and monitoring tools for the GridTokenX ecosystem.
                    </p>
                </div>
                <Badge variant="outline" className="px-4 py-1.5 text-md font-semibold bg-primary/5 border-primary/20 backdrop-blur-sm">
                    Superuser Access
                </Badge>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                {adminTools.map((tool) => (
                    <Link
                        key={tool.title}
                        href={tool.href}
                    >
                        <Card className={`group relative h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-l-4 ${tool.color} bg-card/40 backdrop-blur-md overflow-hidden`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                {tool.icon}
                            </div>
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                                        {tool.icon}
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0">{tool.badge}</Badge>
                                </div>
                                <CardTitle className="text-2xl group-hover:text-primary transition-colors flex items-center gap-2">
                                    {tool.title}
                                    <ArrowRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                </CardTitle>
                                <CardDescription className="text-md leading-relaxed pt-2">
                                    {tool.description}
                                </CardDescription>
                            </CardHeader>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent group-hover:via-primary block animate-pulse"></div>
                        </Card>
                    </Link>
                ))}
            </div>

            <section className="mt-12">
                <Card className="bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 border-dashed">
                    <CardContent className="flex flex-col md:flex-row items-center justify-between p-8 gap-6">
                        <div className="flex gap-4 items-center">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <LayoutDashboard className="h-10 w-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">System Overview</h3>
                                <p className="text-muted-foreground">View aggregated metrics across all administrative domains.</p>
                            </div>
                        </div>
                        <Link href="/admin/analytics">
                            <button className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all">
                                Launch Global Metadata
                            </button>
                        </Link>
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}
