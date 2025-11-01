---
title: Solana Wallet Adapter Integration in Next.js
description: "Complete guide to implementing Solana Wallet Adapter in your Next.js application"
---

# Solana Wallet Adapter for Next.js

This guide explains how to use Solana's Wallet Adapter in your Next.js application to enable users to connect their wallets and sign transactions.

## Overview

- **Wallets** store your secret key and allow users to sign transactions
- **Hardware wallets** store your secret key on a separate device
- **Software wallets** use your computer for secure storage (browser extensions or mobile apps)
- **Wallet Adapter** allows you to build websites that can request a user's wallet address and propose transactions for them to sign

## Architecture

Your application has three main layers:

1. **ConnectionProvider** - Manages RPC connection to the Solana network
2. **WalletProvider** - Manages wallet state and available wallet adapters
3. **WalletModalProvider** - Provides UI components for wallet selection and connection
4. **ContractProvider** - Your custom provider for interacting with smart contracts

## Setup

### 1. Connection Provider (Already Configured)

Your `contexts/connectionprovider.tsx` is already set up with:

```tsx
<ConnectionProvider endpoint={endpoint}>
  <WalletProvider wallets={wallets} autoConnect>
    <WalletModalProvider>
      <ContractProvider>{children}</ContractProvider>
    </WalletModalProvider>
  </WalletProvider>
</ConnectionProvider>
```

### 2. Supported Wallets

The following wallets are enabled:
- ✅ Phantom
- ✅ Solflare
- ✅ Trust Wallet
- ⏳ SafePal (commented out)
- ⏳ Torus (commented out)

