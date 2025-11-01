# Real-World Integration Examples for GridTokenX

This document shows how to integrate Wallet Adapter features into your existing GridTokenX trading components.

## Example 1: Enhance Your Trade Card with Wallet Integration

```tsx
// components/OptionCard.tsx (Updated)
"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useState } from "react";
import { toast } from "react-toastify";

export function OptionCard() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);

  const handleBuyOption = async (optionData: any) => {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // 1. Create transaction with your program instructions
      const transaction = new Transaction();

      // Add your program instructions
      const instruction = /* create instruction */;
      transaction.add(instruction);

      // 2. Sign and send
      const signature = await sendTransaction(transaction, connection);

      // 3. Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      toast.success("Option purchased!");
      // Refresh your UI data
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Your existing UI */}
      <button 
        onClick={() => handleBuyOption({})}
        disabled={!publicKey || loading}
      >
        {loading ? "Processing..." : "Buy Option"}
      </button>
    </div>
  );
}
```

## Example 2: Add Balance Display to Portfolio

```tsx
// components/Portfolio/BalanceWidget.tsx
"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

export function BalanceWidget() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [solBalance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connection || !publicKey) {
      setBalance(0);
      return;
    }

    setLoading(true);
    connection.getAccountInfo(publicKey)
      .then(info => {
        if (info) {
          setBalance(info.lamports / LAMPORTS_PER_SOL);
        }
      })
      .finally(() => setLoading(false));
  }, [connection, publicKey]);

  if (!publicKey) {
    return <div className="p-4 text-muted-foreground">Connect wallet to see balance</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Wallet Balance</h3>
      <div className="text-2xl font-bold">
        {loading ? "..." : `${solBalance.toFixed(4)} SOL`}
      </div>
      <p className="text-xs text-muted-foreground mt-2 break-all">
        {publicKey.toString()}
      </p>
    </div>
  );
}
```

## Example 3: Protected Trading Interface

```tsx
// app/trading/page.tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { TradingInterface } from "@/components/TradingInterface";

export default function TradingPage() {
  const { connected, publicKey } = useWallet();

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Trading Not Available</h1>
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to start trading
          </p>
          {/* Your connect wallet button */}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-accent p-4 rounded-lg">
        <p className="text-sm">
          Trading as: <code className="bg-background p-1 rounded">{publicKey?.toString().slice(0, 12)}...</code>
        </p>
      </div>
      <TradingInterface />
    </div>
  );
}
```

## Example 4: Execute Complex Transactions

```tsx
// components/CreateOptionsPool.tsx (Updated)
"use client";

import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useState } from "react";
import { toast } from "react-toastify";

export function CreateOptionsPool() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);

  const handleCreatePool = async (poolConfig: any) => {
    if (!wallet) {
      toast.error("Please connect your wallet");
      return;
    }

    setLoading(true);
    try {
      // Create provider for Anchor
      const provider = new AnchorProvider(connection, wallet, {});
      
      // Get your program
      const programId = new PublicKey("YOUR_PROGRAM_ID");
      // const program = new Program(IDL, programId, provider);

      // Create transaction
      const transaction = new Transaction();

      // Add your instructions
      // const instruction = await program.methods
      //   .createPool(poolConfig)
      //   .instructions();

      // transaction.add(...instruction);

      // Sign and send
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      toast.success("Pool created successfully!");
    } catch (error: any) {
      toast.error(`Failed to create pool: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={() => handleCreatePool({})}
      disabled={!wallet || loading}
    >
      {loading ? "Creating..." : "Create Pool"}
    </button>
  );
}
```

## Example 5: Trade Details with Account Data

```tsx
// components/TradeDetails.tsx (Updated)
"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Account } from "@solana/web3.js";
import { useEffect, useState } from "react";

