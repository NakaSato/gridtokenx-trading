import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Program, BN } from '@coral-xyz/anchor'
import { OptionContract } from '@/lib/idl/option_contract'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import {
    getPoolPDA,
    getCustodyPDA,
    getCustodyTokenAccountPDA,
    getContractPDA,
    getTransferAuthorityPDA,
    getLpTokenMintPDA
} from '@/lib/pda-utils'


/** Parameters for liquidity operations */
export interface LiquidityParams {
    amount: number
    asset: PublicKey
    poolName: string
}

export const addLiquidity = async (
    program: Program<OptionContract>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
    params: LiquidityParams
): Promise<boolean> => {
    const { amount, asset, poolName } = params
    const pool = getPoolPDA(poolName, program.programId)
    const custodyPDA = getCustodyPDA(pool, asset, program.programId)
    const poolData = await (program.account as any).pool.fetch(pool)
    const custodyData = await (program.account as any).custody.fetch(custodyPDA)
    const fundingAccount = getAssociatedTokenAddressSync(asset, publicKey)

    let remainingAccounts = []
    for (const cPubkey of poolData.custodies) {
        const c = await (program.account as any).custody.fetch(cPubkey)
        remainingAccounts.push({ pubkey: cPubkey, isSigner: false, isWritable: true })
        remainingAccounts.push({ pubkey: c.oracle, isSigner: false, isWritable: true })
    }

    const transaction = await (program.methods as any)
        .addLiquidity({
            amountIn: new BN(amount),
            minLpAmountOut: new BN(1),
            poolName: poolName,
        })
        .accountsPartial({
            owner: publicKey,
            fundingAccount: fundingAccount,
            custodyMint: asset,
            custodyOracleAccount: custodyData.oracle,
        })
        .remainingAccounts(remainingAccounts)
        .transaction()

    const latestBlockHash = await connection.getLatestBlockhash()
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
    })
    return true
}

export const removeLiquidity = async (
    program: Program<OptionContract>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
    params: LiquidityParams
): Promise<boolean> => {
    const { amount, asset, poolName } = params
    const pool = getPoolPDA(poolName, program.programId)
    const poolData = await (program.account as any).pool.fetch(pool)
    const custodyPDA = getCustodyPDA(pool, asset, program.programId)
    const custodyData = await (program.account as any).custody.fetch(custodyPDA)

    const receivingAccount = getAssociatedTokenAddressSync(asset, publicKey)
    const contract = getContractPDA(program.programId)
    const transferAuthority = getTransferAuthorityPDA(program.programId)
    const custodyTokenAccount = getCustodyTokenAccountPDA(pool, asset, program.programId)
    const lpTokenMint = getLpTokenMintPDA(poolName, program.programId)
    const lpTokenAccount = getAssociatedTokenAddressSync(lpTokenMint, publicKey)

    let remainingAccounts = []
    for (const cPubkey of poolData.custodies) {
        const c = await (program.account as any).custody.fetch(cPubkey)
        remainingAccounts.push({ pubkey: cPubkey, isSigner: false, isWritable: true })
        remainingAccounts.push({ pubkey: c.oracle, isSigner: false, isWritable: true })
    }

    const transaction = await (program.methods as any)
        .removeLiquidity({
            lpAmountIn: new BN(amount),
            minAmountOut: new BN(0),
            poolName: poolName,
        })
        .accountsPartial({
            owner: publicKey,
            receivingAccount: receivingAccount,
            transferAuthority: transferAuthority,
            contract: contract,
            pool: pool,
            custody: custodyPDA,
            custodyOracleAccount: custodyData.oracle,
            custodyTokenAccount: custodyTokenAccount,
            lpTokenMint: lpTokenMint,
            lpTokenAccount: lpTokenAccount,
            custodyMint: asset,
        })
        .remainingAccounts(remainingAccounts)
        .transaction()

    const latestBlockHash = await connection.getLatestBlockhash()
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
    })
    return true
}


