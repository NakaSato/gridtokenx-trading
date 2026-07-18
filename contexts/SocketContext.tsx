'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { isJwtExpired } from '@/lib/jwt';

interface SocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
    sendMessage: (data: any) => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    sendMessage: () => { },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { token } = useAuth();
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    // Latest connect() for the reconnect timer — a useCallback can't reference
    // itself before its own declaration (react-hooks lint).
    const connectRef = useRef<() => void>(() => { });

    const connect = useCallback(() => {
        // Basic JWT validation: must be a string, at least 20 chars, and have 3 parts
        const isValidToken = token &&
            typeof token === 'string' &&
            token.length > 20 &&
            token.split('.').length === 3;

        if (!isValidToken) return;

        // Don't open a socket with an expired token — the gateway 401s the upgrade
        // and we'd reconnect-loop forever. Wait for useAuth() to supply a fresh
        // token; the `token` dependency re-runs connect() when it does.
        if (isJwtExpired(token)) {
            console.warn('🔒 WS connect skipped: JWT expired — awaiting token refresh');
            return;
        }

        const wsBaseUrl = process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://apisix.gridtokenx-coresystem.orb.local';
        const wsUrl = `${wsBaseUrl}/ws`;
        // /ws is its own APISIX route (apisix.yaml id 33) with no gateway-level
        // jwt-auth — noti-service's own ws_handler (websocket.rs WsQuery) validates
        // this token itself via the `token` query param.
        const urlWithToken = `${wsUrl}?token=${encodeURIComponent(token)}`;

        const ws = new WebSocket(urlWithToken);
        socketRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            setSocket(ws);
            reconnectAttemptsRef.current = 0;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };

        ws.onclose = (event) => {
            setIsConnected(false);
            setSocket(null);
            socketRef.current = null;

            // 1000 = clean close (e.g. our own unmount cleanup) — nothing to report.
            if (event.code !== 1000) {
                console.warn(
                    `⚠️ WebSocket closed (code ${event.code}${event.reason ? `, reason: ${event.reason}` : ''}) — ${wsUrl}`
                );
            }

            // Reconnect only with a still-valid token. Retrying an expired token
            // just reproduces the 401 that closed us — let the auth layer refresh
            // first (a new `token` re-runs connect() via the effect dependency).
            // Exponential backoff (3s → 6s → 12s → … capped at 60s) so an
            // unreachable gateway doesn't get hammered every 3s forever.
            if (token && !isJwtExpired(token)) {
                const delay = Math.min(3000 * 2 ** reconnectAttemptsRef.current, 60000);
                reconnectAttemptsRef.current += 1;
                reconnectTimeoutRef.current = setTimeout(() => connectRef.current(), delay);
            }
        };

        ws.onerror = () => {
            // The browser's WS `error` event is intentionally opaque (no code,
            // no message — logs as `{}`). The paired `close` event carries the
            // diagnostic (code/reason), so just warn and let onclose report.
            console.warn(`⚠️ WebSocket error — ${wsUrl} unreachable or rejected the upgrade`);
            ws.close();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Standard approach: Dispatch a CustomEvent for hooks to listen to
                const customEvent = new CustomEvent('ws-message', { detail: data });
                window.dispatchEvent(customEvent);
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };
    }, [token]);

    const sendMessage = useCallback((data: any) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        } else {
            console.warn('Cannot send message: WebSocket is not open');
        }
    }, []);

    useEffect(() => {
        connectRef.current = connect;
        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, sendMessage }}>
            {children}
        </SocketContext.Provider>
    );
};
