'use client'
import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import {
  AnchorProvider,
  getProvider,
  Idl,
  Program,
  Provider,
  BN,
} from '@coral-xyz/anchor'
import { getPythPrice } from '@/hooks/usePythPrice'
import {
  flattenTransactionResponse,
  SolanaParser,
} from '@debridge-finance/solana-transaction-parser'

import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react'
import { OptionContract } from '@/lib/idl/option_contract'
import * as idl from '../lib/idl/option_contract.json'
import { ParsedMessage, PublicKey, VersionedTransaction } from '@solana/web3.js'
import { connection, THB_MINT, USDC_MINT, WSOL_MINT } from '@/utils/const'

interface TradeDetailsProps {
  id: string
}

interface TransactionDetailType {
  label: string
  before: any
  after: any
  change: any
  difference: any
}

export default function TradeDetails({ id }: TradeDetailsProps) {
  let DefaultTransactionDetails: TransactionDetailType[] = [
    {
      label: 'Total SOL',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Locked SOL',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Unlocked SOL',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Total THB', // Default label, will rename if USDC
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Locked THB',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Unlocked THB',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'On-Chain Price',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Total Pool Volume',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'L SOL Pool Volume',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'L THB Pool Volume', // Default label
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Total Premium',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Total Selling Fees',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'On-chain Price Sold',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Utilization Rate SOL',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Utilization Rate THB', // Default label
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Total SLP Supply',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'SLP Price',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Weightage SOL',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Weightage THB',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Interest Rate',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Volatility',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'THB Withdrawal Fee',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'THB Deposit Fee',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'SOL Withdrawal Fee',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'SOL Deposit Fee',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Open Interest',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Open Interest Call',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
    {
      label: 'Open Interest Put',
      before: '',
      after: '',
      change: '',
      difference: '',
    },
  ]
  const { connected, publicKey, sendTransaction } = useWallet()
  const wallet = useAnchorWallet()
  const [program, setProgram] = useState<Program<OptionContract>>()
  const [pub, setPubKey] = useState<PublicKey>()
  const [detail, setDetail] = useState<TransactionDetailType[]>(
    DefaultTransactionDetails
  )

  const updateTransactionDetail = (
    label: string,
    field: keyof Omit<TransactionDetailType, 'label'>,
    value: any
  ) => {
    DefaultTransactionDetails = DefaultTransactionDetails.map(
      (v) =>
        v.label === label
          ? { ...v, [field]: value }
          : v
    )
  }

  const updateWholeTransactionDetail = (label: string, value: any) => {
    DefaultTransactionDetails = DefaultTransactionDetails.map(
      (v) =>
        v.label === label
          ? value
          : v
    )
  }

  const renameLabel = (oldLabel: string, newLabel: string) => {
    DefaultTransactionDetails = DefaultTransactionDetails.map((v) =>
      v.label === oldLabel ? { ...v, label: newLabel } : v
    )
  }

  const getTransactionDetail = (
    label: string,
    field: keyof Omit<TransactionDetailType, 'label'>
  ) => {
    const info = DefaultTransactionDetails.find((c) => c.label === label)
    if (!info || !info?.[field]) return 0
    const numericString = info[field].match(/^-?\d*\.?\d+/)?.[0]
    return numericString ? parseFloat(numericString) : 0
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
        const price = await getPythPrice('Crypto.SOL/USD', Date.now())
        updateWholeTransactionDetail('On-Chain Price', {
          label: 'On-Chain Price',
          before: `$${price.toFixed(2)}`,
          after: `$${price.toFixed(2)}`,
          change: `0.00%`,
          difference: `$0.00`,
        })
        try {
          const txParser = new SolanaParser([
            { idl: idl as OptionContract, programId: program.programId },
          ])
          const parsedData = await connection.getParsedTransaction(id)
          const ordered = await txParser.parseTransactionByHash(
            connection,
            id,
            true
          )

          if (!parsedData || !ordered) return
          if (parsedData.meta?.err) {
            console.log('Transaction failed due to an error.')
            return
          }

          const transferIx = ordered.find((ix) => ix.name == 'transfer')
          if (transferIx) {
            const allCustodyData = []
            const transferAmount = (transferIx.args as { amount: BN }).amount
            const idlAny = idl as any;

            // Note: ordered[0] is typically the main instruction (e.g., open_option, close_option)
            // Need to safely access accounts. 
            // The parser output structure depends on the instruction.

            const payCustody = ordered[0].accounts.find(
              (ix) => ix.name == 'pay_custody'
            )
            const lockedCustody = ordered[0].accounts.find(
              (ix) => ix.name == 'locked_custody'
            )
            const custody = ordered[0].accounts.find(
              (ix) => ix.name == 'custody'
            )
            const pool = ordered[0].accounts.find((ix) => ix.name == 'pool')

            if (!pool) return;

            const poolData = await program.account.Pool.fetch(
              pool.pubkey.toBase58()
            )

            // Let's determine if this is a USDC or THB pool primarily by looking at custodies
            let isUSDC = false;
            let isTHB = false;

            for await (let custody of poolData.custodies) {
              let c = await program.account.Custody.fetch(
                new PublicKey(custody)
              )
              if (c.mint.toBase58() == WSOL_MINT.toBase58()) {
                updateWholeTransactionDetail('Total SOL', {
                  label: 'Total SOL',
                  before: `${(c.token_owned.toNumber() / 10 ** c.decimals).toFixed(2)} SOL`,
                  after: `${(c.token_owned.toNumber() / 10 ** c.decimals).toFixed(2)} SOL`,
                  change: `0.00%`,
                  difference: `0.00 SOL`,
                })
                updateWholeTransactionDetail('Locked SOL', {
                  label: 'Locked SOL',
                  before: `${(c.token_locked.toNumber() / 10 ** c.decimals).toFixed(2)} SOL`,
                  after: `${(c.token_locked.toNumber() / 10 ** c.decimals).toFixed(2)} SOL`,
                  change: `0.00%`,
                  difference: `0.00 SOL`,
                })
                updateWholeTransactionDetail('Unlocked SOL', {
                  label: 'Unlocked SOL',
                  before: `${((c.token_owned.toNumber() - c.token_locked.toNumber()) / 10 ** c.decimals).toFixed(2)} SOL`,
                  after: `${((c.token_owned.toNumber() - c.token_locked.toNumber()) / 10 ** c.decimals).toFixed(2)} SOL`,
                  change: `0.00%`,
                  difference: `0.00 SOL`,
                })
              } else if (c.mint.toBase58() == THB_MINT.toBase58()) {
                isTHB = true;
                updateWholeTransactionDetail('Total THB', {
                  label: 'Total THB',
                  before: `${(c.token_owned.toNumber() / 10 ** c.decimals).toFixed(2)} THB`,
                  after: `${(c.token_owned.toNumber() / 10 ** c.decimals).toFixed(2)} THB`,
                  change: `0.00%`,
                  difference: `0.00 THB`,
                })
                updateWholeTransactionDetail('Locked THB', {
                  label: 'Locked THB',
                  before: `${(c.token_locked.toNumber() / 10 ** c.decimals).toFixed(2)} THB`,
                  after: `${(c.token_locked.toNumber() / 10 ** c.decimals).toFixed(2)} THB`,
                  change: `0.00%`,
                  difference: `0.00 THB`,
                })
                updateWholeTransactionDetail('Unlocked THB', {
                  label: 'Unlocked THB',
                  before: `${((c.token_owned.toNumber() - c.token_locked.toNumber()) / 10 ** c.decimals).toFixed(2)} THB`,
                  after: `${((c.token_owned.toNumber() - c.token_locked.toNumber()) / 10 ** c.decimals).toFixed(2)} THB`,
                  change: `0.00%`,
                  difference: `0.00 THB`,
                })
              } else if (c.mint.toBase58() == USDC_MINT.toBase58()) {
                isUSDC = true;
                // Rename labels
                renameLabel('Total THB', 'Total USDC');
                renameLabel('Locked THB', 'Locked USDC');
                renameLabel('Unlocked THB', 'Unlocked USDC');
                renameLabel('L THB Pool Volume', 'L USDC Pool Volume');
                renameLabel('Weightage THB', 'Weightage USDC');
                renameLabel('THB Withdrawal Fee', 'USDC Withdrawal Fee');
                renameLabel('THB Deposit Fee', 'USDC Deposit Fee');
                renameLabel('Utilization Rate THB', 'Utilization Rate USDC');

                updateWholeTransactionDetail('Total USDC', {
                  label: 'Total USDC',
                  before: `${(c.token_owned.toNumber() / 10 ** c.decimals).toFixed(2)} USDC`,
                  after: `${(c.token_owned.toNumber() / 10 ** c.decimals).toFixed(2)} USDC`,
                  change: `0.00%`,
                  difference: `0.00 USDC`,
                })
                updateWholeTransactionDetail('Locked USDC', {
                  label: 'Locked USDC',
                  before: `${(c.token_locked.toNumber() / 10 ** c.decimals).toFixed(2)} USDC`,
                  after: `${(c.token_locked.toNumber() / 10 ** c.decimals).toFixed(2)} USDC`,
                  change: `0.00%`,
                  difference: `0.00 USDC`,
                })
                updateWholeTransactionDetail('Unlocked USDC', {
                  label: 'Unlocked USDC',
                  before: `${((c.token_owned.toNumber() - c.token_locked.toNumber()) / 10 ** c.decimals).toFixed(2)} USDC`,
                  after: `${((c.token_owned.toNumber() - c.token_locked.toNumber()) / 10 ** c.decimals).toFixed(2)} USDC`,
                  change: `0.00%`,
                  difference: `0.00 USDC`,
                })
              }
            }

            // Process the transaction effects based on instruction arguments
            // We need to fetch specific custody data related to the instruction

            const processCustodyChange = async (custodyKey: PublicKey, amount: any, isLockedChange = false) => {
              // Fetch custody data to know decimals and mint
              const custodyData = await program.account.Custody.fetch(custodyKey);
              const decimals = custodyData.decimals;
              const changeVal = amount.toNumber() / 10 ** decimals;
              const mintStr = custodyData.mint.toBase58();

              let labelPrefix = '';
              if (mintStr == WSOL_MINT.toBase58()) labelPrefix = 'SOL';
              else if (mintStr == THB_MINT.toBase58()) labelPrefix = 'THB';
              else if (mintStr == USDC_MINT.toBase58()) labelPrefix = 'USDC';

              if (!labelPrefix) return; // Unknown token

              const label = isLockedChange ? `Locked ${labelPrefix}` : `Total ${labelPrefix}`;
              const detailLabel = isLockedChange ? label : label; // Reuse same logic

              // If locked change, we act on Locked X label
              const afterVal = getTransactionDetail(detailLabel, 'after');

              // Calculate new values
              // Note: Logic in original file was a bit entangled. Simplification:
              // "Locked" changes affects Locked and Unlocked

              if (isLockedChange) {
                const before = afterVal - changeVal; // Assuming changeVal is positive addition
                // Original logic: change = lockedAmount. 
                // updateWholeTransactionDetail...

                updateWholeTransactionDetail(detailLabel, {
                  label: detailLabel,
                  before: `${(afterVal - changeVal).toFixed(2)} ${labelPrefix}`,
                  after: `${afterVal.toFixed(2)} ${labelPrefix}`,
                  change: `${((changeVal / (afterVal - changeVal)) * 100).toFixed(2)}%`,
                  difference: `${changeVal.toFixed(2)} ${labelPrefix}`,
                });

                // Also update Unlocked
                const unlockedLabel = `Unlocked ${labelPrefix}`;
                const afterUnlock = getTransactionDetail(unlockedLabel, 'after');
                updateWholeTransactionDetail(unlockedLabel, {
                  label: unlockedLabel,
                  before: `${(afterUnlock + changeVal).toFixed(2)} ${labelPrefix}`,
                  after: `${afterUnlock.toFixed(2)} ${labelPrefix}`,
                  change: `${((-changeVal / (afterUnlock + changeVal)) * 100).toFixed(2)}%`,
                  difference: `${-changeVal.toFixed(2)} ${labelPrefix}`,
                });
              } else {
                // Pay custody logic ( Total amount changes? Or just locked?)
                // If pay_custody is part of 'transfer', it implies change in owned amount usually?
                // BUT here we interpret it as Locked change in original code?
                // Original code for PayCustody:
                // "updateWholeTransactionDetail('Locked THB'..."
                // It treated payCustody change as a Locked change?

                // Let's stick to the structure of original code but make it dynamic

                updateWholeTransactionDetail(`Locked ${labelPrefix}`, {
                  label: `Locked ${labelPrefix}`,
                  before: `${(afterVal - changeVal).toFixed(2)} ${labelPrefix}`,
                  after: `${afterVal.toFixed(2)} ${labelPrefix}`,
                  change: `${((changeVal / (afterVal - changeVal)) * 100).toFixed(2)}%`,
                  difference: `${changeVal.toFixed(2)} ${labelPrefix}`,
                })

                const unlockedLabel = `Unlocked ${labelPrefix}`;
                const afterUnlock = getTransactionDetail(unlockedLabel, 'after');

                updateWholeTransactionDetail(unlockedLabel, {
                  label: unlockedLabel,
                  before: `${(afterUnlock + changeVal).toFixed(2)} ${labelPrefix}`,
                  after: `${afterUnlock.toFixed(2)} ${labelPrefix}`,
                  change: `${((-changeVal / (afterUnlock + changeVal)) * 100).toFixed(2)}%`,
                  difference: `${-changeVal.toFixed(2)} ${labelPrefix}`,
                })
              }
              return { labelPrefix, decimals };
            }

            if (lockedCustody && (ordered[0].args as any)?.params?.amount) {
              const lockedAmount = (ordered[0].args as { params: { amount: BN } }).params.amount;
              await processCustodyChange(lockedCustody.pubkey, lockedAmount, true);
            }

            let payTokenDecimals = 0;
            let payTokenLabel = '';

            if (payCustody && (ordered[0].args as any)?.params?.amount) {
              const lockedAmount = (ordered[0].args as { params: { amount: BN } }).params.amount;
              // The original code used lockedAmount for payCustody logic too? 
              // "const change = lockedAmount.toNumber() ..."
              // Wait, payCustody logic in original code lines 500-523 used `lockedAmount`.
              // Checked original code: yes.
              const res = await processCustodyChange(payCustody.pubkey, lockedAmount, false);
              if (res) {
                payTokenDecimals = res.decimals;
                payTokenLabel = res.labelPrefix;
              }
            }


            // Total Pool Volume Re-calc
            const totSol = getTransactionDetail('Total SOL', 'before') * price;
            const totThb = getTransactionDetail('Total THB', 'before'); // 0 if USDC
            const totUsdc = getTransactionDetail('Total USDC', 'before'); // 0 if THB

            const totalVolBefore = totSol + totThb + totUsdc;
            updateWholeTransactionDetail('Total Pool Volume', {
              label: 'Total Pool Volume',
              before: `$${totalVolBefore.toFixed(2)}`,
              after: `$${totalVolBefore.toFixed(2)}`, // Assuming atomic view, effectively same here? Original code had same before/after values?
              // Original code had lines 528-535 identical values for before/after calc?
              // Yes, it relied on `getTransactionDetail(..., 'before')` for both.
              change: `0.00%`, // Simplified
              difference: `$0.00`,
            })

            // Total Premium
            // Depends on payCustody
            if (payTokenLabel) {
              // transferAmount comes from the `transfer` instruction
              // We need to know if we used THB or USDC or SOL
              // If payTokenLabel is THB or USDC or SOL?
              // Original logic lines 555+:
              // if mint == THB ? amount : amount * price

              const pVal = transferAmount / 10 ** payTokenDecimals;
              const premiumVal = (payTokenLabel === 'THB' || payTokenLabel === 'USDC') ? pVal : pVal * price;

              updateWholeTransactionDetail('Total Premium', {
                label: 'Total Premium',
                before: `$0`,
                after: `$${premiumVal.toFixed(2)}`,
                change: `100%`,
                difference: `$${premiumVal.toFixed(2)}`,
              })
            }

            updateWholeTransactionDetail('Total Selling Fees', {
              label: 'Total Selling Fees',
              before: `$0`,
              after: `$0`,
              change: `0%`,
              difference: `$0`,
            })
          }
          setDetail([...DefaultTransactionDetails])
        } catch (error) {
          console.error('Error fetching transaction:', error)
        }
      }
    })()
  }, [
    wallet,
    publicKey,
    id,
  ])

  return (
    <div className="w-full rounded-sm border">
      <div className="flex w-full flex-col border-b p-3">
        <span>Transaction ID: {id}</span>
        <span>Type: Put</span>
        <span>Amount: 5 Contracts</span>{' '}
      </div>
      <Table className="w-full">
        <TableHeader>
          <TableRow className="">
            <TableHead></TableHead>
            <TableHead>Before</TableHead>
            <TableHead>After</TableHead>
            <TableHead>% Change</TableHead>
            <TableHead>Difference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detail.filter(t => t.label).map((trade, index) => (
            <TableRow key={`${trade.label}-${index}`}>
              <TableCell className="w-52 border-r">{trade.label}</TableCell>
              <TableCell className="border-r">{trade.before}</TableCell>
              <TableCell className="border-r">{trade.after}</TableCell>
              <TableCell className="border-r">{trade.change}</TableCell>
              <TableCell className="border-r">{trade.difference}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
