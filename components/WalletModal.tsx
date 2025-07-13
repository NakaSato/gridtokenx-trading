"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ChevronDown, ChevronUp, XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { cn } from "@/lib/utils";
import WalletButton from "./WalletButton";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast, ToastContainer } from "react-toastify";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Wallet {
  name: string;
  iconPath: string;
}

export const allWallets: Wallet[] = [
  { name: "Phantom", iconPath: "/images/phantom.png" },
  { name: "Solflare", iconPath: "/images/solflare.png" },
  { name: "Trust", iconPath: "/images/trust.png" },
];

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { select, wallets } = useWallet();
  const [isMoreWalletOpen, setIsMoreWalletOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const installedWallets = wallets.filter(
    (wallet) => wallet.readyState === "Installed"
  );
  const filterSet = new Set(
    installedWallets.map((item) => String(item.adapter.name))
  );
  const primaryWallets =
    installedWallets.length > 0
      ? allWallets.filter((item) => filterSet.has(item.name))
      : allWallets.slice(0, 1);
  const moreWallets =
    installedWallets.length > 0
      ? allWallets.filter((item) => !filterSet.has(item.name))
      : allWallets.slice(1);
  const handleWalletConnect = async (walletName: string, iconPath: string) => {
    if (isConnecting) return;

    setIsConnecting(true);
    try {
      const wallet = wallets.find((value) => value.adapter.name === walletName);

      if (!wallet) {
        toast.error(`Wallet "${walletName}" not found`, {
          position: 'bottom-right',
        });
        return;
      }

      select(wallet.adapter.name);
      await wallet.adapter.connect();

      toast.success(`${walletName} Wallet Connected`, {
        position: 'bottom-right',
      });

      onClose();
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error(`Failed to connect: ${error?.message || 'Unknown error'}`, {
        position: 'bottom-right',
      });
    } finally {
      setIsConnecting(false);
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full flex flex-col md:h-auto md:max-w-2xl md:max-h-[90%] p-10 bg-accent">
        <DialogHeader className="space-y-0 h-fit md:h-auto flex flex-row items-center justify-between md:pb-5">
          <DialogTitle className="text-2xl">Connect Wallet</DialogTitle>
          <Button 
            className="bg-secondary p-[9px] shadow-none [&_svg]:size-[18px] rounded-[12px] border md:hidden"
            onClick={() => onClose()}
          >
            <XIcon size={18} className="text-secondary-foreground"/>
          </Button>
        </DialogHeader>
        <div className="w-full flex flex-col justify-between space-y-10">
          <div className="space-y-5 flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {primaryWallets.map((wallet) => (
                <WalletButton
                  key={wallet.name}
                  {...wallet}
                  onClick={() =>
                    handleWalletConnect(wallet.name, wallet.iconPath)
                  }
                />
              ))}
            </div>
            <div
              id="more-wallets"
              className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-200 mb-4",
                isMoreWalletOpen ? "opacity-100" : "hidden opacity-0"
              )}
            >
              {moreWallets.map((wallet) => (
                <WalletButton
                  key={wallet.name}
                  {...wallet}
                  onClick={() =>
                    handleWalletConnect(wallet.name, wallet.iconPath)
                  }
                />
              ))}
            </div>
          </div>
          <Button
            variant="selected"
            className="w-full flex justify-between rounded-sm"
            onClick={() => setIsMoreWalletOpen(!isMoreWalletOpen)}
          >
            {isMoreWalletOpen ? "Less" : "More"} Wallets
            {isMoreWalletOpen ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
