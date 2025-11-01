"use client";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";

import { TrustWalletAdapter } from "@solana/wallet-adapter-trust";
import { SafePalWalletAdapter } from "@solana/wallet-adapter-safepal";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { TorusWalletAdapter } from "@solana/wallet-adapter-torus";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo, createContext, useContext, useState, useEffect } from "react";
import { ContractProvider } from "./contractProvider";

export type NetworkType = "mainnet" | "devnet" | "localhost";

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  endpoint: string;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

export default ({ children }: { children: React.ReactNode }) => {
  const [network, setNetwork] = useState<NetworkType>("devnet");

  // Load network from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem("solana-network") as NetworkType;
    if (savedNetwork && ["mainnet", "devnet", "localhost"].includes(savedNetwork)) {
      setNetwork(savedNetwork);
    }
  }, []);

  // Save network to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("solana-network", network);
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TrustWalletAdapter(),
      // new SafePalWalletAdapter(),
      // new TorusWalletAdapter(),
    ],
    []
  );

  const endpoint = useMemo(() => {
    switch (network) {
      case "mainnet":
        return clusterApiUrl(WalletAdapterNetwork.Mainnet);
      case "devnet":
        return clusterApiUrl(WalletAdapterNetwork.Devnet);
      case "localhost":
        return "http://127.0.0.1:8899";
      default:
        return clusterApiUrl(WalletAdapterNetwork.Devnet);
    }
  }, [network]);

  const networkContextValue = useMemo(() => ({
    network,
    setNetwork,
    endpoint,
  }), [network, endpoint]);

  return (
    <NetworkContext.Provider value={networkContextValue}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <ContractProvider>{children}</ContractProvider>
        </WalletProvider>
      </ConnectionProvider>
    </NetworkContext.Provider>
  );
};
