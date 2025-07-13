"use client";

import { getPythPrice, usePythPrice } from "@/hooks/usePythPrice";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import {
  AnchorProvider,
  BN,
  getProvider,
  Program,
  Provider,
} from "@coral-xyz/anchor";
import { Position } from "@/lib/data/Positions";
import { formatDate, Transaction } from "@/lib/data/WalletActivity";
import { coins } from "@/lib/data/coins";
import { format } from "date-fns";
import { OptionContract } from "@/lib/idl/option_contract";
import * as idl from "../lib/idl/option_contract.json";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  USDC_DECIMALS,
  USDC_MINT,
  USDC_ORACLE,
  WSOL_DECIMALS,
  WSOL_MINT,
  WSOL_ORACLE,
} from "@/utils/const";

interface ContractContextType {
  program: Program<OptionContract> | undefined;
  pub: PublicKey | undefined;
  getCustodies: Function;
  getDetailInfos: Function;
  onOpenOption: Function;
  onCloseOption: Function;
  onClaimOption: Function;
  onExerciseOption: Function;
  onAddLiquidity: Function;
  onRemoveLiquidity: Function;
  getOptionDetailAccount: Function;
}

export const ContractContext = createContext<ContractContextType>({
  program: undefined,
  pub: undefined,
  getCustodies: () => {},
  getDetailInfos: () => {},
  onOpenOption: async () => {},
  onCloseOption: () => {},
  onClaimOption: () => {},
  onExerciseOption: () => {},
  onAddLiquidity: () => {},
  onRemoveLiquidity: () => {},
  getOptionDetailAccount: () => {},
});