export function TradeDetails({ tradeId }: { tradeId: string }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tradeInfo, setTradeInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connection || !publicKey) return;

    setLoading(true);
    (async () => {
      try {
        const tradeAccount = new PublicKey(tradeId);
        const accountInfo = await connection.getAccountInfo(tradeAccount);

        if (accountInfo) {
          // Decode account data based on your program's data structure
          // const tradeData = decodeTradeAccount(accountInfo.data);
          // setTradeInfo(tradeData);
        }
      } catch (error) {
        console.error("Failed to fetch trade details:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [connection, publicKey, tradeId]);

  if (loading) return <div>Loading trade details...</div>;
  if (!tradeInfo) return <div>No trade information found</div>;

  return (
    <div className="space-y-4">
      {/* Display trade info */}
    </div>
  );
}
```

## Example 6: Network-Aware Component

```tsx
// components/NetworkWarning.tsx
"use client";

import { useNetwork } from "@/contexts/connectionprovider";
import { AlertCircle } from "lucide-react";

export function NetworkWarning() {
  const { network } = useNetwork();

  if (network === "localhost") {
    return (
      <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500 rounded-lg text-orange-600">
        <AlertCircle size={18} />
        <span className="text-sm">
          You're on Localhost. Make sure your local validator is running.
        </span>
      </div>
    );
  }

  if (network === "devnet") {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500 rounded-lg text-blue-600">
        <AlertCircle size={18} />
        <span className="text-sm">
          You're testing on Devnet. Use testnet faucet for SOL.
        </span>
      </div>
    );
  }

  return null;
}
```

## Example 7: Complete Trading Form with Wallet Integration

```tsx
// components/BuyOptionForm.tsx
"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, PublicKey } from "@solana/web3.js";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BuyOptionFormProps {
  optionId: string;
  price: number;
}

export function BuyOptionForm({ optionId, price }: BuyOptionFormProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalCost = quantity * price;

  const handleBuy = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    setLoading(true);
    try {
      // Validate input
      if (quantity <= 0) {
        toast.error("Invalid quantity");
        return;
      }

      // Create transaction
      const transaction = new Transaction();

      // Add your program instruction
      const instruction = /* create instruction with optionId, quantity */;
      transaction.add(instruction);

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      // Success
      toast.success(`Purchased ${quantity} option(s)`);
      setQuantity(1);

      // Refresh data or update UI
      // onSuccess?.();
    } catch (error: any) {
      console.error("Transaction error:", error);
      toast.error(error.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Connect your wallet to trade
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label>Quantity:</label>
        <Input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          disabled={loading}
          className="w-24"
        />
      </div>

      <div className="p-3 bg-accent rounded-lg">
        <p className="text-sm text-muted-foreground">Total Cost</p>
        <p className="text-2xl font-bold">{totalCost.toFixed(4)} SOL</p>
      </div>

      <Button 
        onClick={handleBuy}
        disabled={loading || !publicKey}
        className="w-full"
      >
        {loading ? "Processing..." : `Buy ${quantity} Option(s)`}
      </Button>

      {loading && (
        <p className="text-sm text-muted-foreground text-center">
          Confirm transaction in your wallet...
        </p>
      )}
    </div>
  );
}
```

## Integration Checklist

- [ ] Replace wallet connection logic with new hooks
- [ ] Add balance display to dashboard
- [ ] Update trade forms to use sendTransaction
- [ ] Add network warnings to sensitive operations
- [ ] Add wallet connection checks before operations
- [ ] Test with Phantom, Solflare, and Trust wallets
- [ ] Test with localhost, devnet, and mainnet
- [ ] Add error handling and user feedback
- [ ] Test transaction signing and confirmation
- [ ] Deploy to devnet for testing

## Common Integration Patterns

### Check Before Operation
```tsx
if (!publicKey) {
  toast.error("Please connect wallet");
  return;
}
```

### Create and Send Transaction
```tsx
const tx = new Transaction().add(instruction);
const sig = await sendTransaction(tx, connection);
await connection.confirmTransaction(sig, "confirmed");
```

### Listen for Balance Changes
```tsx
const unsub = connection.onAccountChange(publicKey, (info) => {
  setBalance(info.lamports / LAMPORTS_PER_SOL);
});
```

### Use Anchor with Connected Wallet
```tsx
const provider = new AnchorProvider(connection, wallet, {});
const program = new Program(IDL, programId, provider);
```

---

Now you have all the tools needed to fully integrate wallet functionality into your GridTokenX trading platform! 🚀
