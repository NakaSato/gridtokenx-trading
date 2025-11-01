"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletNotReadyError } from "@solana/wallet-adapter-base";
import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

/**
 * Example component showing how to safely handle wallet connections
 */
export const SafeWalletConnect: FC = () => {
  const { wallets, select, connect, connected, publicKey, disconnect } = useWallet();
  const [connecting, setConnecting] = useState(false);

  const handleWalletSelect = async (walletName: string) => {
    try {
      setConnecting(true);
      const wallet = wallets.find((w) => w.adapter.name === walletName);

      if (!wallet) {
        toast.error(`Wallet "${walletName}" not found`);
        return;
      }

      // Check wallet readiness
      if (wallet.readyState === "NotDetected") {
        toast.error(`${walletName} wallet extension not installed. Please install it first.`);
        return;
      }

      if (wallet.readyState === "Unsupported") {
        toast.error(`${walletName} is not supported in this browser.`);
        return;
      }

      select(wallet.adapter.name);
      await connect();

      toast.success(`${walletName} connected successfully!`);
    } catch (error: any) {
      console.error("Wallet connection error:", error);

      if (error instanceof WalletNotReadyError) {
        toast.error("Wallet is not ready. Please ensure the extension is enabled.");
      } else {
        toast.error(`Connection failed: ${error?.message || "Unknown error"}`);
      }
    } finally {
      setConnecting(false);
    }
  };

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => disconnect()}
          disabled={connecting}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {wallets.map((wallet) => (
        <Button
          key={wallet.adapter.name}
          size="sm"
          onClick={() => handleWalletSelect(wallet.adapter.name)}
          disabled={connecting || wallet.readyState === "NotDetected"}
          variant={wallet.readyState === "NotDetected" ? "outline" : "default"}
        >
          {wallet.adapter.name}
          {wallet.readyState === "NotDetected" && " (Not Installed)"}
        </Button>
      ))}
    </div>
  );
};
