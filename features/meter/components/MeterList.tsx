'use client'

import React from 'react'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import { MeterResponse } from '@/types/meter'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/features/auth/provider'

interface MeterListProps {
    meters: MeterResponse[]
    loading: boolean
}

export function MeterList({ meters, loading }: MeterListProps) {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    // Which serial is mid-verification — the mutation is shared across cards, so
    // only the clicked one should show a spinner.
    const [verifying, setVerifying] = React.useState<string | null>(null)

    const verifyMutation = useMutation({
        mutationFn: async (serial: string) => {
            if (!token) throw new Error('Please log in to verify a meter')
            const res = await createApiClient(token).verifyMeter(serial)
            if (res.error) throw new Error(res.error)
            return res.data
        },
        onSuccess: (data) => {
            toast.success(
                data?.already_verified
                    ? 'This meter was already verified.'
                    : `Meter verified from ${data?.attestation.attested_readings ?? 0} signed reading(s) — you can now sell energy.`
            )
            // Both the dashboard's own query and the shared "my meters" slot the
            // order form's sell gate reads, so the Sell tab unblocks immediately.
            queryClient.invalidateQueries({ queryKey: ['smartMeter'] })
            queryClient.invalidateQueries({ queryKey: ['meters', 'mine'] })
        },
        onError: (e: Error) => toast.error(e.message),
        onSettled: () => setVerifying(null),
    })

    const onVerify = (serial: string) => {
        setVerifying(serial)
        verifyMutation.mutate(serial)
    }

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
                                    {/* Says what the state MEANS for the user. "Active" was
                                        misleading: an unverified meter reports fine, it just
                                        cannot back a sell order. */}
                                    <span className={meter.is_verified ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                                        {meter.is_verified ? "Verified · can sell" : "Unverified · cannot sell"}
                                    </span>
                                </div>
                            </div>

                            {!meter.is_verified && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Verification confirms this device is yours. It succeeds once
                                        the meter has sent signed readings — bring it online first if
                                        it hasn&apos;t reported yet.
                                    </p>
                                    <Button
                                        data-testid={`verify-meter-${meter.serial_number}`}
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        disabled={verifying === meter.serial_number}
                                        onClick={() => onVerify(meter.serial_number)}
                                    >
                                        {verifying === meter.serial_number ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4" />
                                                Verifying…
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                Verify meter
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
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
