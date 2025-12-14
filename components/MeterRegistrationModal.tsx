'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
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
import toast from 'react-hot-toast';

interface MeterRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function MeterRegistrationModal({ isOpen, onClose, onSuccess }: MeterRegistrationModalProps) {
    const { publicKey } = useWallet();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        meterSerial: '',
        location: '',
        capacity: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!publicKey) {
            toast.error('Please connect your wallet first');
            return;
        }

        setLoading(true);
        try {
            // Simulate API call or local storage logic
            // In a real app, this would be an API call
            // For now, we use local storage as previously established for the wallet-only flow or user-auth flow

            // Checking for user auth if enabled, but falling back to wallet-based for simplified flow
            // Since we are currently in simplified wallet-only flow (based on previous turns), 
            // we'll associate with wallet address.

            const meter = {
                serial: formData.meterSerial,
                location: formData.location,
                capacity: parseFloat(formData.capacity),
                walletAddress: publicKey.toString(),
                createdAt: new Date().toISOString()
            };

            // Store in local storage to simulate backend persistence
            const storageKey = `meters_${publicKey.toString()}`;
            const existingMeters = localStorage.getItem(storageKey);
            const meters = existingMeters ? JSON.parse(existingMeters) : [];
            meters.push(meter);

            localStorage.setItem(storageKey, JSON.stringify(meters));

            toast.success('Smart meter registered successfully!');
            onSuccess();
            onClose();

            // Reset form
            setFormData({
                meterSerial: '',
                location: '',
                capacity: ''
            });

        } catch (error) {
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
                        Add your smart meter to start earning energy tokens
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="meterSerial">Meter Serial Number</Label>
                        <Input
                            id="meterSerial"
                            placeholder="e.g., METER-001-2024"
                            value={formData.meterSerial}
                            onChange={(e) => setFormData({ ...formData, meterSerial: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            placeholder="e.g., Home Solar Panel"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="capacity">Capacity (kW)</Label>
                        <Input
                            id="capacity"
                            type="number"
                            step="0.1"
                            placeholder="e.g., 5.0"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !publicKey}>
                            {loading ? 'Registering...' : 'Register Meter'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
