'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import { createApiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthProvider';

interface MeterRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function MeterRegistrationModal({ isOpen, onClose, onSuccess }: MeterRegistrationModalProps) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        meterSerial: '',
        location: '',
        meterType: 'Solar_Prosumer'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast.error('Please login first');
            return;
        }

        setLoading(true);
        try {
            const client = createApiClient(token);
            const response = await client.registerMeter({
                serial_number: formData.meterSerial,
                meter_type: formData.meterType,
                location: formData.location
            });

            if (response.error || (response.data && !response.data.success)) {
                toast.error(response.error || response.data?.message || 'Registration failed');
                return;
            }

            toast.success('Smart meter registered successfully!');
            onSuccess();
            onClose();

            // Reset form
            setFormData({
                meterSerial: '',
                location: '',
                meterType: 'Solar_Prosumer'
            });

        } catch (error) {
            console.error(error);
            toast.error('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Register Smart Meter</DialogTitle>
                    <DialogDescription>
                        Link your physical smart meter ID to the GridTokenX network.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="meterSerial">Meter Serial Number</Label>
                        <Input
                            id="meterSerial"
                            placeholder="e.g., bb6052e6-..."
                            value={formData.meterSerial}
                            onChange={(e) => setFormData({ ...formData, meterSerial: e.target.value })}
                            required
                        />
                        <p className="text-xs text-muted-foreground">Found on your Smart Meter device dashboard.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="meterType">Meter Type</Label>
                        <Select
                            value={formData.meterType}
                            onValueChange={(value) => setFormData({ ...formData, meterType: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select meter type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Solar_Prosumer">Solar Prosumer (Generate & Consume)</SelectItem>
                                <SelectItem value="Wind_Prosumer">Wind Prosumer (Generate & Consume)</SelectItem>
                                <SelectItem value="Consumer_Only">Consumer Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="location">Location / Building</Label>
                        <Input
                            id="location"
                            placeholder="e.g., Home Roof A"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !token}>
                            {loading ? 'Registering...' : 'Register Meter'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
