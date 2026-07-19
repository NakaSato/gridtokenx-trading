import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { Program, BN } from '@coral-xyz/anchor'
import {
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token'
import { getUserEscrowPDA, getMarketAuthorityPDA } from './pda-utils'

// =============================================================================
// TYPES
// =============================================================================

/** Parameters for escrow deposit/withdraw actions */
export interface EscrowActionParams {
    mint: PublicKey
    /** Human-readable amount as typed by the user, e.g. "1.5" */
    amountUi: string
    /** Mint decimals used to convert amountUi to base units */
    decimals: number
}

export interface EscrowBalance {
    uiAmount: number
    raw: bigint
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convert a user-typed decimal string to base units without float math.
 * Throws on non-numeric input, too many decimal places, or amount <= 0.
 */
export function toBaseUnits(amountUi: string, decimals: number): BN {
    const trimmed = amountUi.trim()
    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
        throw new Error('Enter a valid amount')
    }
    const [whole, frac = ''] = trimmed.split('.')
    if (frac.length > decimals) {
        throw new Error(`Amount supports at most ${decimals} decimal places`)
    }
    const raw = BigInt(whole + frac.padEnd(decimals, '0'))
    if (raw <= BigInt(0)) {
        throw new Error('Amount must be greater than zero')
    }
    return new BN(raw.toString())
}

/**
 * The trading program's escrow instructions accept TokenInterface, so the mint
 * may be owned by classic SPL Token or Token-2022. The ATA derivation and the
 * token_program account must both use the mint's actual owner program.
 */
export async function resolveTokenProgram(
    connection: Connection,
    mint: PublicKey
): Promise<PublicKey> {
    const info = await connection.getAccountInfo(mint)
    if (!info) {
        throw new Error('Token mint not found on-chain')
    }
    return info.owner.equals(TOKEN_2022_PROGRAM_ID)
        ? TOKEN_2022_PROGRAM_ID
        : TOKEN_PROGRAM_ID
}

// =============================================================================
// ACTIONS
// =============================================================================

export const depositEscrow = async (
    program: Program,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
    params: EscrowActionParams
): Promise<string> => {
    const { mint, amountUi, decimals } = params
    const amount = toBaseUnits(amountUi, decimals)

    const tokenProgram = await resolveTokenProgram(connection, mint)
    const userWallet = getAssociatedTokenAddressSync(mint, publicKey, false, tokenProgram)
    const userEscrow = getUserEscrowPDA(publicKey, mint, program.programId)
    const marketAuthority = getMarketAuthorityPDA(program.programId)

    const transaction = await program.methods
        .depositEscrow(amount)
        .accountsPartial({
            user: publicKey,
            mint,
            userWallet: userWallet,
            userEscrow: userEscrow,
            marketAuthority: marketAuthority,
            tokenProgram: tokenProgram,
            systemProgram: SystemProgram.programId,
        })
        .transaction()

    const latestBlockHash = await connection.getLatestBlockhash()
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
    })
    return signature
}

export const withdrawEscrow = async (
    program: Program,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
    params: EscrowActionParams
): Promise<string> => {
    const { mint, amountUi, decimals } = params
    const amount = toBaseUnits(amountUi, decimals)

    const tokenProgram = await resolveTokenProgram(connection, mint)
    const userWallet = getAssociatedTokenAddressSync(mint, publicKey, false, tokenProgram)
    const userEscrow = getUserEscrowPDA(publicKey, mint, program.programId)
    const marketAuthority = getMarketAuthorityPDA(program.programId)

    const transaction = await program.methods
        .withdrawEscrow(amount)
        .accountsPartial({
            user: publicKey,
            mint,
            userEscrow: userEscrow,
            userWallet: userWallet,
            marketAuthority: marketAuthority,
            tokenProgram: tokenProgram,
        })
        .transaction()

    const latestBlockHash = await connection.getLatestBlockhash()
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
    })
    return signature
}

/**
 * Read the on-chain escrow token balance for a user+mint. The escrow token
 * account is created lazily on first deposit (init_if_needed), so a missing
 * account is reported as a zero balance, not an error.
 */
export const fetchEscrowBalance = async (
    connection: Connection,
    user: PublicKey,
    mint: PublicKey,
    programId: PublicKey
): Promise<EscrowBalance> => {
    const escrowPda = getUserEscrowPDA(user, mint, programId)
    try {
        const { value } = await connection.getTokenAccountBalance(escrowPda)
        return {
            uiAmount: value.uiAmount ?? 0,
            raw: BigInt(value.amount),
        }
    } catch {
        return { uiAmount: 0, raw: BigInt(0) }
    }
}
