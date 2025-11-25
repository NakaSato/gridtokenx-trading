"use client";

import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import { useEffect, useState } from "react";
import Image from "next/image";
import { CopyIcon, LogOutIcon, SendIcon } from "@/public/svgs/icons";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import WalletPortfolio from "./WalletPortfolio";
import WalletActivity from "./WalletActivity";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/contexts/AuthProvider";
import { useUserBalance } from "@/hooks/useApi";
import { allWallets } from "./WalletModal";
import { XIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function WalletSideBar() {
  const { wallet, publicKey, disconnect, connected } = useWallet();
  const { user, isAuthenticated, logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("portfolio");
  const [isOpen, setIsOpen] = useState(false);
  const [iconPath, setIconPath] = useState<string>("");

  // Get balance data using the enhanced hook
  const walletAddress = publicKey?.toBase58();
  const { balance, loading: balanceLoading } = useUserBalance(
    token || undefined,
    walletAddress || undefined
  );
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
    }
    toast.success("Address Copied");
  };
  const handleClickTab = (state: string) => {
    if (activeTab !== state) {
      setActiveTab(state);
    }
  };
  const handleDisconnect = async () => {
    if (isAuthenticated) {
      // If user is authenticated via email/password, logout from auth system
      await logout();
      toast.success("Logged Out Successfully");
    } else if (connected) {
      // If only wallet is connected, disconnect wallet
      disconnect();
      toast.success("Wallet Disconnected");
    }
  };
  useEffect(() => {
    if (wallet) {
      setIconPath(
        allWallets.filter((value) => value.name === wallet.adapter.name)[0]
          .iconPath
      );
    }
  }, [publicKey, connected, wallet]);
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="w-full py-[5px] px-[15px] h-9 rounded-sm gap-2 text-foreground text-sm border bg-inherit hover:bg-primary-foreground hover:border-primary flex justify-center items-center">
          {iconPath && (
            <Image
              src={iconPath}
              alt="Wallet Icon"
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          {isAuthenticated && user
            ? user.username || user.email
            : publicKey?.toBase58()
            ? truncateAddress(publicKey?.toBase58())
            : "Connected"}
        </button>
      </SheetTrigger>
      <SheetContent className="bg-accent rounded-none md:rounded-l-sm p-6 space-y-4 w-full md:w-[550px]">
        <SheetTitle className="flex justify-between">
          <div className="flex space-x-2 items-center">
            {iconPath && (
              <Image src={iconPath} alt="Wallet Icon" width={20} height={20} />
            )}
            <span className="text-base text-foreground font-medium items-center pt-1">
              {isAuthenticated && user
                ? user.username || user.email
                : publicKey?.toBase58()
                ? truncateAddress(publicKey?.toBase58())
                : "Connected"}
            </span>
            <SendIcon />
          </div>
          <div className="flex space-x-3">
            <Button
              className="bg-secondary p-2 h-fit shadow-none rounded-sm"
              onClick={copyAddress}
            >
              <CopyIcon />
            </Button>
            <Button
              className="bg-secondary p-2 h-fit shadow-none rounded-sm"
              onClick={() => handleDisconnect()}
            >
              <LogOutIcon />
            </Button>
            <Button
              className="bg-secondary p-2 h-fit shadow-none rounded-sm md:hidden"
              onClick={() => setIsOpen(false)}
            >
              <XIcon className="text-foreground" />
            </Button>
          </div>
        </SheetTitle>
        <div className="w-full flex space-x-4 justify-between">
          <div className="w-full flex flex-col p-4 bg-background rounded-sm space-y-2">
            <span className="text-sm text-secondary-foreground font-medium">
              Tokens
            </span>
            {balanceLoading ? (
              <span className="text-[28px] text-foreground font-medium animate-pulse">
                Loading...
              </span>
            ) : balance ? (
              <span className="text-[28px] text-foreground font-medium">
                {parseFloat(balance.token_balance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}
              </span>
            ) : (
              <span className="text-[28px] text-foreground font-medium">
                0.00
              </span>
            )}
          </div>
          <div className="w-full flex flex-col p-4 bg-background rounded-sm space-y-2">
            <span className="text-sm text-secondary-foreground font-medium">
              Points
            </span>
            {balanceLoading ? (
              <span className="text-[28px] text-foreground font-medium animate-pulse">
                Loading...
              </span>
            ) : (
              <span className="text-[28px] text-foreground font-medium">
                {balance?.balance_sol
                  ? parseFloat(balance.balance_sol).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })
                  : "10 900"}
              </span>
            )}
          </div>
        </div>
        <div className="w-full flex flex-col space-y-4">
          <Tabs defaultValue={activeTab}>
            <TabsList className="w-full grid grid-cols-2 h-fit bg-accent-foreground rounded-sm p-2">
              <TabsTrigger
                value="portfolio"
                className="border border-transparent rounded-sm px-5 py-[6px] text-sm data-[state=active]:border-primary"
                onClick={() => handleClickTab("portfolio")}
              >
                Portfolio
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="border border-transparent rounded-sm px-5 py-[6px] text-sm data-[state=active]:border-primary"
                onClick={() => handleClickTab("activity")}
              >
                Activity
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === "portfolio" ? <WalletPortfolio /> : <WalletActivity />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
