"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { memo } from "react";
import type { Wallet } from "../types/wallet";

interface WalletButtonProps {
  name: string;
  iconPath: string;
  id: string;
  onClick: () => void;
}

// Memoized component to prevent unnecessary re-renders
const WalletButton = memo(function WalletButton({
  name,
  iconPath,
  onClick,
}: WalletButtonProps) {
  return (
    <Button
      variant="outline"
      className="flex items-center justify-start w-full h-[40px] px-[16px] py-[8px] bg-inherit border-border hover:bg-secondary"
      onClick={onClick}
      type="button"
    >
      <Image
        src={iconPath}
        alt={name}
        width={24}
        height={24}
        className="rounded-full"
        loading="lazy"
        sizes="24px"
        priority={false}
      />
      <span className="text-sm font-normal text-center">{name}</span>
    </Button>
  );
});

export default WalletButton;
