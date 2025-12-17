"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";

export default function DevFaucet() {
    const { user } = useAuth();
    const { publicKey, connected } = useWallet();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);

    // Use connected wallet's publicKey first, fallback to user's stored wallet_address
    const walletAddress = connected && publicKey ? publicKey.toBase58() : user?.wallet_address;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const requestFunds = useCallback(async (amountSol: number, amountTokens: number) => {
        if (!walletAddress) {
            setMessage("Log in to use faucet");
            setError(true);
            return;
        }

        setLoading(true);
        setMessage("");
        setError(false);

        try {
            const response = await fetch(`${apiUrl}/api/v1/dev/faucet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet_address: walletAddress,
                    amount_sol: amountSol,
                    mint_tokens_kwh: amountTokens,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Faucet request failed");
            }

            setMessage(data.message || "Funds received!");
        } catch (err: any) {
            setError(true);
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, walletAddress]);

    if (!process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS || process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === "false") {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-w-sm">
            <h3 className="text-sm font-bold text-gray-200 mb-2">Developer Faucet</h3>

            {walletAddress ? (
                <div className="space-y-2">
                    <p className="text-xs text-gray-400 truncate mb-2">
                        Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={() => requestFunds(100, 0)}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition disabled:opacity-50"
                        >
                            Get 100 SOL
                        </button>
                        <button
                            onClick={() => requestFunds(0, 1000)}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition disabled:opacity-50"
                        >
                            Get 1k kWh
                        </button>
                    </div>

                    {message && (
                        <p className={`text-xs mt-2 ${error ? "text-red-400" : "text-green-400"}`}>
                            {message}
                        </p>
                    )}
                </div>
            ) : (
                <p className="text-xs text-yellow-400">Please log in to use faucet</p>
            )}
        </div>
    );
}
