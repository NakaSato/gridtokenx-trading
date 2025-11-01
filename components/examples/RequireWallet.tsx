"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface RequireWalletProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that protects routes/sections and only shows content when wallet is connected
 */
export const RequireWallet: React.FC<RequireWalletProps> = ({
  children,
  fallback,
}) => {
  const { connected, publicKey } = useWallet();

  if (!connected || !publicKey) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center gap-4 p-8 border rounded-lg text-center">
          <p className="text-muted-foreground">Please connect your wallet to continue</p>
          <Button variant="default">Connect Wallet</Button>
        </div>
      )
    );
  }

  return <>{children}</>;
};
