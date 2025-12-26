export interface Pool {
  programId: string
  name: string
  token0: string
  token1: string
  decimals: number
}

export const pools: Pool[] = [
  {
    programId: 'GrDK9rQpeFeb5yLpPhMhuJr2vhY9toePrRxnAUoMT9KD',
    name: 'SOL/USDC',
    token0: 'SOL',
    token1: 'USDC',
    decimals: 6,
  },
  {
    programId: 'GrDK9rQpeFeb5yLpPhMhuJr2vhY9toePrRxnAUoMT9KD',
    name: 'SOL/THB',
    token0: 'SOL',
    token1: 'THB',
    decimals: 6,
  },
]