All wallets supporting the [Wallet Standard](https://github.com/wallet-standard/wallet-standard) are automatically supported.

### 3. Network Support

Three networks are available:

- **Mainnet** - Production Solana network
- **Devnet** - Solana development network
- **Localhost** - Local validator at `127.0.0.1:8899`

## Using Wallet Adapter Hooks

### Access Wallet State

```tsx
import { useWallet } from "@solana/wallet-adapter-react";

export function MyComponent() {
  const { 
    publicKey,           // User's public key (null if not connected)
    wallet,              // Connected wallet info
    connected,           // Connection status boolean
    connecting,          // Connection in progress
    disconnecting,       // Disconnection in progress
    select,              // Function to select a wallet
    connect,             // Function to connect
    disconnect,          // Function to disconnect
    sendTransaction,     // Function to send transactions
  } = useWallet();

  return (
    <div>
      {connected && <p>Connected: {publicKey?.toString()}</p>}
      {!connected && <p>Not connected</p>}
    </div>
  );
}
```

### Access Connection

```tsx
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function BalanceDisplay() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const updateBalance = async () => {
      if (!connection || !publicKey) {
        console.error("Wallet not connected");
        return;
      }

      try {
        const accountInfo = await connection.getAccountInfo(publicKey);
        if (accountInfo) {
          setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
        }
      } catch (error) {
        console.error("Failed to retrieve balance:", error);
      }
    };

    updateBalance();
  }, [connection, publicKey]);

  return <div>Balance: {balance} SOL</div>;
}
```

### Send Transactions

```tsx
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { 
  Transaction, 
  SystemProgram, 
  PublicKey, 
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";

export function SendSolButton() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleSendSol = async (recipientAddress: string, amount: number) => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }

    setLoading(true);
    try {
      const recipientPubKey = new PublicKey(recipientAddress);
      const transaction = new Transaction();

      const instruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientPubKey,
        lamports: amount * LAMPORTS_PER_SOL,
      });

      transaction.add(instruction);

      const signature = await sendTransaction(transaction, connection);
      console.log("Transaction signature:", signature);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
      console.log("Transaction confirmed!");
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={() => handleSendSol("recipient_address", 0.1)}
      disabled={loading || !publicKey}
    >
      {loading ? "Sending..." : "Send 0.1 SOL"}
    </button>
  );
}
```

## Network Switching

Use the `useNetwork` hook to get and set the current network:

```tsx
import { useNetwork } from "@/contexts/connectionprovider";

export function NetworkSwitcher() {
  const { network, setNetwork, endpoint } = useNetwork();

  return (
    <div>
      <p>Current Network: {network}</p>
      <p>Endpoint: {endpoint}</p>
      <button onClick={() => setNetwork("localhost")}>Use Localhost</button>
      <button onClick={() => setNetwork("devnet")}>Use Devnet</button>
      <button onClick={() => setNetwork("mainnet")}>Use Mainnet</button>
    </div>
  );
}
```

## Common Patterns

### Connect Button

```tsx
import { useWallet } from "@solana/wallet-adapter-react";

export function ConnectButton() {
  const { connected, publicKey, connect, disconnect } = useWallet();

  if (connected && publicKey) {
    return (
      <button onClick={() => disconnect()}>
        Disconnect {publicKey.toString().slice(0, 8)}...
      </button>
    );
  }

  return <button onClick={() => connect()}>Connect Wallet</button>;
}
```

### Check Wallet Connection

```tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ReactNode } from "react";

interface ProtectedProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireWallet({ children, fallback }: ProtectedProps) {
  const { connected } = useWallet();

  if (!connected) {
    return fallback || <p>Please connect your wallet</p>;
  }

  return <>{children}</>;
}
```

### Handle Wallet Connection Errors

```tsx
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletNotReadyError } from "@solana/wallet-adapter-base";

export function SafeWalletConnect() {
  const { wallets, select, connect } = useWallet();

  const handleConnect = async (walletName: string) => {
    try {
      const wallet = wallets.find((w) => w.adapter.name === walletName);
      
      if (!wallet) {
        throw new Error(`Wallet ${walletName} not found`);
      }

      if (wallet.readyState === "NotDetected") {
        throw new Error(`${walletName} wallet not installed`);
      }

      select(wallet.adapter.name);
      await connect();
    } catch (error) {
      if (error instanceof WalletNotReadyError) {
        console.error("Wallet is not ready - extension may need to be installed");
      } else {
        console.error("Connection failed:", error);
      }
    }
  };

  return (
    <div>
      {wallets.map((wallet) => (
        <button 
          key={wallet.adapter.name}
          onClick={() => handleConnect(wallet.adapter.name)}
          disabled={wallet.readyState === "NotDetected"}
        >
          {wallet.adapter.name}
        </button>
      ))}
    </div>
  );
}
```

## Available Wallet States

- **Installed** - Wallet extension is installed and ready
- **Loadable** - Wallet can be loaded (may need user interaction)
- **NotDetected** - Wallet extension not found
- **Unsupported** - Wallet not supported in current environment

## Best Practices

1. **Always wrap components** that use Wallet Adapter hooks inside the provider
2. **Handle loading states** when connecting or sending transactions
3. **Check wallet readiness** before attempting to connect
4. **Use localStorage** for network persistence (already implemented)
5. **Provide fallbacks** when wallet is not connected
6. **Show clear error messages** to users
7. **Test with multiple wallets** before deploying

## Localhost Development

To use localhost for development:

1. Start your local Solana validator:
   ```bash
   solana-test-validator
   ```

2. Fund your wallet:
   ```bash
   solana airdrop 10 -u http://127.0.0.1:8899 --keypair /path/to/wallet.json
   ```

3. Switch to localhost in the app using the network selector
4. Connect your wallet
5. Deploy and test your programs locally

## Troubleshooting

### Wallet Not Connecting
- Ensure the wallet extension is installed in your browser
- Check that you're on the correct network (localhost, devnet, or mainnet)
- Try refreshing the page

### Transaction Failing
- Verify your wallet has sufficient SOL
- Check that the account has enough lamports for fees
- Ensure the transaction instructions are valid

### Hydration Errors in Next.js
- Make sure to use `useEffect` with proper mounting checks
- Don't access localStorage directly in component body
- Use the `isMounted` check in the provider

## Resources

- [Solana Wallet Adapter GitHub](https://github.com/solana-labs/wallet-adapter)
- [Wallet Standard](https://github.com/wallet-standard/wallet-standard)
- [Solana Documentation](https://docs.solana.com)
- [Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
