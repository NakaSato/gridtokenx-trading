# Authentication Components

This directory contains the authentication components for wallet connection (sign-in/sign-out).

## Components

### `SignIn`
The sign-in component that opens the wallet connection modal.

**Props:**
- `variant?: "default" | "outline" | "ghost"` - Button style variant (default: "default")
- `size?: "default" | "sm" | "lg" | "icon"` - Button size (default: "default")
- `className?: string` - Additional CSS classes
- `showIcon?: boolean` - Show wallet icon (default: true)
- `text?: string` - Button text (default: "Connect Wallet")

**Example:**
```tsx
import { SignIn } from '@/components/auth';

<SignIn 
  variant="default" 
  className="bg-primary text-background"
  text="Sign In"
/>
```

### `SignOut`
The sign-out component that disconnects the wallet.

**Props:**
- `variant?: "default" | "outline" | "ghost" | "destructive"` - Button style variant (default: "outline")
- `size?: "default" | "sm" | "lg" | "icon"` - Button size (default: "default")
- `className?: string` - Additional CSS classes
- `showIcon?: boolean` - Show logout icon (default: true)
- `text?: string` - Button text (default: "Sign Out")
- `onSignOut?: () => void` - Callback function after sign out

**Example:**
```tsx
import { SignOut } from '@/components/auth';

<SignOut 
  variant="destructive"
  text="Disconnect Wallet"
  onSignOut={() => console.log('User signed out')}
/>
```

### `AuthButton`
A smart component that automatically switches between SignIn and SignOut based on wallet connection status.

**Props:**
- `signInVariant?: "default" | "outline" | "ghost"` - Sign in button variant (default: "default")
- `signOutVariant?: "default" | "outline" | "ghost" | "destructive"` - Sign out button variant (default: "outline")
- `size?: "default" | "sm" | "lg" | "icon"` - Button size (default: "default")
- `className?: string` - Additional CSS classes
- `showIcon?: boolean` - Show icons (default: true)
- `signInText?: string` - Sign in button text (default: "Connect Wallet")
- `signOutText?: string` - Sign out button text (default: "Disconnect")
- `onSignOut?: () => void` - Callback function after sign out

**Example:**
```tsx
import { AuthButton } from '@/components/auth';

<AuthButton 
  signInVariant="default"
  signOutVariant="outline"
  className="w-full"
  signInText="Connect"
  signOutText="Disconnect"
  onSignOut={() => router.push('/')}
/>
```

## Usage in Existing Components

You can replace existing wallet connection buttons with these new components:

### Before:
```tsx
{connected ? (
  <Button onClick={() => disconnect()}>
    Disconnect
  </Button>
) : (
  <Button onClick={() => setIsWalletModalOpen(true)}>
    <WalletIcon />
    Connect Wallet
  </Button>
)}
```

### After:
```tsx
import { AuthButton } from '@/components/auth';

<AuthButton 
  className="w-full"
  signInText="Connect Wallet"
  signOutText="Disconnect"
/>
```

## Features

- ✅ Automatic wallet detection
- ✅ Multi-wallet support (Phantom, Solflare, Trust)
- ✅ Toast notifications on connect/disconnect
- ✅ Customizable button styles
- ✅ Responsive design
- ✅ Type-safe with TypeScript
- ✅ Integrated with Solana wallet adapter
