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

export const openOption = async (
    program: Program<OptionContract>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: any,
    params: {
        amount: number,
        strike: number,
        period: number,
        expiredTime: number,
        isCall: boolean,
        paySol: boolean,
        quoteToken: 'USDC' | 'THB'
    }
) => {
    const { amount, strike, period, expiredTime, isCall, paySol, quoteToken } = params
    const poolName = quoteToken === 'USDC' ? 'SOL-USDC' : 'SOL-THB'
    const quoteMint = quoteToken === 'USDC' ? USDC_MINT : THB_MINT
    const quoteOracle = quoteToken === 'USDC' ? USDC_ORACLE : THB_ORACLE

    const pool = getPoolPDA(poolName, program.programId)
    const custody = getCustodyPDA(pool, WSOL_MINT, program.programId)
    const userPDA = getUserPDA(publicKey, program.programId)

    let optionIndex
    try {
        const userInfo = await program.account.User.fetch(userPDA)
        optionIndex = userInfo.option_index.toNumber() + 1
    } catch {
        optionIndex = 1
    }

    const optionDetailAccount = getOptionDetailPDA(publicKey, optionIndex, pool, custody, program.programId)
    const fundingAccount = getAssociatedTokenAddressSync(
        paySol ? WSOL_MINT : quoteMint,
        publicKey
    )

    const paycustody = getCustodyPDA(pool, paySol ? WSOL_MINT : quoteMint, program.programId)
    const paycustodyData = await program.account.Custody.fetch(paycustody)

    const transaction = await program.methods
        .open_option({
            amount: new BN(amount),
            strike: strike,
            period: new BN(period),
            expiredTime: new BN(expiredTime),
            poolName: poolName,
        })
        .accountsPartial({
            owner: publicKey,
            funding_account: fundingAccount,
            custody_mint: WSOL_MINT,
            pay_custody_mint: paySol ? WSOL_MINT : quoteMint,
            custody_oracle_account: WSOL_ORACLE,
            pay_custody_oracle_account: paySol ? WSOL_ORACLE : quoteOracle,
            locked_custody_mint: isCall ? WSOL_MINT : quoteMint,
            option_detail: optionDetailAccount,
            pay_custody_token_account: paycustodyData.token_account,
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
    sendTransaction: any,
    optionIndex: number
) => {
    const poolsToCheck = [
        { name: 'SOL-USDC', mint: USDC_MINT },
        { name: 'SOL-THB', mint: THB_MINT }
    ]

    let foundPool = null
    let poolInfo = null

    for (const p of poolsToCheck) {
        const poolPDA = getPoolPDA(p.name, program.programId)
        const custodyPDA = getCustodyPDA(poolPDA, WSOL_MINT, program.programId)
        const od = getOptionDetailPDA(publicKey, optionIndex, poolPDA, custodyPDA, program.programId)

        const exists = await program.account.OptionDetail.fetch(od).catch(() => null)
        if (exists) {
            foundPool = poolPDA
            poolInfo = p
            break
        }
    }

    if (!foundPool || !poolInfo) return false

    const pool = foundPool
    const custodyToken = poolInfo.mint
    const custody = getCustodyPDA(pool, WSOL_MINT, program.programId)
    const payCustodyTokenAccount = getCustodyTokenAccountPDA(pool, WSOL_MINT, program.programId)
    const optionDetail = getOptionDetailPDA(publicKey, optionIndex, pool, custody, program.programId)

    const optionDetailData = await program.account.OptionDetail.fetch(optionDetail)
    const fundingAccount = getAssociatedTokenAddressSync(
        optionDetailData.premium_asset.equals(custody) ? WSOL_MINT : custodyToken,
        publicKey
    )

    const transaction = await program.methods
        .close_option({
            optionIndex: new BN(optionIndex),
            poolName: poolInfo.name,
        })
        .accountsPartial({
            owner: publicKey,
            funding_account: fundingAccount,
            custody_mint: WSOL_MINT,
            pay_custody_mint: WSOL_MINT,
            pay_custody_token_account: payCustodyTokenAccount,
            option_detail: optionDetail,
            locked_custody: custody,
            pay_custody: custody,
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

export const claimOption = async (
    program: Program<OptionContract>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: any,
    optionIndex: number,
    solPrice: number
) => {
    const transaction = await program.methods
        .claim_option(new BN(optionIndex), solPrice)
        .accountsPartial({
            owner: publicKey,
            custody_mint: WSOL_MINT,
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
    sendTransaction: any,
    optionIndex: number
) => {
    const transaction = await program.methods
        .exercise_option(new BN(optionIndex))
        .accountsPartial({
            owner: publicKey,
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
    sendTransaction: any,
    params: {
        amount: number,
        asset: PublicKey,
        poolName: string
    }
) => {
    const { amount, asset, poolName } = params
    const pool = getPoolPDA(poolName, program.programId)
    const custodyPDA = getCustodyPDA(pool, asset, program.programId)
    const poolData = await program.account.Pool.fetch(pool)
    const custodyData = await program.account.Custody.fetch(custodyPDA)
    const fundingAccount = getAssociatedTokenAddressSync(asset, publicKey)

    let remainingAccounts = []
    for (const cPubkey of poolData.custodies) {
        const c = await program.account.Custody.fetch(cPubkey)
        remainingAccounts.push({ pubkey: cPubkey, isSigner: false, isWritable: true })
        remainingAccounts.push({ pubkey: c.oracle, isSigner: false, isWritable: true })
    }

    const transaction = await program.methods
        .add_liquidity({
            amountIn: new BN(amount),
            minLpAmountOut: new BN(1),
            poolName: poolName,
        })
        .accountsPartial({
            owner: publicKey,
            funding_account: fundingAccount,
            custody_mint: asset,
            custody_oracle_account: custodyData.oracle,
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
    sendTransaction: any,
    params: {
        amount: number,
        asset: PublicKey,
        poolName: string
    }
) => {
    const { amount, asset, poolName } = params
    const pool = getPoolPDA(poolName, program.programId)
    const poolData = await program.account.Pool.fetch(pool)
    const custodyPDA = getCustodyPDA(pool, asset, program.programId)
    const custodyData = await program.account.Custody.fetch(custodyPDA)

    const receivingAccount = getAssociatedTokenAddressSync(asset, publicKey)
    const contract = getContractPDA(program.programId)
    const transferAuthority = getTransferAuthorityPDA(program.programId)
    const custodyTokenAccount = getCustodyTokenAccountPDA(pool, asset, program.programId)
    const lpTokenMint = getLpTokenMintPDA(poolName, program.programId)
    const lpTokenAccount = getAssociatedTokenAddressSync(lpTokenMint, publicKey)

    let remainingAccounts = []
    for (const cPubkey of poolData.custodies) {
        const c = await program.account.Custody.fetch(cPubkey)
        remainingAccounts.push({ pubkey: cPubkey, isSigner: false, isWritable: true })
        remainingAccounts.push({ pubkey: c.oracle, isSigner: false, isWritable: true })
    }

    const transaction = await program.methods
        .remove_liquidity({
            lpAmountIn: new BN(amount),
            minAmountOut: new BN(0),
            poolName: poolName,
        })
        .accountsPartial({
            owner: publicKey,
            receiving_account: receivingAccount,
            transfer_authority: transferAuthority,
            contract: contract,
            pool: pool,
            custody: custodyPDA,
            custody_oracle_account: custodyData.oracle,
            custody_token_account: custodyTokenAccount,
            lp_token_mint: lpTokenMint,
            lp_token_account: lpTokenAccount,
            custody_mint: asset,
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

// =============================================================================
// AUCTION ACTIONS
// =============================================================================

export const initializeAuction = async (
    program: Program<any>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: any,
    batchId: BN,
    duration: BN
) => {
    // Placeholder - requires market key
    console.warn("initializeAuction: Market key handling not fully implemented in UI demo");
    return false;
}

export const submitAuctionOrder = async (
    program: Program<any>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: any,
    params: {
        batch: PublicKey,
        price: number,
        amount: number,
        isBid: boolean,
        tokenMint: PublicKey,
        userTokenAccount: PublicKey
    }
) => {
    const { batch, price, amount, isBid, tokenMint, userTokenAccount } = params;

    // Derive Vault PDA: [b"batch_vault", batch, mint]
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("batch_vault"), batch.toBuffer(), tokenMint.toBuffer()],
        program.programId
    );

    const transaction = await program.methods
        .submitAuctionOrder(
            new BN(price),
            new BN(amount),
            isBid
        )
        .accounts({
            batch: batch,
            userTokenAccount: userTokenAccount,
            vault: vaultPda,
            tokenMint: tokenMint,
            authority: publicKey,
            tokenProgram: require("@solana/spl-token").TOKEN_PROGRAM_ID,
            systemProgram: require("@solana/web3.js").SystemProgram.programId,
        })
        .transaction();

    const latestBlockHash = await connection.getLatestBlockhash()
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
    })
    return true
}

export const cancelAuctionOrder = async (
    program: Program<any>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: any,
    params: {
        batch: PublicKey,
        orderIndex: number,
        tokenMint: PublicKey,
        userTokenAccount: PublicKey
    }
) => {
    const { batch, orderIndex, tokenMint, userTokenAccount } = params;

    const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("batch_vault"), batch.toBuffer(), tokenMint.toBuffer()],
        program.programId
    );

    const transaction = await program.methods
        .cancelAuctionOrder(orderIndex)
        .accounts({
            batch: batch,
            userTokenAccount: userTokenAccount,
            vault: vaultPda,
            tokenMint: tokenMint,
            authority: publicKey,
            tokenProgram: require("@solana/spl-token").TOKEN_PROGRAM_ID,
        })
        .transaction();

    const latestBlockHash = await connection.getLatestBlockhash()
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
    })
    return true
}

export const executeSettlement = async (
    program: Program<any>,
    connection: Connection,
    publicKey: PublicKey,
    sendTransaction: any,
    params: {
        batch: PublicKey,
        bidIndex: number,
        askIndex: number,
        amount: number,
        buyerCurrency: PublicKey,
        sellerCurrency: PublicKey,
        sellerEnergy: PublicKey,
        buyerEnergy: PublicKey,
        currencyMint: PublicKey,
        energyMint: PublicKey,
        tokenProgram: PublicKey,
        buyerAuthority: PublicKey,
        sellerAuthority: PublicKey
    }
) => {
    const { batch, bidIndex, askIndex, amount, ...accounts } = params;

    if (!program.methods.executeSettlement) {
        console.error("IDL outdated: executeSettlement not found");
        return false;
    }

    const transaction = await program.methods
        .executeSettlement(
            bidIndex,
            askIndex,
            new BN(amount)
        )
        .accounts({
            batch: batch,
            ...accounts
        })
        .transaction();

    const latestBlockHash = await connection.getLatestBlockhash()
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
    })
    return true
}

// =============================================================================
// DASHBOARD ACTIONS
// =============================================================================

export const fetchMeterHistory = async (
    program: Program<any>,
    publicKey: PublicKey
) => {
    try {
        // Derive Meter History PDA using [b"meter_history", user_key]
        // Assuming the user IS the meter for MVP, or we can fetch a specific meter if known.
        // For Dashboard, we show the connected user's meter history.
        const [historyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("meter_history"), publicKey.toBuffer()],
            program.programId
        );

        const account = await program.account.meterHistory.fetch(historyPda);

        // Format for Recharts
        // Data in account: readings [u64; 24], timestamps [i64; 24], current_index u8
        // We need to unroll the circular buffer or just map them.
        // Simpler: Just map all non-zero entries and sort by timestamp.

        const data = account.readings
            .map((reading: any, index: number) => ({
                reading: reading.toNumber(),
                timestamp: account.timestamps[index].toNumber(),
            }))
            .filter((d: any) => d.timestamp > 0)
            .sort((a: any, b: any) => a.timestamp - b.timestamp)
            .map((d: any) => ({
                time: new Date(d.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                value: d.reading // Cumulative, maybe we want delta? For now show cumulative.
            }));

        return data;

    } catch (e) {
        console.warn("fetchMeterHistory failed:", e);
        return [];
    }
}
