import type { Connection, PublicKey, Transaction } from '@solana/web3.js'
import type { Program } from '@coral-xyz/anchor'

/**
 * Everything an on-chain action needs to build, sign and confirm a tx. Every
 * action used to repeat these four as positional parameters.
 */
export interface TxContext<P = Program> {
  program: P
  connection: Connection
  publicKey: PublicKey
  sendTransaction: (
    tx: Transaction,
    connection: Connection
  ) => Promise<string>
}
