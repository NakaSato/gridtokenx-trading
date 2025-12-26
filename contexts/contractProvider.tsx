'use client'

import { getPythPrice, usePythPrice } from '@/hooks/usePythPrice'
import { Connection, PublicKey } from '@solana/web3.js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react'
import {
  AnchorProvider,
  BN,
  getProvider,
  Program,
  Provider,
} from '@coral-xyz/anchor'
import { Position } from '@/lib/data/Positions'
import { formatDate, Transaction } from '@/lib/data/WalletActivity'
import { coins } from '@/lib/data/coins'
import { format } from 'date-fns'
import { OptionContract } from '@/lib/idl/option_contract'
import * as idl from '../lib/idl/option_contract.json'
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import {
  THB_DECIMALS,
  THB_MINT,
  THB_ORACLE,
  USDC_DECIMALS,
  USDC_MINT,
  USDC_ORACLE,
  WSOL_DECIMALS,
  WSOL_MINT,
  WSOL_ORACLE,
  clusterUrl,
  connection,
} from '@/utils/const'

interface ContractContextType {
  program: Program<OptionContract> | undefined
  pub: PublicKey | undefined
  getCustodies: Function
  getDetailInfos: Function
  onOpenOption: Function
  onCloseOption: Function
  onClaimOption: Function
  onExerciseOption: Function
  onAddLiquidity: Function
  onRemoveLiquidity: Function
  getOptionDetailAccount: Function
}

export const ContractContext = createContext<ContractContextType>({
  program: undefined,
  pub: undefined,
  getCustodies: () => { },
  getDetailInfos: () => { },
  onOpenOption: async () => { },
  onCloseOption: () => { },
  onClaimOption: () => { },
  onExerciseOption: () => { },
  onAddLiquidity: () => { },
  onRemoveLiquidity: () => { },
  getOptionDetailAccount: () => { },
})

