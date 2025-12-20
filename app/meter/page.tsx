"use client"

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import { MeterResponse, MeterReading } from '@/types/meter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Activity,
    Zap,
    BatteryCharging,
    RefreshCw,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { MeterRegistrationModal } from '@/components/MeterRegistrationModal'

import { SubmitReadingModal } from '@/components/SubmitReadingModal'

export default function SmartMeterPage() {
    const { token, user } = useAuth()
    const [meters, setMeters] = useState<MeterResponse[]>([])
    const [readings, setReadings] = useState<MeterReading[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState("readings")
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)

    // State for submit reading modal
    const [isSubmitOpen, setIsSubmitOpen] = useState(false)
    const [selectedMeterSerial, setSelectedMeterSerial] = useState<string>('')

    const fetchData = async () => {
        if (!token) return

        try {
            setRefreshing(true)
            const client = createApiClient(token)

            const [metersRes, readingsRes] = await Promise.all([
                client.getMyMeters(),
                client.getMyReadings(50, 0) // Limit 50
            ])

            if (metersRes.data) setMeters(metersRes.data)
            if (readingsRes.data) setReadings(readingsRes.data)

        } catch (error) {
            console.error("Error fetching meter data:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [token])

    useEffect(() => {
        console.log("Meters Data:", meters)
    }, [meters])

    // Calculate Stats
    const totalGenerated = readings.reduce((acc, r) => r.kwh > 0 ? acc + r.kwh : acc, 0)
    const totalConsumed = readings.reduce((acc, r) => r.kwh < 0 ? acc + Math.abs(r.kwh) : acc, 0)
    const netEnergy = totalGenerated - totalConsumed

    const lastUpdate = readings.length > 0 ? new Date(readings[0].timestamp) : null

    const handleOpenSubmit = (serial: string) => {
        setSelectedMeterSerial(serial)
        setIsSubmitOpen(true)
    }

    return (
        <ProtectedRoute requireWallet={false} requireAuth={true}>
            <main className="flex h-full flex-1 flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Smart Energy Dashboard</h1>
                        <p className="text-muted-foreground">Monitor your energy production and consumption in real-time.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button size="sm" onClick={() => setIsRegisterOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Register Meter
                        </Button>
                    </div>
                </div>

                <MeterRegistrationModal
                    isOpen={isRegisterOpen}
                    onClose={() => setIsRegisterOpen(false)}
                    onSuccess={fetchData}
                />

                {/* Submit Reading Modal */}
                <SubmitReadingModal
                    isOpen={isSubmitOpen}
                    onClose={() => setIsSubmitOpen(false)}
                    meterSerial={selectedMeterSerial}
                    onSuccess={fetchData}
                />

                {/* Stats Overview */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Generation</CardTitle>
                            <Zap className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalGenerated.toFixed(2)} kWh</div>
                            <p className="text-xs text-muted-foreground">
                                Lifetime production
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
                            <BatteryCharging className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalConsumed.toFixed(2)} kWh</div>
                            <p className="text-xs text-muted-foreground">
                                Lifetime usage
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Energy</CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netEnergy >= 0 ? 'text-green-500' : 'text-orange-500'}`}>
                                {netEnergy > 0 ? '+' : ''}{netEnergy.toFixed(2)} kWh
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Current Balance
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Meters</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{meters.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {lastUpdate ? `Last update: ${format(lastUpdate, 'HH:mm:ss')}` : 'No data'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center border-b pb-2 mb-4">
                        <Button
                            variant={activeTab === 'readings' ? 'secondary' : 'ghost'}
                            onClick={() => setActiveTab('readings')}
                            className="mr-2 rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground"
                            data-state={activeTab === 'readings' ? 'active' : ''}
                        >
                            Recent Readings
                        </Button>
                        <Button
                            variant={activeTab === 'meters' ? 'secondary' : 'ghost'}
                            onClick={() => setActiveTab('meters')}
                            className="rounded-none border-b-2 border-transparent px-4 pb-2 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground"
                            data-state={activeTab === 'meters' ? 'active' : ''}
                        >
                            My Meters
                        </Button>
                    </div>

                    {activeTab === 'readings' && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Reading History</CardTitle>
                                    <CardDescription>
                                        Recent energy readings recorded on the blockchain.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex h-40 items-center justify-center">Loading...</div>
                                    ) : readings.length === 0 ? (
                                        <div className="flex h-40 items-center justify-center text-muted-foreground">No readings found. Generate some data!</div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <div className="grid grid-cols-5 gap-4 border-b bg-muted/50 p-4 text-sm font-medium">
                                                <div>Time</div>
                                                <div>Type</div>
                                                <div>Amount</div>
                                                <div>Status</div>
                                                <div className="text-right">Tx Signature</div>
                                            </div>
                                            <div className="max-h-[400px] overflow-y-auto">
                                                {readings.map((reading) => (
                                                    <div key={reading.id} className="grid grid-cols-5 gap-4 border-b p-4 text-sm last:border-0 hover:bg-muted/50">
                                                        <div className="flex items-center">{format(new Date(reading.timestamp), 'MMM dd, HH:mm')}</div>
                                                        <div className="flex items-center">
                                                            {reading.kwh > 0 ? (
                                                                <span className="flex items-center text-green-500"><ArrowUpRight className="mr-1 h-4 w-4" /> Generation</span>
                                                            ) : (
                                                                <span className="flex items-center text-orange-500"><ArrowDownRight className="mr-1 h-4 w-4" /> Consumption</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center font-medium">
                                                            {Math.abs(reading.kwh)} kWh
                                                        </div>
                                                        <div className="flex items-center">
                                                            {reading.minted ? (
                                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                                                                    Settled
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-end font-mono text-xs text-muted-foreground truncate">
                                                            {reading.tx_signature ? reading.tx_signature.slice(0, 16) + '...' : '-'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'meters' && (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {meters.length > 0 ? (
                                    meters.map((meter) => (
                                        <Card key={meter.id}>
                                            <CardHeader>
                                                <CardTitle className="flex items-center justify-between">
                                                    <span>{meter.meter_type.replace('_', ' ')} Meter</span>
                                                    {meter.is_verified ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                                                    )}
                                                </CardTitle>
                                                <CardDescription className="font-mono text-xs">{meter.serial_number}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid gap-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Location:</span>
                                                        <span>{meter.location}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground">Status:</span>
                                                        <span className={meter.is_verified ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                                                            {meter.is_verified ? "Active" : "Unverified"}
                                                        </span>
                                                    </div>

                                                    <div className="pt-4">
                                                        <Button
                                                            className="w-full"
                                                            variant="outline"
                                                            onClick={() => handleOpenSubmit(meter.serial_number)}
                                                            disabled={!meter.is_verified}
                                                        >
                                                            <Upload className="mr-2 h-4 w-4" />
                                                            Submit Reading
                                                        </Button>
                                                        {!meter.is_verified && (
                                                            <p className="text-[10px] text-muted-foreground text-center mt-1">
                                                                Meter must be verified to submit data
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    !loading && (
                                        <div className="col-span-full flex h-40 items-center justify-center text-muted-foreground border rounded-md border-dashed">
                                            No meters registered. Register one to get started!
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </ProtectedRoute>
    )
}

// Add Upload icon import
import { Upload } from 'lucide-react'

