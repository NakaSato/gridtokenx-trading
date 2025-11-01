# Wallet Adapter Integration Guide for GridTokenX

This guide provides step-by-step instructions for integrating Solana Wallet Adapter features into your existing Next.js application.

## Current Status ✅

Your application now has:
- ✅ ConnectionProvider with support for mainnet, devnet, and localhost
- ✅ WalletProvider with Phantom, Solflare, and Trust wallet support
- ✅ WalletModalProvider for wallet selection UI
- ✅ NetworkSelector component for switching networks
- ✅ Network persistence in localStorage
- ✅ Safe wallet connection handling

## Quick Start

### 1. Import the Context Provider

Your app is already wrapped with the connection provider in `app/layout.tsx`:

```tsx
import Connectionprovider from "@/contexts/connectionprovider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Connectionprovider>
          {/* Your app content */}
        </Connectionprovider>
      </body>
    </html>
  );
}
```

### 2. Use Wallet Hooks in Components

Import hooks from `@solana/wallet-adapter-react`:

```tsx
"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";

export function MyComponent() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Use hooks in your component
}
```

### 3. Access Network Information

Use the `useNetwork` hook:

```tsx
import { useNetwork } from "@/contexts/connectionprovider";

export function MyComponent() {
  const { network, setNetwork, endpoint } = useNetwork();
  
  console.log("Current network:", network);
  console.log("RPC endpoint:", endpoint);
}
```

## Integration Examples

### Example 1: Adding Wallet Balance to Dashboard

```tsx
// components/DashboardBalance.tsx
"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

export function DashboardBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!connection || !publicKey) return;

    connection.getAccountInfo(publicKey).then((info) => {
      if (info) {
        setBalance(info.lamports / LAMPORTS_PER_SOL);
      }
    });
  }, [connection, publicKey]);

  if (!publicKey) return <div>Not connected</div>;

  return <div>Balance: {balance.toFixed(4)} SOL</div>;
}
```

### Example 2: Protected Route Component

```tsx
// components/ProtectedTrade.tsx
"use client";

import { RequireWallet } from "@/components/examples/RequireWallet";

export function ProtectedTrade() {
  return (
    <RequireWallet>
      <div>
        {/* Your trading interface here */}
        <h2>Trading Options</h2>
      </div>
    </RequireWallet>
  );
}
```

### Example 3: Sign and Send Transaction

```tsx
// components/CreateOrder.tsx
"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, TransactionInstruction, PublicKey } from "@solana/web3.js";
import { useState } from "react";
import { toast } from "react-toastify";

export function CreateOrder() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleCreateOrder = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    setLoading(true);
    try {
      const programId = new PublicKey("YOUR_PROGRAM_ID");
      const transaction = new Transaction();

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          // Add more accounts
        ],
        programId,
        data: Buffer.from([]), // Instruction data
      });

      transaction.add(instruction);

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      toast.success("Order created!");
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return <button onClick={handleCreateOrder}>Create Order</button>;
}
```

## Testing Your Integration

### Test Checklist

1. **Wallet Connection**
   - [ ] Click "Connect Wallet" button
   - [ ] Select different wallet adapters
   - [ ] Verify connection successful
   - [ ] Check displayed wallet address

2. **Network Switching**
   - [ ] Switch between mainnet, devnet, localhost
   - [ ] Verify network persists on page reload
   - [ ] Check RPC endpoint updates

3. **Localhost Development**
   - [ ] Start local validator: `solana-test-validator`
   - [ ] Switch app to localhost network
   - [ ] Connect wallet
   - [ ] Send test transaction
   - [ ] Verify transaction success

4. **Error Handling**
   - [ ] Test with wallet not installed
   - [ ] Test with insufficient balance
   - [ ] Test with invalid recipient address
   - [ ] Check error messages display correctly

5. **State Persistence**
   - [ ] Close and reopen browser
   - [ ] Verify network selection persisted
   - [ ] Verify wallet connection persisted

### Manual Testing with Phantom Wallet

1. Install [Phantom Wallet](https://phantom.app)
2. Create/import a test wallet
3. Switch Phantom to devnet (Settings → Developer Settings → Testnet Mode)
4. Run your app: `npm run dev`
5. Connect wallet through your app
6. Try sending a transaction

## Localhost Development Workflow

```bash
# Terminal 1: Start local validator
solana-test-validator

# Terminal 2: Fund your wallet
solana airdrop 10 -u http://127.0.0.1:8899 --keypair ~/.config/solana/id.json

# Terminal 3: Start your app
cd gridtokenx-trading
npm run dev

# In your app:
# 1. Switch to "Localhost" network via NetworkSelector
# 2. Connect your wallet
# 3. Deploy programs and test
```

## Troubleshooting

### "Wallet not connected" error

Make sure the component is wrapped in the ConnectionProvider:

```tsx
// ✅ Correct
<Connectionprovider>
  <MyComponent /> {/* Can use useWallet here */}
</Connectionprovider>

// ❌ Wrong
<MyComponent /> {/* useWallet hook will fail */}
<Connectionprovider>
</Connectionprovider>
```

### Hydration mismatch in Next.js

Use `useEffect` to access wallet state:

```tsx
// ✅ Correct
useEffect(() => {
  if (publicKey) {
    console.log(publicKey.toString());
  }
}, [publicKey]);

// ❌ Wrong - will cause hydration error
if (publicKey) {
  console.log(publicKey.toString());
}
```

### Transaction fails on localhost

1. Check local validator is running
2. Fund your wallet: `solana airdrop 10 -u http://127.0.0.1:8899`
3. Verify network is set to localhost
4. Check program ID is deployed on localhost

### Wallet extension not detected

1. Verify wallet extension is installed in browser
2. Check extension is enabled
3. Make sure it's not conflicting with other extensions
4. Try in incognito mode
5. Try a different wallet adapter

## Next Steps

1. **Integrate into existing components**
   - Add wallet connection to your navbar
   - Add balance display to portfolio page
   - Add transaction signing to trading forms

2. **Add more features**
   - Token swaps
   - NFT transfers
   - Program interactions
   - Multi-signature support

3. **Enhance UX**
   - Add loading spinners
   - Improve error messages
   - Add transaction history
   - Show pending confirmations

4. **Security**
   - Never store secret keys
   - Validate all user inputs
   - Use confirmed transactions
   - Test with malicious inputs

## Resources

- [Wallet Adapter Guide](./wallet-adapter-guide.md)
- [Example Components](./components/examples/README.md)
- [Solana Docs](https://docs.solana.com)
- [Web3.js Reference](https://solana-labs.github.io/solana-web3.js/)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review example components
3. Check browser console for errors
4. Review Solana documentation
