"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { WalletIcon } from "@/public/svgs/icons";
import WalletModal from "../WalletModal";
import { useWallet } from "@solana/wallet-adapter-react";

interface SignInProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  text?: string;
}

export default function SignIn({
  variant = "default",
  size = "default",
  className = "",
  showIcon = true,
  text = "Connect Wallet",
}: SignInProps) {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { connected } = useWallet();

  // If already connected, don't show the sign-in button
  if (connected) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsWalletModalOpen(true)}
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
      >
        {showIcon && <WalletIcon />}
        <span className="text-sm font-semibold">{text}</span>
      </Button>
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}
