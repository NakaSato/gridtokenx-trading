import type { Wallet } from '@/types/wallet'

/** Wallet adapters offered in the connect UI. */
export const allWallets: Wallet[] = [
  { name: 'Phantom', iconPath: '/images/phantom.png', id: 'phantom' },
  { name: 'Solflare', iconPath: '/images/solflare.png', id: 'solflare' },
  { name: 'Trust', iconPath: '/images/trust.png', id: 'trust' },
  { name: 'SafePal', iconPath: '/images/safepal.png', id: 'safepal' },
] as const
