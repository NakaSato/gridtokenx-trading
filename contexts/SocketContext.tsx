'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthProvider';

interface SocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { token } = useAuth(); // Assuming useAuth provides the JWT token

    useEffect(() => {
        // Only connect if we have a token (authenticated WS)
        // or if we decide to allow public WS (market feed) without token.
        // For now, let's try connecting to the market feed which seems public in Gateway code,
        // OR the authenticated one if we have a token.

        // Gateway has:
        // /ws?token=... (Authenticated)
        // /api/market/ws (Public Market Feed)

        // For meter readings (personal), we likely need the Authenticated one.

        if (!token) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
        const urlWithToken = `${wsUrl}?token=${token}`;

        console.log('Connecting to WebSocket:', urlWithToken);

        const ws = new WebSocket(urlWithToken);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            setSocket(null);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Dispatch a custom event so hooks can listen
                // or just rely on the hook adding listeners to the socket object itself if we expose it

                // However, native WebSocket only has one onmessage handler.
                // We need a way to multiplex.

                // Simple Multiplexer: dispatch window event or use an EventEmitter pattern.
                // Let's use a simple CustomEvent on the socket object for now if possible,
                // OR better: use an Emitter in this context.
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };

        // To allow multiple listeners, we will overwrite onmessage to dispatch to a set of listeners.
        // Actually, simpler: let's expose a subscribe method?
        // Or just let hooks attach 'message' event listeners to the socket object? 
        // WebSocket DOES supports addEventListener('message', ...) standard DOM event.
        // So we don't need to overwrite onmessage. Hooks can just do socket.addEventListener('message').

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
