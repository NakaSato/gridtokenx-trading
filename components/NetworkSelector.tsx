"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useNetwork, NetworkType } from "@/contexts/connectionprovider";
import { cn } from "@/lib/utils";

const networks: { value: NetworkType; label: string; color: string }[] = [
  { value: "mainnet", label: "Mainnet", color: "text-green-400" },
  { value: "devnet", label: "Devnet", color: "text-blue-400" },
  { value: "localhost", label: "Localhost", color: "text-orange-400" },
];

export default function NetworkSelector() {
  const { network, setNetwork } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);

  const currentNetwork = networks.find((n) => n.value === network);

  const handleNetworkChange = (newNetwork: NetworkType) => {
    setNetwork(newNetwork);
    setIsOpen(false);
    // Optionally reload the page to ensure clean state
    window.location.reload();
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="flex items-center gap-2 bg-secondary border-border hover:bg-accent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-2 h-2 rounded-full bg-current"></div>
        <span className={cn("text-sm font-medium", currentNetwork?.color)}>
          {currentNetwork?.label}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 z-50 w-40 bg-popover border border-border rounded-md shadow-lg">
          {networks.map((networkOption) => (
            <button
              key={networkOption.value}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2",
                network === networkOption.value && "bg-accent"
              )}
              onClick={() => handleNetworkChange(networkOption.value)}
            >
              <div className={cn("w-2 h-2 rounded-full bg-current", networkOption.color)}></div>
              {networkOption.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}