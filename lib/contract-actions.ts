import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Program, BN } from '@coral-xyz/anchor'
import { OptionContract } from '@/lib/idl/option_contract'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import {
    WSOL_MINT,
    WSOL_ORACLE,
    USDC_MINT,
    USDC_ORACLE,
    THB_MINT,
    THB_ORACLE
} from '@/utils/const'
import {
    getPoolPDA,
    getCustodyPDA,
    getUserPDA,
    getOptionDetailPDA,
    getCustodyTokenAccountPDA,
    getContractPDA,
    getTransferAuthorityPDA,
    getLpTokenMintPDA
} from './pda-utils'

// =============================================================================
// TYPES
// =============================================================================

/** Parameters for opening an option position */
export interface OpenOptionParams {
    amount: number
    strike: number
    period: number
    expiredTime: number
    isCall: boolean
    paySol: boolean
    quoteToken: 'USDC' | 'THB'
}

/** Parameters for liquidity operations */
export interface LiquidityParams {
    amount: number
    asset: PublicKey
    poolName: string
}


export const openOption = async (
    program: Program<OptionContract>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
    params: OpenOptionParams
): Promise<boolean> => {
    const { amount, strike, period, expiredTime, isCall, paySol, quoteToken } = params
    const poolName = quoteToken === 'USDC' ? 'THB-USDC' : 'THB-SOL'
    const baseMint = THB_MINT
    const baseOracle = THB_ORACLE
    const quoteMint = quoteToken === 'USDC' ? USDC_MINT : WSOL_MINT
    const quoteOracle = quoteToken === 'USDC' ? USDC_ORACLE : WSOL_ORACLE

    const pool = getPoolPDA(poolName, program.programId)
    const custody = getCustodyPDA(pool, baseMint, program.programId)
    const userPDA = getUserPDA(publicKey, program.programId)

    let optionIndex
    try {
        const userInfo = await (program.account as any).user.fetch(userPDA)
        optionIndex = userInfo.option_index.toNumber() + 1
    } catch {
        optionIndex = 1
    }

    const optionDetailAccount = getOptionDetailPDA(publicKey, optionIndex, pool, custody, program.programId)
    const fundingAccount = getAssociatedTokenAddressSync(
        paySol ? baseMint : quoteMint,
        publicKey
    )

    const paycustody = getCustodyPDA(pool, paySol ? baseMint : quoteMint, program.programId)
    const paycustodyData = await (program.account as any).custody.fetch(paycustody)

    const transaction = await (program.methods as any)
        .openOption({
            amount: new BN(amount),
            strike: strike,
            period: new BN(period),
            expiredTime: new BN(expiredTime),
            poolName: poolName,
        })
        .accountsPartial({
            owner: publicKey,
            fundingAccount: fundingAccount,
            custodyMint: baseMint,
            payCustodyMint: paySol ? baseMint : quoteMint,
            custodyOracleAccount: baseOracle,
            payCustodyOracleAccount: paySol ? baseOracle : quoteOracle,
            lockedCustodyMint: isCall ? baseMint : quoteMint,
            optionDetail: optionDetailAccount,
            payCustodyTokenAccount: paycustodyData.token_account,
        })
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

export const closeOption = async (
    program: Program<OptionContract>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
    optionIndex: number
): Promise<boolean> => {
    const poolsToCheck = [
        { name: 'THB-USDC', mint: USDC_MINT },
        { name: 'THB-SOL', mint: WSOL_MINT }
    ]

    let foundPool = null
    let poolInfo = null

    for (const p of poolsToCheck) {
        const poolPDA = getPoolPDA(p.name, program.programId)
        const custodyPDA = getCustodyPDA(poolPDA, THB_MINT, program.programId)
        const od = getOptionDetailPDA(publicKey, optionIndex, poolPDA, custodyPDA, program.programId)

        const exists = await (program.account as any).optionDetail.fetch(od).catch(() => null)
        if (exists) {
            foundPool = poolPDA
            poolInfo = p
            break
        }
    }

    if (!foundPool || !poolInfo) return false

    const pool = foundPool
    const custodyToken = poolInfo.mint
    const custody = getCustodyPDA(pool, THB_MINT, program.programId)
    const payCustodyTokenAccount = getCustodyTokenAccountPDA(pool, THB_MINT, program.programId)
    const optionDetail = getOptionDetailPDA(publicKey, optionIndex, pool, custody, program.programId)

    const optionDetailData = await (program.account as any).optionDetail.fetch(optionDetail)
    const fundingAccount = getAssociatedTokenAddressSync(
        optionDetailData.premium_asset.equals(custody) ? THB_MINT : custodyToken,
        publicKey
    )

    const transaction = await (program.methods as any)
        .closeOption({
            optionIndex: new BN(optionIndex),
            poolName: poolInfo.name,
        })
        .accountsPartial({
            owner: publicKey,
            fundingAccount: fundingAccount,
            custodyMint: THB_MINT,
            payCustodyMint: THB_MINT,
            payCustodyTokenAccount: payCustodyTokenAccount,
            optionDetail: optionDetail,
            lockedCustody: custody,
            payCustody: custody,
        })
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

/**
 * Locate which pool holds the caller's option `index`, returning its pool name,
 * the resolved custody, and the fetched OptionDetail. Mirrors closeOption's
 * discovery loop — the on-chain instructions need `pool_name` as an arg to
 * resolve the pool/custody/option_detail PDAs.
 */
const findOptionPool = async (
    program: Program<OptionContract>,
    publicKey: PublicKey,
    optionIndex: number
) => {
    const poolsToCheck = [
        { name: 'THB-USDC', mint: USDC_MINT },
        { name: 'THB-SOL', mint: WSOL_MINT },
    ]
    for (const p of poolsToCheck) {
        const poolPDA = getPoolPDA(p.name, program.programId)
        const custodyPDA = getCustodyPDA(poolPDA, THB_MINT, program.programId)
        const optionDetail = getOptionDetailPDA(publicKey, optionIndex, poolPDA, custodyPDA, program.programId)
        const data = await (program.account as any).optionDetail.fetch(optionDetail).catch(() => null)
        if (data) return { poolName: p.name, custody: custodyPDA, optionDetail, optionDetailData: data }
    }
    return null
}

export const claimOption = async (
    program: Program<OptionContract>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
    optionIndex: number,
    // Retained for API compatibility with the provider/UI. The deployed
    // claim_option instruction takes no price (params: {option_index, pool_name}).
    _solPrice?: number
): Promise<boolean> => {
    const found = await findOptionPool(program, publicKey, optionIndex)
    if (!found) return false
    const { poolName, custody, optionDetailData } = found

    // locked_custody = OptionDetail.locked_asset; fetch it for its mint + oracle.
    const lockedCustody = optionDetailData.locked_asset as PublicKey
    const lockedCustodyData = await (program.account as any).custody.fetch(lockedCustody)
    const fundingAccount = getAssociatedTokenAddressSync(
        optionDetailData.premium_asset.equals(custody) ? THB_MINT : lockedCustodyData.mint,
        publicKey
    )

    const transaction = await (program.methods as any)
        .claimOption({ optionIndex: new BN(optionIndex), poolName })
        .accountsPartial({
            owner: publicKey,
            fundingAccount: fundingAccount,
            lockedCustody: lockedCustody,
            lockedOracle: lockedCustodyData.oracle,
            custodyMint: THB_MINT,
        })
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

export const exerciseOption = async (
    program: Program<OptionContract>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
    optionIndex: number
): Promise<boolean> => {
    const found = await findOptionPool(program, publicKey, optionIndex)
    if (!found) return false
    const { poolName, custody, optionDetailData } = found

    const lockedCustody = optionDetailData.locked_asset as PublicKey
    const lockedCustodyData = await (program.account as any).custody.fetch(lockedCustody)
    const fundingAccount = getAssociatedTokenAddressSync(
        optionDetailData.premium_asset.equals(custody) ? THB_MINT : lockedCustodyData.mint,
        publicKey
    )

    const transaction = await (program.methods as any)
        .exerciseOption({ optionIndex: new BN(optionIndex), poolName })
        .accountsPartial({
            owner: publicKey,
            fundingAccount: fundingAccount,
            lockedOracle: lockedCustodyData.oracle,
            custodyMint: THB_MINT,
            lockedCustodyMint: lockedCustodyData.mint,
        })
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


