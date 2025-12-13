import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import toast from 'react-hot-toast';

interface MeterHandler {
    onReadingReceived?: (data: any) => void;
}

export function useMeterSocket({ onReadingReceived }: MeterHandler = {}) {
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const payload = JSON.parse(event.data);
                // Gateway sends: { type: "meter_reading_received", ... }
                if (payload.type === 'meter_reading_received') {
                    console.log('Meter reading received via WS:', payload);

                    if (onReadingReceived) {
                        onReadingReceived(payload);
                    }

                    toast.success(`Received ${payload.kwh_amount} kWh from ${payload.meter_serial || 'Unknown Meter'}`);
                }
            } catch (e) {
                console.error('Error parsing WS message in hook', e);
            }
        };

        socket.addEventListener('message', handleMessage);

        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket, isConnected, onReadingReceived]);

    return { isConnected };
}
