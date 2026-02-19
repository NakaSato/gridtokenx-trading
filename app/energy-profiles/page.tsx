'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
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
import { cn } from '@/lib/utils'
// Profile archetype definitions imported from hook
import { useEnergyProfile, PROFILE_ARCHETYPES } from '@/hooks/useEnergyProfile'
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { getProgram } from "@/lib/program"
import { fetchMeterHistory } from "@/lib/contract-actions"
import { StatCard } from "@/components/dashboard/StatCard"

export default function EnergyProfilesPage() {
    const { token, isAuthenticated } = useAuth()
    const [activeTab, setActiveTab] = useState('overview')

    const { data: profileData, isLoading, error, refetch, isRefetching } = useEnergyProfile()

    // -- Dashboard Logic --
    const { publicKey } = useWallet()
    const { connection } = useConnection()
    const [chartData, setChartData] = useState([])
    const [stats, setStats] = useState({
        generation: "0 kWh",
        earnings: "0 USDC",
        credits: "0 REC",
    })

    useEffect(() => {
        const loadData = async () => {
            if (!publicKey) return
            try {
                const program = getProgram(connection, { publicKey } as any)
                const history = await fetchMeterHistory(program, publicKey)
                setChartData(history as any)
                if (history.length > 0) {
                    const lastReading = history[history.length - 1].value
                    const initialReading = history[0].value
                    const generated = lastReading - initialReading
                    setStats(prev => ({ ...prev, generation: `${generated} kWh` }))
                }
            } catch (e) {
                console.error("Dashboard Load Error:", e)
            }
        }
        loadData()
        const interval = setInterval(loadData, 10000)
        return () => clearInterval(interval)
    }, [publicKey, connection])



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
                        <TabsTrigger value="realtime" className="text-xs sm:text-sm">
                            <Zap className="h-4 w-4 mr-1 sm:mr-2" />
                            Real-Time
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
                            <Card className="col-span-1 lg:col-span-2">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" />
                                        Analytical Overview
                                    </CardTitle>
                                    <CardDescription>Your energy consumption profile is active.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[250px] flex items-center justify-center border border-dashed rounded-lg m-4 text-muted-foreground italic">
                                    Visualizations simplified for performance.
                                </CardContent>
                            </Card>
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

                    {/* Real-Time Tab (Dashboard) */}
                    <TabsContent value="realtime" className="flex-1 space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center space-x-2 mb-4">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-sm text-green-500 font-medium">Grid Connection Active</span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Total Generation"
                                value={stats.generation}
                                icon={<Zap className="h-4 w-4 text-yellow-500" />}
                                trend="up"
                                change="+12% from yesterday"
                            />
                            <StatCard
                                title="Energy Credits"
                                value={stats.credits}
                                icon={<Sun className="h-4 w-4 text-orange-500" />}
                            />
                            <StatCard
                                title="Earnings"
                                value={stats.earnings}
                                icon={<BarChart3 className="h-4 w-4 text-green-500" />}
                                trend="up"
                                change="+2.4% this week"
                            />
                            <StatCard
                                title="Grid Status"
                                value="Stable"
                                icon={<Activity className="h-4 w-4 text-blue-500" />}
                            />
                        </div>

                        {/* Info Block */}
                        <Card className="p-8 flex items-center justify-center text-muted-foreground italic border-dashed">
                            Real-time streaming enabled.
                        </Card>
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
        </ProtectedRoute >
    )
}
