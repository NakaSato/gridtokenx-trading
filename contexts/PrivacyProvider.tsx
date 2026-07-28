'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import * as privacyUtils from '@/lib/privacy-utils'
import { getPrivateBalancePDA, getPrivVaultPDA, getPrivVaultAuthPDA } from '@/lib/pda-utils'
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { ENERGY_TOKEN_MINT } from '@/utils/const'
import tradingIdl from '@/lib/idl/trading.json'
import { toast } from 'react-hot-toast'
import * as historyUtils from '@/lib/history-utils'

interface PrivateBalanceState {
  commitment: number[]
  amount: number | null
  origin: 'Solar' | 'Wind' | 'Grid' | null
  txCounter: number
  lastUpdateSlot: number
  isInitialized: boolean
}

interface PrivacyContextType {
  isUnlocked: boolean
  unlockPrivacy: () => Promise<void>
  fulfillTradeOffer: (invite: string) => Promise<string>
  refresh: () => Promise<void>
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

export const usePrivacy = () => {
  const context = useContext(PrivacyContext)
  if (!context)
    throw new Error('usePrivacy must be used within PrivacyProvider')
  return context
}

// Safe initialization of TRADING_PROGRAM_ID
let TRADING_PROGRAM_ID: PublicKey
try {
  TRADING_PROGRAM_ID = new PublicKey(tradingIdl.address)
} catch (e) {
  console.warn('[PrivacyProvider] Invalid trading IDL address, using fallback')
  TRADING_PROGRAM_ID = new PublicKey(
    '9t3s8sCgVUG9kAgVPsozj8mDpJp9cy6SF5HwRK5nvAHb'
  )
}

// Slimmed to the surface FulfillTradeModal actually uses (unlock → fulfill →
// refresh, with shield/history as internal steps). The former shield/unshield/
// transfer/stealth/staking/rollup/policy/view-key API had no UI entry points
// and was removed; see git history if a flow gets resurrected.
export const PrivacyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const [privateBalance, setPrivateBalance] =
    useState<PrivateBalanceState | null>(null)
  const [rootSeed, setRootSeed] = useState<Uint8Array | null>(null)
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null)
  const [program, setProgram] = useState<Program<any>>()

  const isUnlocked = !!rootSeed

  useEffect(() => {
    if (wallet) {
      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      })
      const prog = new Program(tradingIdl as any, provider)
      setProgram(prog)
    }
  }, [wallet, connection])

  const refresh = async () => {
    if (!wallet || !program) return

    try {
      const pda = getPrivateBalancePDA(
        wallet.publicKey,
        ENERGY_TOKEN_MINT,
        TRADING_PROGRAM_ID
      )
      const account = await (
        program.account as any
      ).privateBalance.fetchNullable(pda)

      if (account) {
        // If we have a seed, try to recover the amount
        let amount: number | null = null
        let originVal: 'Solar' | 'Wind' | 'Grid' | null = null
        if (rootSeed) {
          const stored = localStorage.getItem(
            `gtx_priv_bal_${wallet.publicKey.toBase58()}`
          )
          if (stored) {
            amount = parseInt(stored)
          }
          originVal =
            (localStorage.getItem(
              `gtx_priv_origin_${wallet.publicKey.toBase58()}`
            ) as any) || 'Solar'
        }

        setPrivateBalance({
          commitment: Array.from(account.balanceCommitment.point),
          amount: amount,
          origin: originVal,
          txCounter: (account.txCounter as BN).toNumber(),
          lastUpdateSlot: (account.lastUpdateSlot as BN).toNumber(),
          isInitialized: true,
        })
      } else {
        setPrivateBalance({
          commitment: [],
          amount: 0,
          origin: null,
          txCounter: 0,
          lastUpdateSlot: 0,
          isInitialized: false,
        })
      }
    } catch (error) {
      console.error('[PrivacyProvider] Failed to fetch balance:', error)
    }
  }

  useEffect(() => {
    refresh()
  }, [program, isUnlocked])

  const unlockPrivacy = async () => {
    if (!wallet) throw new Error('Wallet not connected')

    // Use wallet.signMessage if available (Standard but optional in AnchorWallet)
    const provider = (window as any).solana
    if (!provider?.signMessage) {
      throw new Error(
        'Wallet does not support message signing required for privacy.'
      )
    }

    const message = new TextEncoder().encode(
      `GridTokenX Privacy Access\n\nAuthorize access to your confidential GridToken assets.\nYour balance will be recovered using your signature.\n\nWallet: ${wallet.publicKey.toBase58()}`
    )

    const signedMessage = await provider.signMessage(message)
    const signature = signedMessage.signature

    const seed = privacyUtils.derivePrivacyRootSeed(signature)
    setRootSeed(seed)

    // Derive a separate encryption key for history (first 32 bytes of sha256(seed))
    const encKey = await window.crypto.subtle.digest(
      'SHA-256',
      new Uint8Array(seed).buffer
    )
    setEncryptionKey(new Uint8Array(encKey))

    await refresh()
  }

  const pushToHistory = async (
    type: string,
    amount: number,
    details: any = {}
  ) => {
    if (!wallet || !encryptionKey) return

    const entry = {
      type,
      amount,
      ...details,
      timestamp: Date.now(),
    }

    const encrypted = await historyUtils.encryptHistoryBlob(
      entry,
      encryptionKey
    )

    const storageKey = `gtx_priv_history_${wallet.publicKey.toBase58()}`
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]')
    current.push(encrypted)
    localStorage.setItem(storageKey, JSON.stringify(current))
  }

  // Shield amount is PUBLIC. The instruction moves tokens user→pool vault and
  // adds amount·G to the shielded commitment (blinding accrues via transfers).
  const shield = async (amount: number, origin: 'Solar' | 'Wind' = 'Solar') => {
    if (!wallet || !program || !rootSeed)
      throw new Error('Not connected or locked')

    const senderBalance = getPrivateBalancePDA(
      wallet.publicKey,
      ENERGY_TOKEN_MINT,
      TRADING_PROGRAM_ID
    )
    const vault = getPrivVaultPDA(ENERGY_TOKEN_MINT, TRADING_PROGRAM_ID)
    const vaultAuthority = getPrivVaultAuthPDA(TRADING_PROGRAM_ID)
    const userWallet = getAssociatedTokenAddressSync(
      ENERGY_TOKEN_MINT,
      wallet.publicKey
    )

    const sig = await (program.methods as any)
      .shield(new BN(amount))
      .accounts({
        sender: wallet.publicKey,
        mint: ENERGY_TOKEN_MINT,
        userWallet,
        vault,
        vaultAuthority,
        senderBalance,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc()

    // For this prototype, we store it in local storage so it persists between reloads
    localStorage.setItem(
      `gtx_priv_bal_${wallet.publicKey.toBase58()}`,
      amount.toString()
    )
    localStorage.setItem(
      `gtx_priv_origin_${wallet.publicKey.toBase58()}`,
      origin
    )

    await pushToHistory('SHIELD', amount, { origin })
    await refresh()
    return sig
  }

  const fulfillTradeOffer = async (invite: string) => {
    if (!wallet || !program || !rootSeed)
      throw new Error('Not connected or locked')

    try {
      const data = JSON.parse(atob(invite))
      const toastId = toast.loading(
        `Initiating P2P Settlement for ${data.amount} GRX...`
      )

      // 1. Simulate Atomic Payment (USDC Transfer)
      await new Promise((r) => setTimeout(r, 1000))
      toast.loading('Confirming public token payment receipt...', {
        id: toastId,
      })

      // 2. Settlement triggers private token release from Escrow to Buyer.
      // In a real flow, the Buyer would sign a 'Claim' TX that includes proof-of-payment.
      await new Promise((r) => setTimeout(r, 1500))

      const sig = await shield(data.amount)

      await pushToHistory('P2P_PURCHASE', data.amount, {
        seller: data.seller,
        price: data.price,
        totalPaid: data.amount * data.price,
      })

      toast.success(`Trade Settled: ${data.amount} GRX received!`, {
        id: toastId,
      })
      return sig
    } catch (e) {
      throw new Error('Invalid trade invite')
    }
  }

  return (
    <PrivacyContext.Provider
      value={{
        isUnlocked,
        unlockPrivacy,
        fulfillTradeOffer,
        refresh,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  )
}
