'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { defaultApiClient } from '@/lib/api-client'
import { Loader2 } from 'lucide-react'

interface SubmitReadingFormProps {
    onSuccess: () => void
}

export default function SubmitReadingForm({ onSuccess }: SubmitReadingFormProps) {
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    // Removed useToast hook as we use direct toast import

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const kwh = parseFloat(amount)
            if (isNaN(kwh) || kwh <= 0) {
                throw new Error('Please enter a valid amount')
            }

            await defaultApiClient.submitMeterData({
                kwh_amount: kwh,
                reading_timestamp: new Date().toISOString(),
                // Use default/legacy path for now, backend handles missing serial
            })

            toast.success(`Successfully submitted ${kwh} kWh. Tokens will be minted shortly.`)
            setAmount('')
            onSuccess()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to submit reading')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit Meter Reading</CardTitle>
                <CardDescription>
                    Manually submit energy production data (in place of smart meter hardware).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Energy Produced (kWh)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="e.g. 10.5"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Reading
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
