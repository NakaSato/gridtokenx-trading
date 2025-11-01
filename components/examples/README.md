# Wallet Adapter Example Components

This directory contains example components showing how to use the Solana Wallet Adapter in your Next.js application.

## Components

### `BalanceDisplay.tsx`
Displays the connected wallet's SOL balance with real-time updates.

**Features:**
- Real-time balance updates using `onAccountChange`
- Error handling
- Loading states
- Displays wallet address

**Usage:**
```tsx
import { BalanceDisplay } from "@/components/examples/BalanceDisplay";

export default function MyComponent() {
  return <BalanceDisplay />;
}
```

---

### `SendSolExample.tsx`
Component for sending SOL from one wallet to another.

**Features:**
- Input fields for recipient address and amount
- Transaction signing through wallet
- Confirmation waiting
- Success/error feedback
- Form validation

**Usage:**
```tsx
import { SendSolExample } from "@/components/examples/SendSolExample";

export default function MyComponent() {
  return (
    <SendSolExample 
      onSuccess={(signature) => console.log("Sent:", signature)}
    />
  );
}
```

---

### `SafeWalletConnect.tsx`
Safe wallet connection handler with proper error handling.

**Features:**
- Wallet readiness checking
- Graceful error handling for not-installed wallets
- Visual feedback for unavailable wallets
- Support for multiple wallet adapters
- Disconnect functionality

**Usage:**
```tsx
import { SafeWalletConnect } from "@/components/examples/SafeWalletConnect";

export default function MyComponent() {
  return <SafeWalletConnect />;
}
```

---

### `RequireWallet.tsx`
Wrapper component that requires wallet connection to display content.

**Features:**
- Guards content behind wallet connection requirement
- Customizable fallback UI
- Automatic connection check

**Usage:**
```tsx
import { RequireWallet } from "@/components/examples/RequireWallet";

export default function MyComponent() {
  return (
    <RequireWallet 
      fallback={<div>Please connect your wallet</div>}
    >
      <div>This only shows when wallet is connected</div>
    </RequireWallet>
  );
}
```

---

## Common Patterns

### Check if Wallet is Connected
```tsx
import { useWallet } from "@solana/wallet-adapter-react";

export function MyComponent() {
  const { connected, publicKey } = useWallet();

  if (!connected) return <div>Not connected</div>;
  return <div>Connected: {publicKey?.toString()}</div>;
}
```

### Get Connection Object
```tsx
import { useConnection } from "@solana/wallet-adapter-react";

export function MyComponent() {
  const { connection } = useConnection();
  // Use connection to query blockchain
}
```

### Send Transaction
```tsx
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

export function MyComponent() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const handleTransaction = async () => {
    const transaction = new Transaction();
    // Add instructions to transaction
    const signature = await sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature, "confirmed");
  };
}
```

### Fetch Account Information
```tsx
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export function MyComponent() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [accountInfo, setAccountInfo] = useState(null);

  useEffect(() => {
    if (!publicKey) return;

    connection.getAccountInfo(publicKey).then(setAccountInfo);
  }, [connection, publicKey]);
}
```

## Error Handling

### Wallet Not Ready Error
```tsx
import { WalletNotReadyError } from "@solana/wallet-adapter-base";

try {
  await wallet.adapter.connect();
} catch (error) {
  if (error instanceof WalletNotReadyError) {
    console.error("Wallet extension not installed");
  }
}
```

### Transaction Error
```tsx
try {
  const signature = await sendTransaction(transaction, connection);
} catch (error: any) {
  console.error("Transaction failed:", error.message);
}
```

## Network Switching

```tsx
import { useNetwork } from "@/contexts/connectionprovider";

export function NetworkSwitcher() {
  const { network, setNetwork } = useNetwork();

  return (
    <div>
      <button onClick={() => setNetwork("localhost")}>Localhost</button>
      <button onClick={() => setNetwork("devnet")}>Devnet</button>
      <button onClick={() => setNetwork("mainnet")}>Mainnet</button>
    </div>
  );
}
```

## Testing Checklist

- [ ] Connect different wallet types (Phantom, Solflare, etc.)
- [ ] Check error handling when wallet is not installed
- [ ] Test transaction signing
- [ ] Verify balance updates in real-time
- [ ] Test network switching
- [ ] Test localhost connection
- [ ] Verify error messages are clear
- [ ] Check loading states
- [ ] Test with insufficient balance scenarios
- [ ] Test with invalid addresses

## Debugging

Enable debug logging in your hooks:

```tsx
useEffect(() => {
  console.log("Connected:", connected);
  console.log("Public Key:", publicKey?.toString());
  console.log("Wallet:", wallet?.adapter.name);
}, [connected, publicKey, wallet]);
```

Check browser console for `@solana/wallet-adapter-react` debug messages.

## Resources

- [Wallet Adapter Guide](./wallet-adapter-guide.md)
- [Solana Documentation](https://docs.solana.com)
- [Web3.js API Reference](https://solana-labs.github.io/solana-web3.js/)
- [Wallet Adapter GitHub](https://github.com/solana-labs/wallet-adapter)
