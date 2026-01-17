'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { ClusteringVisualization } from '@/components/energy-profile/ClusteringVisualization'
import { RecommendationsCard } from '@/components/energy-profile/RecommendationsCard'
import {
    Activity,
    Zap,
    BarChart3,
    Clock,
    Shield,
    RefreshCw,
    TrendingUp,
    Sun,
    Moon,
    Battery,
    Cpu,
    Lock,
    Wifi,
    AlertTriangle,
    CheckCircle2,
    Info,
    LineChart,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar,
} from 'recharts'
import { cn } from '@/lib/utils'
// Profile archetype definitions imported from hook
import { useEnergyProfile, PROFILE_ARCHETYPES } from '@/hooks/useEnergyProfile'

export default function EnergyProfilesPage() {
    const { token, isAuthenticated } = useAuth()
    const [activeTab, setActiveTab] = useState('overview')

    const { data: profileData, isLoading, error, refetch, isRefetching } = useEnergyProfile()

    if (!isAuthenticated) {
        return (
            <main className="flex h-full flex-1 flex-col items-center justify-center p-6">
                <Activity className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Energy Profiles</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    Sign in to view your personalized energy consumption profile and analytics.
                </p>
            </main>
        )
    }

    return (
        <ProtectedRoute requireWallet={false} requireAuth={true}>
            <main className="flex h-full flex-1 flex-col gap-6 p-6 overflow-y-auto">
                {/* Header */}
                <header className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Energy Profile</h1>
                        <p className="text-sm text-muted-foreground">
                            Your personalized energy consumption fingerprint and analytics
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading || isRefetching}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </header>

                {/* Profile Summary Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    {/* Profile Archetype */}
                    <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="p-5">
                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <Cpu className="h-4 w-4" />
                                        <span>Profile Type</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">
                                        {profileData?.archetype.name || 'Analyzing...'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {profileData?.archetype.description}
                                    </p>
                                    <Badge
                                        className="mt-3"
                                        style={{ backgroundColor: profileData?.archetype.color + '20', color: profileData?.archetype.color }}
                                    >
                                        {profileData?.archetype.id.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Average Daily Consumption */}
                    <Card>
                        <CardContent className="p-5">
                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <Zap className="h-4 w-4" />
                                        <span>Daily Average</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {(profileData?.characteristics?.avgDailyKwh ?? 0).toFixed(1)} kWh
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Based on 30-day analysis
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Peak Hour */}
                    <Card>
                        <CardContent className="p-5">
                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <Clock className="h-4 w-4" />
                                        <span>Peak Hour</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {profileData?.characteristics.peakHour || '--:--'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Peak-to-Avg Ratio: {(profileData?.characteristics?.peakToAvgRatio ?? 1).toFixed(2)}x
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Data Quality */}
                    <Card>
                        <CardContent className="p-5">
                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <BarChart3 className="h-4 w-4" />
                                        <span>Data Quality</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-bold text-foreground">
                                            {(profileData?.dataQuality?.dataCompleteness ?? 0).toFixed(0)}%
                                        </h3>
                                        {(profileData?.dataQuality.dataCompleteness || 0) >= 80 ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Resolution: {profileData?.dataQuality.intervalResolution}
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* Main Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full max-w-xl grid-cols-4 mb-4">
                        <TabsTrigger value="overview" className="text-xs sm:text-sm">
                            <Activity className="h-4 w-4 mr-1 sm:mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="patterns" className="text-xs sm:text-sm">
                            <LineChart className="h-4 w-4 mr-1 sm:mr-2" />
                            Patterns
                        </TabsTrigger>
                        <TabsTrigger value="requirements" className="text-xs sm:text-sm">
                            <Info className="h-4 w-4 mr-1 sm:mr-2" />
                            Requirements
                        </TabsTrigger>
                        <TabsTrigger value="security" className="text-xs sm:text-sm">
                            <Shield className="h-4 w-4 mr-1 sm:mr-2" />
                            Security
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="flex-1 space-y-4 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Hourly Load Profile */}
                            <ErrorBoundary name="Hourly Load Profile">
                                <Card className="col-span-1">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            24-Hour Load Profile
                                        </CardTitle>
                                        <CardDescription>Average consumption by hour of day</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoading ? (
                                            <Skeleton className="h-[250px] w-full" />
                                        ) : (
                                            <div className="h-[250px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={profileData?.hourlyDistribution || []}>
                                                        <defs>
                                                            <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                                        <XAxis
                                                            dataKey="hour"
                                                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            interval={3}
                                                        />
                                                        <YAxis
                                                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickFormatter={(v) => `${v.toFixed(1)}`}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: 'hsl(var(--background))',
                                                                border: '1px solid hsl(var(--border))',
                                                                borderRadius: '8px',
                                                            }}
                                                            formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Consumption']}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="consumption"
                                                            stroke="hsl(var(--primary))"
                                                            strokeWidth={2}
                                                            fill="url(#colorLoad)"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </ErrorBoundary>

                            {/* Weekly Pattern */}
                            <ErrorBoundary name="Weekly Pattern">
                                <Card className="col-span-1">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            Weekly Pattern
                                        </CardTitle>
                                        <CardDescription>Consumption trends across the week</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsBarChart data={profileData?.weeklyPattern || []}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                                    <XAxis
                                                        dataKey="day"
                                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--background))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: '8px',
                                                        }}
                                                    />
                                                    <Bar dataKey="consumption" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                                </RechartsBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </ErrorBoundary>
                        </div>

                        {/* Profile Characteristics */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-primary" />
                                    Profile Characteristics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-secondary/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sun className="h-4 w-4 text-yellow-500" />
                                            <span className="text-xs text-muted-foreground">Daytime Ratio</span>
                                        </div>
                                        <p className="text-xl font-bold">
                                            {((profileData?.characteristics.daytimeRatio || 0.5) * 100).toFixed(0)}%
                                        </p>
                                        <Progress value={(profileData?.characteristics.daytimeRatio || 0.5) * 100} className="mt-2 h-1.5" />
                                    </div>
                                    <div className="p-4 bg-secondary/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Moon className="h-4 w-4 text-indigo-500" />
                                            <span className="text-xs text-muted-foreground">Nighttime Ratio</span>
                                        </div>
                                        <p className="text-xl font-bold">
                                            {((1 - (profileData?.characteristics.daytimeRatio || 0.5)) * 100).toFixed(0)}%
                                        </p>
                                        <Progress value={(1 - (profileData?.characteristics.daytimeRatio || 0.5)) * 100} className="mt-2 h-1.5" />
                                    </div>
                                    <div className="p-4 bg-secondary/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Battery className="h-4 w-4 text-green-500" />
                                            <span className="text-xs text-muted-foreground">Baseload</span>
                                        </div>
                                        <p className="text-xl font-bold">
                                            {(profileData?.characteristics?.baseload ?? 0).toFixed(2)} kW
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">Standby power</p>
                                    </div>
                                    <div className="p-4 bg-secondary/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <span className="text-xs text-muted-foreground">Peak/Avg Ratio</span>
                                        </div>
                                        <p className="text-xl font-bold">
                                            {(profileData?.characteristics?.peakToAvgRatio ?? 1).toFixed(2)}x
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {(profileData?.characteristics.peakToAvgRatio || 1) > 2 ? 'Spiky' : 'Flat'} profile
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Patterns Tab */}
                    <TabsContent value="patterns" className="flex-1 space-y-4 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Profile Archetypes Visualization */}
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base">Profile Clustering Analysis</CardTitle>
                                            <CardDescription>
                                                Visualizing your consumption pattern against 5 standardized archetypes
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="flex items-center bg-background/50 backdrop-blur-sm shadow-sm">
                                            <Activity className="h-3 w-3 mr-1 text-primary" />
                                            Live Analysis
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 min-h-[300px] flex items-center justify-center bg-secondary/10 rounded-xl p-4 border border-border/50">
                                            {isLoading ? (
                                                <Skeleton className="h-[280px] w-full max-w-[500px] rounded-full" />
                                            ) : profileData?.clustering ? (
                                                <ClusteringVisualization
                                                    data={profileData.clustering}
                                                />
                                            ) : (
                                                <div className="text-center text-muted-foreground p-8">
                                                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                                    <p>Insufficient data for clustering analysis</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full md:w-[280px] space-y-3">
                                            <h4 className="text-sm font-medium mb-3">Cluster Definitions</h4>
                                            {PROFILE_ARCHETYPES.map((arch) => (
                                                <div
                                                    key={arch.id}
                                                    className={cn(
                                                        "flex items-start gap-3 p-2.5 rounded-lg border transition-all hover:bg-secondary/40",
                                                        profileData?.archetype.id === arch.id
                                                            ? "bg-primary/5 border-primary/30 shadow-sm"
                                                            : "border-transparent bg-secondary/20"
                                                    )}
                                                >
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                                                        style={{ backgroundColor: arch.color }}
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium text-xs text-foreground">{arch.name}</h4>
                                                            {profileData?.archetype.id === arch.id && (
                                                                <Badge variant="secondary" className="h-4 px-1 text-[9px]">YOU</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{arch.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recommendations */}
                            <RecommendationsCard
                                recommendations={profileData?.recommendations || []}
                                archetypeName={profileData?.archetype.name}
                                className="h-full"
                            />

                            {/* Temporal Requirements */}
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        Temporal Consistency
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            For accurate profiling, at least <strong>one year of data</strong> is required
                                            to account for seasonal variations.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Data Collection Progress</span>
                                                <span className="font-medium">{Math.min(100, (profileData?.readings?.length || 0) / 3.65).toFixed(0)}%</span>
                                            </div>
                                            <Progress value={Math.min(100, (profileData?.readings?.length || 0) / 3.65)} className="h-2" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="p-2 bg-secondary/20 rounded">
                                                <span className="text-muted-foreground">Readings</span>
                                                <p className="font-medium">{profileData?.readings?.length || 0}</p>
                                            </div>
                                            <div className="p-2 bg-secondary/20 rounded">
                                                <span className="text-muted-foreground">Goal</span>
                                                <p className="font-medium">365 readings</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Requirements Tab */}
                    <TabsContent value="requirements" className="flex-1 space-y-4 overflow-y-auto animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Technical Requirements */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Cpu className="h-4 w-4 text-primary" />
                                        Core Technical Requirements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Interval Data Resolution
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Data recorded every <strong>15, 30, or 60 minutes</strong>.
                                            Advanced applications require 6-8 second intervals for appliance signatures.
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                            <Zap className="h-4 w-4" />
                                            Measurement Metrics
                                        </h4>
                                        <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                                            <li><strong>Active Power (kW)</strong> - Real-time demand</li>
                                            <li><strong>Reactive Power (kVAr)</strong> - Grid stability</li>
                                            <li><strong>Voltage Quality</strong> - Equipment safety</li>
                                            <li><strong>Net Metering</strong> - Import/Export tracking</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                            <Wifi className="h-4 w-4" />
                                            Data Latency & Buffering
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Local buffering prevents data loss during outages, with transmission via AMI infrastructure.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Functional Requirements */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" />
                                        Functional Requirements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {[
                                            { icon: Wifi, title: 'Two-Way Communication', desc: 'Remote updates, price signals, on-demand reads' },
                                            { icon: Zap, title: 'Remote Connect/Disconnect', desc: 'Immediate service changes without site visits' },
                                            { icon: AlertTriangle, title: 'Tamper Detection', desc: 'Alerts for potential theft or meter bypass' },
                                            { icon: Clock, title: 'Time-of-Use Support', desc: 'Different tariffs for specific time blocks' },
                                            { icon: Activity, title: 'Customer Portals', desc: 'Graphical displays for energy-conscious behavior' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg">
                                                <item.icon className="h-4 w-4 text-primary mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium text-sm">{item.title}</h4>
                                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="flex-1 space-y-4 animate-in fade-in duration-300">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Security & Privacy Constraints
                                </CardTitle>
                                <CardDescription>
                                    High-resolution energy profiles can reveal sensitive information—the following protections are mandatory.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-5 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg">
                                        <Lock className="h-8 w-8 text-green-500 mb-3" />
                                        <h4 className="font-semibold mb-2">Data Anonymization</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Stripping PII (Personally Identifiable Information) before using data for grid-wide research.
                                        </p>
                                        <Badge className="mt-3 bg-green-500/20 text-green-500">Active</Badge>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg">
                                        <Shield className="h-8 w-8 text-blue-500 mb-3" />
                                        <h4 className="font-semibold mb-2">Role-Based Access</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Only authorized entities (consumer and utility) can access granular interval data.
                                        </p>
                                        <Badge className="mt-3 bg-blue-500/20 text-blue-500">Enforced</Badge>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg">
                                        <Lock className="h-8 w-8 text-purple-500 mb-3" />
                                        <h4 className="font-semibold mb-2">End-to-End Encryption</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Protecting data as it travels from the Home Area Network (HAN) to cloud infrastructure.
                                        </p>
                                        <Badge className="mt-3 bg-purple-500/20 text-purple-500">TLS 1.3</Badge>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-sm">Privacy Notice</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                High-resolution energy profiles can reveal when your house is empty or which appliances are being used.
                                                Your data is protected under our privacy policy and only used for grid optimization and your personal analytics.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </ProtectedRoute>
    )
}
