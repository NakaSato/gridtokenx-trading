"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC, useEffect, useState } from "react";

/**
 * Example component showing how to display wallet balance
 */
export const BalanceDisplay: FC = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  useEffect(() => {
    const updateBalance = async () => {
      if (!connection || !publicKey) {
        setBalance(0);
        return;
      }

      setLoading(true);
      try {
        // Set up real-time updates
        const unsubscribe = connection.onAccountChange(
          publicKey,
          (updatedAccountInfo) => {
            setBalance(updatedAccountInfo.lamports / LAMPORTS_PER_SOL);
          },
          "confirmed"
        );

        // Get initial balance
        const accountInfo = await connection.getAccountInfo(publicKey);
        if (accountInfo) {
          setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
        }

        return unsubscribe;
      } catch (error) {
        console.error("Failed to retrieve account info:", error);
      } finally {
        setLoading(false);
      }
    };

    const cleanup = updateBalance();
    return () => {
      cleanup?.then((unsub) => unsub?.());
    };
  }, [connection, publicKey]);

  if (!publicKey) {
    return <div className="text-sm text-muted-foreground">Wallet not connected</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        Balance: {loading ? "Loading..." : `${balance.toFixed(4)} SOL`}
      </p>
      <p className="text-xs text-muted-foreground break-all">
        {publicKey.toString()}
      </p>
    </div>
  );
};
