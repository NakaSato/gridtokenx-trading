'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { MeterResponse } from '@/types/meter'

interface MeterListProps {
    meters: MeterResponse[]
    loading: boolean
}

export function MeterList({ meters, loading }: MeterListProps) {
    return (
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
    )
}

export const MemoizedMeterList = React.memo(MeterList)
