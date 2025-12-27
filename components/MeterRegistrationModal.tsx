'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, X, Sun, Wind, Zap } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
    const [gettingLocation, setGettingLocation] = useState(false);
    const [formData, setFormData] = useState({
        meterSerial: '',
        location: '',
        meterType: 'Solar_Prosumer',
        latitude: '',
        longitude: '',
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
                location: formData.location,
                latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
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
                meterType: 'Solar_Prosumer',
                latitude: '',
                longitude: '',
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
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <DialogTitle>Register Smart Meter</DialogTitle>
                        <DialogDescription className='text-xs font-light'>
                            Link your physical smart meter ID to the GridTokenX network.
                        </DialogDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2 h-8 w-8 rounded-sm opacity-70 hover:opacity-100">
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="meterSerial">
                            Meter Serial Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="meterSerial"
                            placeholder="e.g., bb6052e6-..."
                            className='text-xs font-light p-2'
                            value={formData.meterSerial}
                            onChange={(e) => setFormData({ ...formData, meterSerial: e.target.value })}
                            required
                        />
                        <p className="text-xs text-muted-foreground">Found on your Smart Meter device dashboard.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="meterType">
                            Meter Type <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.meterType}
                            onValueChange={(value) => setFormData({ ...formData, meterType: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select meter type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Solar_Prosumer">
                                    <div className="flex items-center gap-2">
                                        <Sun className="h-4 w-4" />
                                        <span>Solar Prosumer (Generate & Consume)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="Wind_Prosumer">
                                    <div className="flex items-center gap-2">
                                        <Wind className="h-4 w-4" />
                                        <span>Wind Prosumer (Generate & Consume)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="Consumer_Only">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4" />
                                        <span>Consumer Only</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="location">
                            Location / Building <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="location"
                            placeholder="e.g., Home Roof A"
                            className='text-xs font-light p-2'
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            required
                        />
                    </div>

                    {/* Map Coordinates (Optional) */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                Map Coordinates
                                <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                            </Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={gettingLocation}
                                onClick={() => {
                                    if (!navigator.geolocation) {
                                        toast.error('Geolocation not supported by browser');
                                        return;
                                    }
                                    setGettingLocation(true);
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                latitude: pos.coords.latitude.toFixed(6),
                                                longitude: pos.coords.longitude.toFixed(6),
                                            }));
                                            setGettingLocation(false);
                                            toast.success('Location detected!');
                                        },
                                        (err) => {
                                            setGettingLocation(false);
                                            toast.error('Could not get location: ' + err.message);
                                        },
                                        { enableHighAccuracy: true }
                                    );
                                }}
                                className="h-7 text-xs gap-1"
                            >
                                {gettingLocation ? (
                                    <><Loader2 className="h-3 w-3 animate-spin" /> Getting...</>
                                ) : (
                                    <><MapPin className="h-3 w-3" /> Use My Location</>
                                )}
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                id="latitude"
                                placeholder="Latitude (e.g., 13.780)"
                                className='text-xs font-light p-2'
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                type="number"
                                step="any"
                            />
                            <Input
                                id="longitude"
                                placeholder="Longitude (e.g., 100.56)"
                                className='text-xs font-light p-2'
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                type="number"
                                step="any"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Enable map display for your meter.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 sm:hidden">
                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !token}>
                            {loading ? 'Registering...' : 'Register Meter'}
                        </Button>
                    </div>
                </form>

                <div className="hidden sm:block">
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" onClick={handleSubmit} disabled={loading || !token}>
                            {loading ? 'Registering...' : 'Register Meter'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
