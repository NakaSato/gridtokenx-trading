'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import bs58 from 'bs58'
import { useAuth } from '@/contexts/AuthProvider'

// Wallet-name → install URL for the adapters wired in connectionprovider.tsx.
const WALLET_INSTALL_URLS: Record<string, string> = {
  Phantom: 'https://phantom.app/',
  Solflare: 'https://solflare.com/',
  Trust: 'https://trustwallet.com/',
  SafePal: 'https://www.safepal.io/download',
}

/**
 * Connect-and-authenticate flow for Solana wallets, shared by WalletModal and the
 * /login page. Backed by the backend JWT path (loginWithWallet →
 * /api/v1/auth/wallet/verify).
 *
 * - If the user is already authenticated, the connected wallet is *linked* to
 *   their account (updateWallet).
 * - Otherwise the wallet signs a timestamped message and we exchange the
 *   signature for a JWT (loginWithWallet).
 *
 * Wallet-agnostic: works for Phantom / Solflare / Trust / SafePal (any adapter
 * registered in connectionprovider.tsx) — it keys off the adapter name only.
 */
export function useWalletAuth() {
  const router = useRouter()
  const { select, wallets } = useWallet()
  const { loginWithWallet, updateWallet, user, isAuthenticated } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)

  const connectAndLogin = useCallback(
    async (walletName: string): Promise<void> => {
      if (isConnecting) return

      setIsConnecting(true)

      try {
        const wallet = wallets.find((value) => value.adapter.name === walletName)

        if (!wallet) {
          toast.error(`Wallet "${walletName}" not found`)
          return
        }

        // Not installed / unsupported → point the user at the install page.
        if (
          !wallet.adapter.readyState ||
          wallet.adapter.readyState === 'Unsupported'
        ) {
          toast.error(
            `${walletName} wallet is not installed. Please install it first.`
          )
          const url = WALLET_INSTALL_URLS[walletName]
          if (url) window.open(url, '_blank')
          return
        }

        if (wallet.adapter.readyState === 'NotDetected') {
          toast.error(
            `${walletName} wallet not detected. Please install the extension.`
          )
          return
        }

        select(wallet.adapter.name)
        await wallet.adapter.connect()

        // publicKey can lag the connect() resolve — poll briefly.
        let publicKey = wallet.adapter.publicKey
        let retries = 0
        while (!publicKey && retries < 10) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          publicKey = wallet.adapter.publicKey
          retries++
        }

        if (!publicKey) {
          toast.error(
            'Wallet connected but public key not available. Please try again.'
          )
          return
        }

        toast.success(`${walletName} Wallet Connected`)

        if (user) {
          // Already signed in → link this wallet to the account.
          try {
            await updateWallet(publicKey.toString())
            toast.success('Wallet linked to your account')
          } catch (error) {
            console.error('Failed to link wallet:', error)
            const errorMsg =
              error instanceof Error ? error.message : 'Unknown error'
            toast.error(`Failed to link wallet to account: ${errorMsg}`)
            // Wallet stays connected, just not linked — don't tear down.
          }
        } else if (!isAuthenticated) {
          // Signed out → sign a challenge and exchange it for a JWT.
          const adapter = wallet.adapter as {
            signMessage?: (message: Uint8Array) => Promise<Uint8Array>
            disconnect?: () => Promise<void>
          }

          if (!adapter.signMessage) {
            toast.error('Wallet does not support message signing. Cannot sign in.')
            return
          }

          const timestamp = Date.now()
          const messageStr = `Sign in to GridTokenX. Timestamp: ${timestamp}`
          const message = new TextEncoder().encode(messageStr)

          try {
            toast.loading('Please sign the message to log in...', {
              id: 'signing-message',
            })

            const signature = await adapter.signMessage(message)
            toast.dismiss('signing-message')

            await loginWithWallet({
              wallet_address: publicKey.toString(),
              signature: bs58.encode(signature),
              message: messageStr,
              timestamp,
            })

            toast.success('Signed in successfully')
            await new Promise((resolve) => setTimeout(resolve, 500))
            router.refresh()
          } catch (error: unknown) {
            toast.dismiss('signing-message')
            console.error('Wallet login failed:', error)

            // Reset wallet state so a connected-but-unauthed session doesn't
            // linger (e.g. user rejected the signature).
            try {
              await adapter.disconnect?.()
            } catch {
              /* best-effort */
            }

            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error'
            if (errorMessage.includes('User rejected')) {
              toast.error('Login cancelled: Signature rejected')
            } else {
              toast.error(`Wallet login failed: ${errorMessage}`)
            }
          }
        }
      } catch (error: unknown) {
        console.error('Wallet connection error:', error)

        let errorMessage = 'Failed to connect'
        const err = error as { name?: string; message?: string }

        if (err?.name === 'WalletNotReadyError') {
          errorMessage = `${walletName} wallet is not ready. Please make sure it's installed and unlocked.`
        } else if (err?.name === 'WalletConnectionError') {
          errorMessage = 'Connection failed. Please try again.'
        } else if (err?.name === 'WalletDisconnectedError') {
          errorMessage = 'Wallet was disconnected. Please try again.'
        } else if (err?.message) {
          errorMessage = err.message
        }

        toast.error(errorMessage)
      } finally {
        setIsConnecting(false)
      }
    },
    [isConnecting, wallets, select, user, isAuthenticated, updateWallet, loginWithWallet, router]
  )

  return { connectAndLogin, isConnecting }
}