export const clusterUrl = "https://api.devnet.solana.com";
export const connection = new Connection(clusterUrl, "confirmed");
export type ExpiredOption = {
  index: any;
  token: any;
  transaction: any;
  strikePrice: any;
  qty: any;
  expiryPrice: any;
  tokenAmount: any;
  dollarAmount: any;
  iconPath: any;
};

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { priceData } = usePythPrice("Crypto.SOL/USD");
  const { connected, publicKey, sendTransaction } = useWallet();
  const wallet = useAnchorWallet();
  const [program, setProgram] = useState<Program<OptionContract>>();
  const [pub, setPubKey] = useState<PublicKey>();
  const getOptionDetailAccount = (
    index: number,
    pool: PublicKey,
    custody: PublicKey
  ) => {
    if (connected && publicKey != null && program && wallet != undefined) {
      const [optionDetail] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("option"),
          wallet.publicKey.toBuffer(),
          new BN(index).toArrayLike(Buffer, "le", 8),
          pool.toBuffer(),
          custody.toBuffer(),
        ],
        program.programId
      );
      return optionDetail;
    }
  };

  const getCustodies = async (program: Program<OptionContract>) => {
    if (connected && publicKey != null && program) {
      const [pool] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), Buffer.from("SOL-USDC")],
        program.programId
      );
      const custodies = new Map<string, any>();
      const ratios = new Map<string, any>();
      const poolData = await program.account.Pool.fetch(pool);
      for await (let custody of poolData.custodies) {
        let c = await program.account.Custody.fetch(new PublicKey(custody));
        let mint = c.mint;
        custodies.set(mint.toBase58(), c);
        ratios.set(
          mint.toBase58(),
          poolData.ratios[
            poolData.custodies.findIndex((e) => e.equals(custody))
          ]
        );
      }
      return [custodies, ratios];
    }
  };

  const getDetailInfos = async (
    program: Program<OptionContract>,
    publicKey: PublicKey
  ) => {
    const pinfo = [];
    const expiredpinfo = [];
    const doneInfo = [];
    const [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), Buffer.from("SOL-USDC")],
      program.programId
    );
    const [custody] = PublicKey.findProgramAddressSync(
      [Buffer.from("custody"), pool.toBuffer(), WSOL_MINT.toBuffer()],
      program.programId
    );
    const [userPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), publicKey.toBuffer()],
      program.programId
    );
    const userInfo = await program.account.User.fetch(userPDA).catch((e) => {
      return null;
    });
    if (!userInfo) return [[], [], []];
    const optionIndex = userInfo.option_index.toNumber();

    if (optionIndex == 0) return [[], [], []];
    for (let i = 1; i <= optionIndex; i++) {
      try {
        const optionDetailAccount = getOptionDetailAccount(i, pool, custody);
        if (!optionDetailAccount) continue;
        const detail = await program.account.OptionDetail.fetch(
          optionDetailAccount
        );
        if (!detail) continue;
        const pnl =
          priceData.price && detail.strike_price
            ? priceData.price - detail.strike_price
            : 0;
        if (
          detail?.expired_date.toNumber() > Math.round(Date.now() / 1000) &&
          detail?.valid
        ) {
          pinfo.push({
            index: detail?.index.toNumber(),
            token: detail?.locked_asset.equals(custody) ? "SOL" : "USDC",
            logo: "/images/solana.png",
            symbol: "SOL",
            strikePrice: detail?.strike_price ?? 0,
            type: detail?.locked_asset.equals(custody) ? "Call" : "Put",
            expiry: new Date(detail?.expired_date.toNumber() * 1000).toString(),
            size: detail?.locked_asset.equals(custody)
              ? detail.amount.toNumber() / 10 ** WSOL_DECIMALS
              : detail.amount.toNumber() / 10 ** USDC_DECIMALS,
            pnl: pnl,
            greeks: {
              delta: 0.6821,
              gamma: 0.0415,
              theta: -0.2113,
              vega: 0.0619,
            },
          });
        } else if (
          detail?.expired_date.toNumber() < Math.round(Date.now() / 1000) &&
          detail?.valid
        ) {
          const expiryPrice = await getPythPrice(
            "Crypto.SOL/USD",
            detail?.expired_date.toNumber()
          );
          expiredpinfo.push({
            index: detail?.index.toNumber() ?? 1,
            token: detail?.locked_asset.equals(custody) ? "SOL" : "USDC",
            iconPath: "/images/solana.png",
            symbol: "SOL",
            strikePrice: detail?.strike_price ?? 0,
            qty: 100,
            expiryPrice: expiryPrice!,
            transaction: detail?.locked_asset.equals(custody) ? "Call" : "Put",
            tokenAmount: detail?.locked_asset.equals(custody)
              ? detail.amount.toNumber() / 10 ** WSOL_DECIMALS
              : detail.amount.toNumber() / 10 ** USDC_DECIMALS,
            dollarAmount: detail?.locked_asset.equals(custody)
              ? detail.profit * (expiryPrice ?? 1)
              : detail.profit,
          });
        } else {
          doneInfo.push({
            transactionID: `SOL-${formatDate(
              new Date(detail.exercised * 1000)
            )}-${detail.strike_price}-${
              detail?.locked_asset.equals(custody) ? "C" : "P"
            }`,
            token: coins[0],
            transactionType: detail?.locked_asset.equals(custody)
              ? "Call"
              : "Put",
            optionType: "American",
            strikePrice: detail.strike_price,
            expiry: format(new Date(detail.exercised), "dd MMM, yyyy HH:mm:ss"),
          });
        }
      } catch (e) {
        console.log(e);
        continue;
      }
    }
    return [pinfo, expiredpinfo, doneInfo];
  };

  const onOpenOption = async (
    amount: number,
    strike: number,
    period: number,
    expiredTime: number,
    isCall: boolean,
    paySol: boolean
  ) => {
    // try {
    if (!program || !publicKey || !connected || !wallet) return false;
    const [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), Buffer.from("SOL-USDC")],
      program.programId
    );
    const [custody] = PublicKey.findProgramAddressSync(
      [Buffer.from("custody"), pool.toBuffer(), WSOL_MINT.toBuffer()],
      program.programId
    );
    const [userPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), publicKey.toBuffer()],
      program.programId
    );
    let optionIndex;
    try {
      const userInfo = await program.account.User.fetch(userPDA);
      optionIndex = userInfo.option_index.toNumber() + 1;
    } catch {
      optionIndex = 1;
    }

    const optionDetailAccount = getOptionDetailAccount(
      optionIndex,
      pool,
      custody
    );

    if (!optionDetailAccount) return false;
    const fundingAccount = getAssociatedTokenAddressSync(
      paySol ? WSOL_MINT : USDC_MINT,
      wallet.publicKey
    );

    const [paycustody] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("custody"),
        pool.toBuffer(),
        paySol ? WSOL_MINT.toBuffer() : USDC_MINT.toBuffer(),
      ],
      program.programId
    );

    const paycustodyData = await program.account.Custody.fetch(paycustody);

    const transaction = await program.methods
      .open_option({
        amount: new BN(amount),
        strike: strike,
        period: new BN(period),
        expiredTime: new BN(expiredTime),
        poolName: "SOL-USDC",
      })
      .accountsPartial({
        owner: publicKey,
        funding_account: fundingAccount,
        custody_mint: WSOL_MINT,
        pay_custody_mint: paySol ? WSOL_MINT : USDC_MINT,
        custody_oracle_account: new PublicKey(
          "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"
        ),
        pay_custody_oracle_account: paySol
          ? new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix")
          : new PublicKey("5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"),
        locked_custody_mint: isCall ? WSOL_MINT : USDC_MINT,
        option_detail: optionDetailAccount,
        pay_custody_token_account: paycustodyData.token_account,
      })
      .transaction();
    const latestBlockHash = await connection.getLatestBlockhash();
    // transaction.feePayer = publicKey;
    // let result = await connection.simulateTransaction(transaction);
    // console.log("result", result);
    const signature = await sendTransaction(transaction, connection);
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    });
    return true;
    // } catch (e) {
    //   console.log("error", e);
    //   return false;
    // }
  };

  const onCloseOption = async (optionIndex: number) => {
    try {
      if (!program || !publicKey || !connected || !wallet) return;
      const [pool] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), Buffer.from("SOL-USDC")],
        program.programId
      );
      const [custody] = PublicKey.findProgramAddressSync(
        [Buffer.from("custody"), pool.toBuffer(), WSOL_MINT.toBuffer()],
        program.programId
      );
      const [lockedCustody] = PublicKey.findProgramAddressSync(
        [Buffer.from("custody"), pool.toBuffer(), WSOL_MINT.toBuffer()],
        program.programId
      );
      const [payCustody] = PublicKey.findProgramAddressSync(
        [Buffer.from("custody"), pool.toBuffer(), WSOL_MINT.toBuffer()],
        program.programId
      );
      const [payCustodyTokenAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("custody_token_account"),
          pool.toBuffer(),
          WSOL_MINT.toBuffer(),
        ],
        program.programId
      );

      const [wsolCustody] = PublicKey.findProgramAddressSync(
        [Buffer.from("custody"), pool.toBuffer(), WSOL_MINT.toBuffer()],
        program.programId
      );
      const [optionDetail] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("option"),
          publicKey.toBuffer(),
          new BN(optionIndex).toArrayLike(Buffer, "le", 8),
          pool.toBuffer(),
          wsolCustody.toBuffer(),
        ],
        program.programId
      );

      const optionDetailAccount = getOptionDetailAccount(
        optionIndex,
        pool,
        custody
      );
      if (!optionDetailAccount) return;
      const optionDetailAccountData = await program.account.OptionDetail.fetch(
        optionDetailAccount
      );

      const fundingAccount = getAssociatedTokenAddressSync(
        optionDetailAccountData.premium_asset.equals(custody)
          ? WSOL_MINT
          : USDC_MINT,
        wallet.publicKey
      );

      const transaction = await program.methods
        .close_option({ optionIndex: new BN(optionIndex), poolName: "SOL-USDC" })
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
        .transaction();

      const latestBlockHash = await connection.getLatestBlockhash();
      // transaction.feePayer = publicKey;
      // let result = await connection.simulateTransaction(transaction);
      // console.log("result", result);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
      });
      return true;
    } catch (e) {
      console.log("Error", e);
      return false;
    }
  };

  const onClaimOption = async (optionIndex: number, solPrice: number) => {
    try {
      if (!program || !publicKey || !connected || !wallet) return;
      const [pool] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), Buffer.from("SOL-USDC")],
        program.programId
      );
      const [custody] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("custody_token_account"),
          pool.toBuffer(),
          WSOL_MINT.toBuffer(),
        ],
        program.programId
      );
      const optionDetailAccount = getOptionDetailAccount(
        optionIndex,
        pool,
        custody
      );
      if (!optionDetailAccount) return;
      const transaction = await program.methods
        .claim_option(new BN(optionIndex), solPrice)
        .accountsPartial({
          owner: publicKey,
          custody_mint: WSOL_MINT,
        })
        .transaction();
      const latestBlockHash = await connection.getLatestBlockhash();
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
      });
      return true;
    } catch (e) {
      console.log("Error", e);
      return false;
    }
  };

  const onExerciseOption = async (optionIndex: number) => {
    if (!program || !optionIndex || !publicKey || !connected || !wallet) return;
    const [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), Buffer.from("SOL-USDC")],
      program.programId
    );
    const [custody] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("custody_token_account"),
        pool.toBuffer(),
        WSOL_MINT.toBuffer(),
      ],
      program.programId
    );
    const optionDetailAccount = getOptionDetailAccount(
      optionIndex,
      pool,
      custody
    );
    if (!optionDetailAccount) return;
    const transaction = await program.methods
      .exercise_option(new BN(optionIndex))
      .accountsPartial({
        owner: publicKey,
      })
      .transaction();
    const latestBlockHash = await connection.getLatestBlockhash();
    // transaction.feePayer = publicKey;
    // let result = await connection.simulateTransaction(transaction);
    //   console.log("result", result)
    const signature = await sendTransaction(transaction, connection);
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    });
    return true;
  };

  const onAddLiquidity = async (
    amount: number,
    program: Program<OptionContract>,
    asset: PublicKey
  ) => {
    try {
      if (!program || !publicKey) return;
      if (!wallet) return;

      const [pool] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), Buffer.from("SOL-USDC")],
        program.programId
      );
      const [custody] = PublicKey.findProgramAddressSync(
        [Buffer.from("custody"), pool.toBuffer(), asset.toBuffer()],
        program.programId
      );
      const poolData = await program.account.Pool.fetch(pool);
      const custodyData = await program.account.Custody.fetch(custody);
      const fundingAccount = getAssociatedTokenAddressSync(
        asset,
        wallet.publicKey
      );
      let custodies = [];
      let oracles = [];
      for await (let custody of poolData.custodies) {
        let c = await program.account.Custody.fetch(new PublicKey(custody));
        let ora = c.oracle;
        custodies.push({ pubkey: custody, isSigner: false, isWritable: true });
        oracles.push({ pubkey: ora, isSigner: false, isWritable: true });
      }

      const remainingAccounts = custodies.concat(oracles);

      const transaction = await program.methods
        .add_liquidity({
          amountIn: new BN(amount),
          minLpAmountOut: new BN(1),
          poolName: "SOL-USDC",
        })
        .accountsPartial({
          owner: publicKey,
          funding_account: fundingAccount,
          custody_mint: asset,
          custody_oracle_account: custodyData.oracle,
        })
        .remainingAccounts(remainingAccounts)
        .transaction();
      const latestBlockHash = await connection.getLatestBlockhash();
      // transaction.feePayer = publicKey;
      // let result = await connection.simulateTransaction(transaction);
      // console.log("result", result);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
      });
      return true;
    } catch (e) {
      console.log("Error", e);
      return false;
    }
  };

  const onRemoveLiquidity = async (
    amount: number,
    program: Program<OptionContract>,
    asset: PublicKey
  ) => {
    try {
      if (!program || !publicKey) return;
      if (!wallet) return;

      const [pool] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), Buffer.from("SOL-USDC")],
        program.programId
      );
      const [custody] = PublicKey.findProgramAddressSync(
        [Buffer.from("custody"), pool.toBuffer(), asset.toBuffer()],
        program.programId
      );
      const poolData = await program.account.Pool.fetch(pool);

      const custodyData = await program.account.Custody.fetch(custody);
      const receivingAccount = getAssociatedTokenAddressSync(
        asset,
        wallet.publicKey
      );
      let custodies = [];
      let oracles = [];
      for await (let custody of poolData.custodies) {
        let c = await program.account.Custody.fetch(new PublicKey(custody));
        let ora = c.oracle;
        custodies.push({ pubkey: custody, isSigner: false, isWritable: true });
        oracles.push({ pubkey: ora, isSigner: false, isWritable: true });
      }
      const [poolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), Buffer.from("SOL-USDC")],
        program.programId
      );
      const [contract] = PublicKey.findProgramAddressSync(
        [Buffer.from("contract")],
        program.programId
      );
      const [transferAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("transfer_authority")],
        program.programId
      );
      const [CustodyPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("custody"), pool.toBuffer(), asset.toBuffer()],
        program.programId
      );
      const [custodyTokenAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("custody_token_account"),
          pool.toBuffer(),
          asset.toBuffer(),
        ],
        program.programId
      );
      const [lpTokenMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("lp_token_mint"), Buffer.from("SOL-USDC")],
        program.programId
      );
      const lpTokenAccount = getAssociatedTokenAddressSync(
        lpTokenMint,
        wallet.publicKey
      );
      const remainingAccounts = custodies.concat(oracles);

      const transaction = await program.methods
        .remove_liquidity({
          lpAmountIn: new BN(amount),
          minAmountOut: new BN(0),
          poolName: "SOL-USDC",
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
        .transaction();
      const latestBlockHash = await connection.getLatestBlockhash();
      // transaction.feePayer = publicKey;
      // let result = await connection.simulateTransaction(transaction);
      // console.log("result", result);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
      });
      return true;
    } catch (e) {
      console.log("Error", e);
      return false;
    }
  };

  useEffect(() => {
    (async () => {
      let provider: Provider;
      if (wallet && publicKey) {
        try {
          provider = getProvider();
        } catch {
          provider = new AnchorProvider(connection, wallet, {});
        }

        const program = new Program<OptionContract>(
          idl as OptionContract,
          provider
        );
        setProgram(program);
        setPubKey(publicKey);
      }
    })();
  }, [wallet]);

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
  );
};
