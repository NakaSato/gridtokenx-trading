# Wallet Adapter Quick Reference

## 🚀 Quick Start (Copy & Paste)

### Check if Wallet Connected
```tsx
import { useWallet } from "@solana/wallet-adapter-react";

const { connected, publicKey } = useWallet();

if (!connected) return <div>Please connect wallet</div>;
```

### Show Wallet Balance
```tsx
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

const { connection } = useConnection();
const { publicKey } = useWallet();
const [balance, setBalance] = useState(0);

useEffect(() => {
  if (!publicKey) return;
  connection.getAccountInfo(publicKey).then(info => {
    if (info) setBalance(info.lamports / LAMPORTS_PER_SOL);
  });
}, [publicKey, connection]);
```

### Send SOL
```tsx
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: publicKey!,
    toPubkey: new PublicKey("recipient_address"),
    lamports: 0.1 * LAMPORTS_PER_SOL,
  })
);

const signature = await sendTransaction(tx, connection);
await connection.confirmTransaction(signature, "confirmed");
```

### Switch Network
```tsx
import { useNetwork } from "@/contexts/connectionprovider";

const { network, setNetwork } = useNetwork();
setNetwork("localhost"); // "mainnet" | "devnet" | "localhost"
```

## 📚 Hook Reference

### useWallet()
```tsx
const {
  connected,           // boolean
  publicKey,          // PublicKey | null
  wallet,             // Wallet | null
  wallets,            // Wallet[]
  connecting,         // boolean
  disconnecting,      // boolean
  select,             // (name: string) => void
  connect,            // () => Promise<void>
  disconnect,         // () => Promise<void>
  sendTransaction,    // (tx, connection) => Promise<string>
} = useWallet();
```

### useConnection()
```tsx
const { connection } = useConnection();
```

### useNetwork()
```tsx
const { 
  network,       // "mainnet" | "devnet" | "localhost"
  setNetwork,    // (network) => void
  endpoint,      // string (RPC endpoint)
} = useNetwork();
```

### useAnchorWallet()
```tsx
const wallet = useAnchorWallet();
// wallet.publicKey, wallet.signTransaction, etc.
```

## 🎯 Common Tasks

### Task: Protect a Route
```tsx
<RequireWallet>
  <YourComponent />
</RequireWallet>
```

### Task: Show Balance
```tsx
<BalanceDisplay />
```

### Task: Send SOL Form
```tsx
<SendSolExample onSuccess={(sig) => console.log(sig)} />
```

### Task: Safe Wallet Connect
```tsx
<SafeWalletConnect />
```

### Task: Check Wallet Ready
```tsx
const wallet = wallets.find(w => w.adapter.name === "Phantom");
if (wallet?.readyState === "NotDetected") {
  // Wallet not installed
}
```

## 🔌 Connection Methods

### Get Account Info
```tsx
const info = await connection.getAccountInfo(publicKey);
const balance = info?.lamports / LAMPORTS_PER_SOL;
```

### Watch Account Changes
```tsx
const unsubscribe = connection.onAccountChange(
  publicKey,
  (accountInfo) => console.log("Updated:", accountInfo),
  "confirmed"
);
// Later: unsubscribe();
```

### Get Recent Transactions
```tsx
const sigs = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
```

### Confirm Transaction
```tsx
await connection.confirmTransaction(signature, "confirmed");
```

## ⚠️ Error Handling

### Handle Not Connected
```tsx
if (!publicKey) {
  throw new Error("Please connect wallet");
}
```

### Handle Not Ready
```tsx
import { WalletNotReadyError } from "@solana/wallet-adapter-base";

try {
  await connect();
} catch (error) {
  if (error instanceof WalletNotReadyError) {
    // Wallet not installed
  }
}
```

### Handle Transaction Error
```tsx
try {
  await sendTransaction(tx, connection);
} catch (error: any) {
  console.error("Failed:", error.message);
}
```

## 🎯 Transaction Pattern

```tsx
// 1. Create transaction
const tx = new Transaction();

// 2. Add instructions
const instruction = new TransactionInstruction({ /* ... */ });
tx.add(instruction);

// 3. Send and sign
const signature = await sendTransaction(tx, connection);

// 4. Wait for confirmation
await connection.confirmTransaction(signature, "confirmed");

// 5. Success!
console.log("Confirmed:", signature);
```

## 🌐 Network Endpoints

| Network | Endpoint |
|---------|----------|
| Mainnet | `https://api.mainnet-beta.solana.com` |
| Devnet | `https://api.devnet.solana.com` |
| Localhost | `http://127.0.0.1:8899` |

## 📱 Supported Wallets

- ✅ Phantom
- ✅ Solflare
- ✅ Trust Wallet
- ✅ All Wallet Standard compliant wallets

## 🐛 Quick Debugging

```tsx
// Check if provider is correct
console.log("Connected:", connected);
console.log("PublicKey:", publicKey?.toString());
console.log("Wallet:", wallet?.adapter.name);
console.log("Network:", network);
console.log("Endpoint:", endpoint);
```

## 📋 Component Locations

```
contexts/connectionprovider.tsx     # Main provider
components/NetworkSelector.tsx      # Network switcher
components/examples/
  ├── BalanceDisplay.tsx           # Show balance
  ├── SendSolExample.tsx           # Send SOL
  ├── SafeWalletConnect.tsx        # Connect safely
  └── RequireWallet.tsx            # Route protection
```

## 📚 Documentation Files

```
docs/wallet-adapter-guide.md        # Complete guide
docs/localhost-wallet.md            # Localhost setup
WALLET_ADAPTER_INTEGRATION.md       # Integration guide
REAL_WORLD_EXAMPLES.md              # Real examples
IMPLEMENTATION_CHECKLIST.md         # Checklist
```

## ⚡ Pro Tips

1. **Always check `connected`** before accessing `publicKey`
2. **Use `useEffect`** to avoid hydration errors
3. **Show loading states** during transaction signing
4. **Confirm transactions** with `connection.confirmTransaction()`
5. **Check wallet readiness** before connecting
6. **Use `toast` for user feedback** on transactions
7. **Test on devnet first** before mainnet
8. **Keep error messages clear** for users

## 🚀 Deploy Checklist

- [ ] Wallet connects successfully
- [ ] All networks work
- [ ] Transactions sign properly
- [ ] Error handling works
- [ ] Balance displays correctly
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Ready for devnet!

---

**More help?** Check the full documentation files! 📖