export type ExpiredOption = {
  index: any
  token: any
  transaction: any
  strikePrice: any
  qty: any
  expiryPrice: any
  tokenAmount: any
  dollarAmount: any
  iconPath: any
}

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { priceData } = usePythPrice('Crypto.SOL/USD')
  const { connected, publicKey, sendTransaction } = useWallet()
  const wallet = useAnchorWallet()
  const [program, setProgram] = useState<Program<OptionContract>>()
  const [pub, setPubKey] = useState<PublicKey>()
  const getOptionDetailAccount = (
    index: number,
    pool: PublicKey,
    custody: PublicKey
  ) => {
    if (connected && publicKey != null && program && wallet != undefined) {
      const [optionDetail] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('option'),
          wallet.publicKey.toBuffer(),
          new BN(index).toArrayLike(Buffer, 'le', 8),
          pool.toBuffer(),
          custody.toBuffer(),
        ],
        program.programId
      )
      return optionDetail
    }
  }

  const getCustodies = async (program: Program<OptionContract>) => {
    if (
      connected &&
      publicKey != null &&
      program &&
      program.account &&
      program.programId
    ) {
      try {
        const [pool] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), Buffer.from('SOL-THB')],
          program.programId
        )
        const custodies = new Map<string, any>()
        const ratios = new Map<string, any>()
        const poolData = await program.account.Pool.fetch(pool)
        for await (let custody of poolData.custodies) {
          let c = await program.account.Custody.fetch(new PublicKey(custody))
          let mint = c.mint
          custodies.set(mint.toBase58(), c)
          ratios.set(
            mint.toBase58(),
            poolData.ratios[
            poolData.custodies.findIndex((e) => e.equals(custody))
            ]
          )
        }
        return [custodies, ratios]
      } catch (error) {
        console.error('Error fetching custodies:', error)
        return [new Map(), new Map()]
      }
    }
    return [new Map(), new Map()]
  }

  const getDetailInfos = async (
    program: Program<OptionContract>,
    publicKey: PublicKey
  ) => {
    // Check if program and required properties exist
    if (!program || !program.account || !program.programId || !publicKey) {
      return [[], [], []]
    }

    // Additional check for User account type
    if (!program.account.User) {
      return [[], [], []]
    }

    const pinfo = []
    const expiredpinfo = []
    const doneInfo = []

    // Check user account
    const [userPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), publicKey.toBuffer()],
      program.programId
    )
    const userInfo = await program.account.User.fetch(userPDA).catch((e) => {
      return null
    })

    if (!userInfo) return [[], [], []]
    const optionIndex = userInfo.option_index.toNumber()

    if (optionIndex == 0) return [[], [], []]

    // Iterate over all possible pools
    const poolsToCheck = [
      { name: 'SOL-USDC', oracle: USDC_ORACLE, decimals: USDC_DECIMALS, token: 'USDC' },
      { name: 'SOL-THB', oracle: THB_ORACLE, decimals: THB_DECIMALS, token: 'THB' }
    ];

    for (let i = 1; i <= optionIndex; i++) {
      let optionFound = false;
      for (const poolInfo of poolsToCheck) {
        if (optionFound) break; // Optimization: stop checking pools if found

        try {
          const [poolAddress] = PublicKey.findProgramAddressSync(
            [Buffer.from('pool'), Buffer.from(poolInfo.name)],
            program.programId
          )
          const [custodyAddress] = PublicKey.findProgramAddressSync(
            [Buffer.from('custody'), poolAddress.toBuffer(), WSOL_MINT.toBuffer()],
            program.programId
          )

          const optionDetailAccount = getOptionDetailAccount(i, poolAddress, custodyAddress)
          if (!optionDetailAccount) continue

          // Fetch explicitly to check existence
          const detail = await program.account.OptionDetail.fetch(optionDetailAccount).catch(() => null)
          if (!detail) continue

          optionFound = true;

          const pnl =
            priceData.price && detail.strike_price
              ? priceData.price - detail.strike_price
              : 0

          if (
            detail?.expired_date.toNumber() > Math.round(Date.now() / 1000) &&
            detail?.valid
          ) {
            pinfo.push({
              index: detail?.index.toNumber(),
              token: detail?.locked_asset.equals(custodyAddress) ? 'SOL' : poolInfo.token,
              logo: '/images/solana.png',
              symbol: 'SOL',
              strikePrice: detail?.strike_price ?? 0,
              type: detail?.locked_asset.equals(custodyAddress) ? 'Call' : 'Put',
              expiry: new Date(detail?.expired_date.toNumber() * 1000).toString(),
              size: detail?.locked_asset.equals(custodyAddress)
                ? detail.amount.toNumber() / 10 ** WSOL_DECIMALS
                : detail.amount.toNumber() / 10 ** poolInfo.decimals,
              pnl: pnl,
              greeks: {
                delta: 0.6821,
                gamma: 0.0415,
                theta: -0.2113,
                vega: 0.0619,
              },
            })
          } else if (
            detail?.expired_date.toNumber() < Math.round(Date.now() / 1000) &&
            detail?.valid
          ) {
            const expiryPrice = await getPythPrice(
              'Crypto.SOL/USD',
              detail?.expired_date.toNumber()
            )
            expiredpinfo.push({
              index: detail?.index.toNumber() ?? 1,
              token: detail?.locked_asset.equals(custodyAddress) ? 'SOL' : poolInfo.token,
              iconPath: '/images/solana.png',
              symbol: 'SOL',
              strikePrice: detail?.strike_price ?? 0,
              qty: 100,
              expiryPrice: expiryPrice!,
              transaction: detail?.locked_asset.equals(custodyAddress) ? 'Call' : 'Put',
              tokenAmount: detail?.locked_asset.equals(custodyAddress)
                ? detail.amount.toNumber() / 10 ** WSOL_DECIMALS
                : detail.amount.toNumber() / 10 ** poolInfo.decimals,
              dollarAmount: detail?.locked_asset.equals(custodyAddress)
                ? detail.profit * (expiryPrice ?? 1)
                : detail.profit,
            })
          } else {
            doneInfo.push({
              transactionID: `SOL-${formatDate(
                new Date(detail.exercised * 1000)
              )}-${detail.strike_price}-${detail?.locked_asset.equals(custodyAddress) ? 'C' : 'P'
                }`,
              token: coins[0],
              transactionType: detail?.locked_asset.equals(custodyAddress)
                ? 'Call'
                : 'Put',
              optionType: 'American',
              strikePrice: detail.strike_price,
              expiry: format(new Date(detail.exercised), 'dd MMM, yyyy HH:mm:ss'),
            })
          }

        } catch (e) {
          console.log("Error checking pool", poolInfo.name, e);
          continue;
        }
      }
    }
    return [pinfo, expiredpinfo, doneInfo]
  }

  const onOpenOption = async (
    amount: number,
    strike: number,
    period: number,
    expiredTime: number,
    isCall: boolean,
    paySol: boolean,
    quoteToken: 'USDC' | 'THB' = 'THB'
  ) => {
    // try {
    if (!program || !publicKey || !connected || !wallet) return false

    const poolName = quoteToken === 'USDC' ? 'SOL-USDC' : 'SOL-THB';
    const quoteMint = quoteToken === 'USDC' ? USDC_MINT : THB_MINT;
    const quoteOracle = quoteToken === 'USDC' ? USDC_ORACLE : THB_ORACLE;

    const [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool'), Buffer.from(poolName)],
      program.programId
    )
    const [custody] = PublicKey.findProgramAddressSync(
      [Buffer.from('custody'), pool.toBuffer(), WSOL_MINT.toBuffer()],
      program.programId
    )
    const [userPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), publicKey.toBuffer()],
      program.programId
    )
    let optionIndex
    try {
      const userInfo = await program.account.User.fetch(userPDA)
      optionIndex = userInfo.option_index.toNumber() + 1
    } catch {
      optionIndex = 1
    }

    const optionDetailAccount = getOptionDetailAccount(
      optionIndex,
      pool,
      custody
    )

    if (!optionDetailAccount) return false
    const fundingAccount = getAssociatedTokenAddressSync(
      paySol ? WSOL_MINT : quoteMint,
      wallet.publicKey
    )

    const [paycustody] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('custody'),
        pool.toBuffer(),
        paySol ? WSOL_MINT.toBuffer() : quoteMint.toBuffer(), // paySol ? SOL : Quote
      ],
      program.programId
    )

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
        custody_oracle_account: new PublicKey(
          'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix'
        ),
        pay_custody_oracle_account: paySol
          ? new PublicKey('J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix')
          : quoteOracle,
        locked_custody_mint: isCall ? WSOL_MINT : quoteMint,
        option_detail: optionDetailAccount,
        pay_custody_token_account: paycustodyData.token_account,
      })
      .transaction()
    const latestBlockHash = await connection.getLatestBlockhash()
    // transaction.feePayer = publicKey;
    // let result = await connection.simulateTransaction(transaction);
    // console.log("result", result);
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    })
    return true
    // } catch (e) {
    //   console.log("error", e);
    //   return false;
    // }
  }

  const onCloseOption = async (optionIndex: number) => {
    try {
      if (!program || !publicKey || !connected || !wallet) return

      const poolsToCheck = [
        { name: 'SOL-USDC', oracle: USDC_ORACLE, decimals: USDC_DECIMALS, token: 'USDC', mint: USDC_MINT },
        { name: 'SOL-THB', oracle: THB_ORACLE, decimals: THB_DECIMALS, token: 'THB', mint: THB_MINT }
      ];

      let foundPool = null;
      let poolInfo = null;

      for (const p of poolsToCheck) {
        const [pAddress] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), Buffer.from(p.name)],
          program.programId
        )
        const [cAddress] = PublicKey.findProgramAddressSync(
          [Buffer.from('custody'), pAddress.toBuffer(), WSOL_MINT.toBuffer()],
          program.programId
        )
        // Check if option detail exists for this pool
        const od = getOptionDetailAccount(optionIndex, pAddress, cAddress)
        if (od) {
          const exists = await program.account.OptionDetail.fetch(od).catch(() => null)
          if (exists) {
            foundPool = pAddress;
            poolInfo = p;
            break;
          }
        }
      }

      if (!foundPool || !poolInfo) {
        console.log("Pool not found for option index", optionIndex);
        return;
      }

      const pool = foundPool;
      const custodyToken = poolInfo.mint; // Use mint from discovered pool

      const [custody] = PublicKey.findProgramAddressSync(
        [Buffer.from('custody'), pool.toBuffer(), WSOL_MINT.toBuffer()],
        program.programId
      )
      const [lockedCustody] = PublicKey.findProgramAddressSync(
        [Buffer.from('custody'), pool.toBuffer(), WSOL_MINT.toBuffer()],
        program.programId
      )
      const [payCustody] = PublicKey.findProgramAddressSync(
        [Buffer.from('custody'), pool.toBuffer(), WSOL_MINT.toBuffer()],
        program.programId
      )
      const [payCustodyTokenAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('custody_token_account'),
          pool.toBuffer(),
          WSOL_MINT.toBuffer(),
        ],
        program.programId
      )

      const [wsolCustody] = PublicKey.findProgramAddressSync(
        [Buffer.from('custody'), pool.toBuffer(), WSOL_MINT.toBuffer()],
        program.programId
      )
      const [optionDetail] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('option'),
          publicKey.toBuffer(),
          new BN(optionIndex).toArrayLike(Buffer, 'le', 8),
          pool.toBuffer(),
          wsolCustody.toBuffer(),
        ],
        program.programId
      )

      const optionDetailAccount = getOptionDetailAccount(
        optionIndex,
        pool,
        custody
      )
      if (!optionDetailAccount) return
      const optionDetailAccountData =
        await program.account.OptionDetail.fetch(optionDetailAccount)

      const fundingAccount = getAssociatedTokenAddressSync(
        optionDetailAccountData.premium_asset.equals(custody)
          ? WSOL_MINT
          : custodyToken, // Dynamic token
        wallet.publicKey
      )

      const transaction = await program.methods
        .close_option({
          optionIndex: new BN(optionIndex),
          poolName: poolInfo.name, // Dynamic name
        })
        .accountsPartial({
          owner: publicKey,
          funding_account: fundingAccount,
          custody_mint: WSOL_MINT,
          pay_custody_mint: WSOL_MINT,
          pay_custody_token_account: payCustodyTokenAccount,
          option_detail: optionDetail,
          locked_custody: lockedCustody,
          pay_custody: payCustody,
        })
        .transaction()

      const latestBlockHash = await connection.getLatestBlockhash()
      // transaction.feePayer = publicKey;
      // let result = await connection.simulateTransaction(transaction);
      // console.log("result", result);
      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
      })
      return true
    } catch (e) {
      console.log('Error', e)
      return false
    }
  }

  const onClaimOption = async (optionIndex: number, solPrice: number) => {
    try {
      if (!program || !publicKey || !connected || !wallet) return

      // Find pool
      let foundPool = null;
      const poolsToCheck = ['SOL-USDC', 'SOL-THB'];

      for (const pName of poolsToCheck) {
        const [pAddress] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), Buffer.from(pName)],
          program.programId
        )
        const [cAddress] = PublicKey.findProgramAddressSync(
          [Buffer.from('custody'), pAddress.toBuffer(), WSOL_MINT.toBuffer()],
          program.programId
        )
        const od = getOptionDetailAccount(optionIndex, pAddress, cAddress)
        if (od) {
          const exists = await program.account.OptionDetail.fetch(od).catch(() => null)
          if (exists) {
            foundPool = pAddress;
            break;
          }
        }
      }

      if (!foundPool) return;
      const pool = foundPool;

      const [custody] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('custody_token_account'),
          pool.toBuffer(),
          WSOL_MINT.toBuffer(),
        ],
        program.programId
      )
      const optionDetailAccount = getOptionDetailAccount(
        optionIndex,
        pool, // Use found pool
        // Note: getOptionDetailAccount helper requires custody PDA, but looks like logic above lines 466-471 in original file calculated 'custody' as a Token Account?
        // Wait. Line 466 original: PublicKey.findProgramAddressSync(['custody_token_account' ...]) -> That's a token account!
        // But getOptionDetailAccount (line 89) uses it as a seed. 
        // Checking Line 101: custody.toBuffer(). 
        // Seed usually is the Custody Account PDA, not Custody Token Account PDA.
        // ORIGINAL CODE BUG?
        // Line 466 calculates 'custody' using 'custody_token_account' seed.
        // Line 477 passes this 'custody' to `getOptionDetailAccount`.
        // `getOptionDetailAccount` (lines 89-107) uses `custody.toBuffer()` as seed.
        // If the seed expects Custody Account, passing Custody Token Account is wrong unless that IS the seed.
        // Reviewing onOpenOption: Line 303 uses 'custody' seed.
        // Reviewing onCloseOption: Line 373 uses 'custody' seed.
        // Reviewing onClaimOption (original): Line 466 uses 'custody_token_account' seed? 
        // This looks like a bug in the original code or I am misinterpreting. 
        // However, I should preserve existing behavior for `custody` calculation if it works, BUT correct the `pool` part.

        // Actually, looking at `getDetailInfos` (Line 166), it uses 'custody' seed.
        // `onClaimOption` (Line 466) uses 'custody_token_account'.
        // If `getOptionDetailAccount` is consistent, one of these is wrong.
        // But I will stick to fixing the POOL logic.

        // Wait, `getOptionDetailAccount` uses `custody` arg as a seed. 
        // If `onOpenOption` uses `custody` PDA, and `onClaimOption` uses `custody_token_account` PDA, 
        // then they generate DIFFERENT OptionDetail PDAs? That would be broken.
        // I suspect `onClaimOption` in original code might be bugged or using a different specific logic.
        // Let's look closer at `onClaimOption`.
        // It passes `custody` to `getOptionDetailAccount`. 

        // I will implement safe pool finding using the standard 'custody' PDA first to find the option.
        // Then re-calculate the `custody` variable as per original `onClaimOption` logic (which seems to be the Token Account) if needed for later lines?
        // No, `onClaimOption` passed it to `getOptionDetailAccount`. If that function uses it as a seed, it MUST match creation.
        // Creation used `custody` PDA (Line 303 in original).
        // So `onClaimOption` using `custody_token_account` (Line 466 original) seems WRONG if `getOptionDetailAccount` logic is constant.
        // Unles `getOptionDetailAccount` implementation changes or `custody` arg is different?
        // Lines 89-107: `getOptionDetailAccount` is simple.

        // I will use standard Custody PDA to FIND the pool.
        // Then I will define the `custody` variable as required by the rest of the function?
        // Actually, I should probably use the correct seed 'custody' to find the PDA.

        // Let's assume standard 'custody' PDA is correct for finding the option.
        PublicKey.findProgramAddressSync([Buffer.from('custody'), pool.toBuffer(), WSOL_MINT.toBuffer()], program.programId)[0]
        // This is what I used in the loop.
      )

      // Now I need to reconstruct the `custody` variable that `onClaimOption` expects.
      // Original: `custody` = PDA('custody_token_account', pool, WSOL_MINT).
      // And it passes THAT to `getOptionDetailAccount`.
      // IF the original code was working, then `getOptionDetailAccount` was called with TokenAccount address as seed?
      // But `onOpenOption` calls it with Custody Account address.
      // This implies `onClaimOption` might be broken or I am misreading.
      // I will assume I should use the correct derived addresses.

      // NOTE: For now, I will replicate the original logic's variable `custody` but using the FOUND pool.
      // If the original logic was passing TokenAccount to `getOptionDetailAccount`, I will do the same for the found pool, to minimize regression risk if there's some weird logic.
      // BUT the loop needs to find the option. The option is at a specific address. 
      // If I use the wrong seed in the loop, I won't find it.
      // I will assume the options were created with 'custody' (Account) seed (from onOpenOption).
      // So my loop search is correct.

      // After loop, I need to call `claim_option` instruction.
      // It takes `optionIndex`.
      // It seems `onClaimOption` doesn't pass `optionDetailAccount` to the instruction accounts?
      // It does not! `.accountsPartial({ owner, custody_mint })`.
      // So the `getOptionDetailAccount` call in `onClaimOption` is ONLY to check existence?
      // Yes.

      // So:
      // 1. Loop to find pool (using standard custody seed).
      // 2. Once found, use that pool to set up transaction.
      // 3. Original code calculated `custody` as token account, but only used it for checking existence (incorrectly?). 
      // I will ignore the weird `custody` calculation for checking existence and just use the one that worked in the loop.

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
    } catch (e) {
      console.log('Error', e)
      return false
    }
  }

  const onExerciseOption = async (optionIndex: number) => {
    if (!program || !optionIndex || !publicKey || !connected || !wallet) return

    // Determine which pool this option belongs to
    let foundPool = null;
    const poolsToCheck = ['SOL-USDC', 'SOL-THB'];

    for (const pName of poolsToCheck) {
      const [pAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool'), Buffer.from(pName)],
        program.programId
      )
      const [cAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from('custody'), pAddress.toBuffer(), WSOL_MINT.toBuffer()],
        program.programId
      )
      const od = getOptionDetailAccount(optionIndex, pAddress, cAddress)
      if (od) {
        const exists = await program.account.OptionDetail.fetch(od).catch(() => null)
        if (exists) {
          foundPool = pAddress;
          break;
        }
      }
    }

    if (!foundPool) return;
    const pool = foundPool;

    const transaction = await program.methods
      .exercise_option(new BN(optionIndex))
      .accountsPartial({
        owner: publicKey,
      })
      .transaction()
    const latestBlockHash = await connection.getLatestBlockhash()
    // transaction.feePayer = publicKey;
    // let result = await connection.simulateTransaction(transaction);
    //   console.log("result", result)
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    })
    return true
  }

  const onAddLiquidity = async (
    amount: number,
    program: Program<OptionContract>,
    asset: PublicKey,
    poolName: string
  ) => {
    try {
      if (!program || !publicKey) return
      if (!wallet) return

      const [pool] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool'), Buffer.from(poolName)],
        program.programId
      )
      const [custody] = PublicKey.findProgramAddressSync(
        [Buffer.from('custody'), pool.toBuffer(), asset.toBuffer()],
        program.programId
      )
      const poolData = await program.account.Pool.fetch(pool)
      const custodyData = await program.account.Custody.fetch(custody)
      const fundingAccount = getAssociatedTokenAddressSync(
        asset,
        wallet.publicKey
      )
      let custodies = []
      let oracles = []
      for await (let custody of poolData.custodies) {
        let c = await program.account.Custody.fetch(new PublicKey(custody))
        let ora = c.oracle
        custodies.push({ pubkey: custody, isSigner: false, isWritable: true })
        oracles.push({ pubkey: ora, isSigner: false, isWritable: true })
      }

      const remainingAccounts = custodies.concat(oracles)

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
      // transaction.feePayer = publicKey;
      // let result = await connection.simulateTransaction(transaction);
      // console.log("result", result);
      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
      })
      return true
    } catch (e) {
      console.log('Error', e)
      return false
    }
  }

  const onRemoveLiquidity = async (
    amount: number,
    program: Program<OptionContract>,
    asset: PublicKey,
    poolName: string
  ) => {
    try {
      if (!program || !publicKey) return
      if (!wallet) return

      const [pool] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool'), Buffer.from(poolName)],
        program.programId
      )
      const [custody] = PublicKey.findProgramAddressSync(
        [Buffer.from('custody'), pool.toBuffer(), asset.toBuffer()],
        program.programId
      )
      const poolData = await program.account.Pool.fetch(pool)

      const custodyData = await program.account.Custody.fetch(custody)
      const receivingAccount = getAssociatedTokenAddressSync(
        asset,
        wallet.publicKey
      )
      let custodies = []
      let oracles = []
      for await (let custody of poolData.custodies) {
        let c = await program.account.Custody.fetch(new PublicKey(custody))
        let ora = c.oracle
        custodies.push({ pubkey: custody, isSigner: false, isWritable: true })
        oracles.push({ pubkey: ora, isSigner: false, isWritable: true })
      }
      const [poolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool'), Buffer.from(poolName)],
        program.programId
      )
      const [contract] = PublicKey.findProgramAddressSync(
        [Buffer.from('contract')],
        program.programId
      )
      const [transferAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from('transfer_authority')],
        program.programId
      )
      const [CustodyPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('custody'), pool.toBuffer(), asset.toBuffer()],
        program.programId
      )
      const [custodyTokenAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('custody_token_account'),
          pool.toBuffer(),
          asset.toBuffer(),
        ],
        program.programId
      )
      const [lpTokenMint] = PublicKey.findProgramAddressSync(
        [Buffer.from('lp_token_mint'), Buffer.from(poolName)],
        program.programId
      )
      const lpTokenAccount = getAssociatedTokenAddressSync(
        lpTokenMint,
        wallet.publicKey
      )
      const remainingAccounts = custodies.concat(oracles)

      const transaction = await program.methods
        .remove_liquidity({
          lpAmountIn: new BN(amount),
          minAmountOut: new BN(0),
          poolName: 'SOL-THB',
        })
        .accountsPartial({
          owner: publicKey,
          receiving_account: receivingAccount,
          transfer_authority: transferAuthority,
          contract: contract,
          pool: poolPDA,
          custody: CustodyPDA,
          custody_oracle_account: WSOL_ORACLE,
          custody_token_account: custodyTokenAccount,
          lp_token_mint: lpTokenMint,
          lp_token_account: lpTokenAccount,
          custody_mint: asset,
          token_program: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .transaction()
      const latestBlockHash = await connection.getLatestBlockhash()
      // transaction.feePayer = publicKey;
      // let result = await connection.simulateTransaction(transaction);
      // console.log("result", result);
      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
      })
      return true
    } catch (e) {
      console.log('Error', e)
      return false
    }
  }

  useEffect(() => {
    ; (async () => {
      let provider: Provider
      if (wallet && publicKey) {
        try {
          provider = getProvider()
        } catch {
          provider = new AnchorProvider(connection, wallet, {})
        }

        const program = new Program<OptionContract>(
          idl as OptionContract,
          provider
        )
        setProgram(program)
        setPubKey(publicKey)
      }
    })()
  }, [wallet])

  return (
    <ContractContext.Provider
      value={{
        program,
        pub,
        getCustodies,
        getDetailInfos,
        onOpenOption,
        onCloseOption,
        onClaimOption,
        onExerciseOption,
        onAddLiquidity,
        onRemoveLiquidity,
        getOptionDetailAccount,
      }}
    >
      {children}
    </ContractContext.Provider>
  )
}
