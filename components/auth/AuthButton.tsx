"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import SignIn from "./SignIn";
import SignOut from "./SignOut";

interface AuthButtonProps {
  signInVariant?: "default" | "outline" | "ghost";
  signOutVariant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  signInText?: string;
  signOutText?: string;
  onSignOut?: () => void;
}

/**
 * AuthButton - A smart button that automatically switches between SignIn and SignOut
 * based on wallet connection status
 */
export default function AuthButton({
  signInVariant = "default",
  signOutVariant = "outline",
  size = "default",
  className = "",
  showIcon = true,
  signInText = "Connect Wallet",
  signOutText = "Disconnect",
  onSignOut,
}: AuthButtonProps) {
  const { connected } = useWallet();

  return connected ? (
    <SignOut
      variant={signOutVariant}
      size={size}
      className={className}
      showIcon={showIcon}
      text={signOutText}
      onSignOut={onSignOut}
    />
  ) : (
    <SignIn
      variant={signInVariant}
      size={size}
      className={className}
      showIcon={showIcon}
      text={signInText}
    />
  );
}
