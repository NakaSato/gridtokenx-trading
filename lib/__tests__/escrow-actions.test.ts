/**
 * @jest-environment node
 *
 * Runs in the node environment (not jsdom): real PDA derivation needs
 * @noble/hashes, whose Uint8Array instanceof check fails across jsdom's
 * separate Buffer/Uint8Array realms.
 */
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import {
  toBaseUnits,
  resolveTokenProgram,
  depositEscrow,
  withdrawEscrow,
  fetchEscrowBalance,
} from '../escrow-actions'
import { getUserEscrowPDA, getMarketAuthorityPDA } from '../pda-utils'

const PROGRAM_ID = new PublicKey('CnWDEUhTvSixeLSyViWgAnnu9YouBAYVGcrrFm1s9WcX')
const USER = new PublicKey('7NsngNMtXJNdHgeK4znQDZ8iZoWN2Y9v9nFaAvexpp1a')
const MINT = new PublicKey('So11111111111111111111111111111111111111112')

describe('escrow PDA derivation', () => {
  it('derives deterministic user escrow PDA', () => {
    const a = getUserEscrowPDA(USER, MINT, PROGRAM_ID)
    const b = getUserEscrowPDA(USER, MINT, PROGRAM_ID)
    expect(a.equals(b)).toBe(true)
    expect(PublicKey.isOnCurve(a.toBytes())).toBe(false)
  })

  it('derives different escrow PDAs for different users', () => {
    const other = new PublicKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    expect(
      getUserEscrowPDA(USER, MINT, PROGRAM_ID).equals(
        getUserEscrowPDA(other, MINT, PROGRAM_ID)
      )
    ).toBe(false)
  })

  it('derives deterministic market authority PDA', () => {
    const a = getMarketAuthorityPDA(PROGRAM_ID)
    const b = getMarketAuthorityPDA(PROGRAM_ID)
    expect(a.equals(b)).toBe(true)
  })
})

describe('toBaseUnits', () => {
  it('converts whole and fractional amounts at 6 decimals', () => {
    expect(toBaseUnits('1.5', 6).toString()).toBe('1500000')
    expect(toBaseUnits('42', 6).toString()).toBe('42000000')
    expect(toBaseUnits('0.000001', 6).toString()).toBe('1')
  })

  it('has no float drift on awkward decimals', () => {
    expect(toBaseUnits('0.3', 6).toString()).toBe('300000')
    expect(toBaseUnits('123456789.123456', 6).toString()).toBe('123456789123456')
  })

  it('rejects zero, negative, and non-numeric input', () => {
    expect(() => toBaseUnits('0', 6)).toThrow('greater than zero')
    expect(() => toBaseUnits('0.0', 6)).toThrow('greater than zero')
    expect(() => toBaseUnits('-1', 6)).toThrow('valid amount')
    expect(() => toBaseUnits('abc', 6)).toThrow('valid amount')
    expect(() => toBaseUnits('', 6)).toThrow('valid amount')
    expect(() => toBaseUnits('1.2.3', 6)).toThrow('valid amount')
  })

  it('rejects more decimal places than the mint supports', () => {
    expect(() => toBaseUnits('1.1234567', 6)).toThrow('at most 6 decimal places')
  })
})

describe('resolveTokenProgram', () => {
  it('returns classic SPL for classic-owned mint', async () => {
    const connection = {
      getAccountInfo: jest.fn().mockResolvedValue({ owner: TOKEN_PROGRAM_ID }),
    } as any
    expect((await resolveTokenProgram(connection, MINT)).equals(TOKEN_PROGRAM_ID)).toBe(true)
  })

  it('returns Token-2022 for 2022-owned mint', async () => {
    const connection = {
      getAccountInfo: jest.fn().mockResolvedValue({ owner: TOKEN_2022_PROGRAM_ID }),
    } as any
    expect((await resolveTokenProgram(connection, MINT)).equals(TOKEN_2022_PROGRAM_ID)).toBe(true)
  })

  it('throws when mint does not exist', async () => {
    const connection = { getAccountInfo: jest.fn().mockResolvedValue(null) } as any
    await expect(resolveTokenProgram(connection, MINT)).rejects.toThrow('not found')
  })
})

function makeMocks() {
  const transaction = { kind: 'tx' }
  const methodChain = {
    accountsPartial: jest.fn().mockReturnThis(),
    transaction: jest.fn().mockResolvedValue(transaction),
  }
  const program = {
    programId: PROGRAM_ID,
    methods: {
      depositEscrow: jest.fn().mockReturnValue(methodChain),
      withdrawEscrow: jest.fn().mockReturnValue(methodChain),
    },
  } as any
  const connection = {
    getAccountInfo: jest.fn().mockResolvedValue({ owner: TOKEN_PROGRAM_ID }),
    getLatestBlockhash: jest
      .fn()
      .mockResolvedValue({ blockhash: 'hash', lastValidBlockHeight: 42 }),
    confirmTransaction: jest.fn().mockResolvedValue({ value: { err: null } }),
  } as any
  const sendTransaction = jest.fn().mockResolvedValue('signature123')
  return { program, connection, sendTransaction, methodChain, transaction }
}

describe('depositEscrow', () => {
  it('builds, sends, and confirms the deposit transaction', async () => {
    const { program, connection, sendTransaction, methodChain, transaction } = makeMocks()

    const sig = await depositEscrow(program, connection, USER, sendTransaction, {
      mint: MINT,
      amountUi: '2.5',
      decimals: 6,
    })

    expect(sig).toBe('signature123')
    const amountArg = program.methods.depositEscrow.mock.calls[0][0]
    expect(amountArg.toString()).toBe('2500000')

    const accounts = methodChain.accountsPartial.mock.calls[0][0]
    expect(accounts.user.equals(USER)).toBe(true)
    expect(accounts.mint.equals(MINT)).toBe(true)
    expect(accounts.userEscrow.equals(getUserEscrowPDA(USER, MINT, PROGRAM_ID))).toBe(true)
    expect(accounts.marketAuthority.equals(getMarketAuthorityPDA(PROGRAM_ID))).toBe(true)
    expect(accounts.tokenProgram.equals(TOKEN_PROGRAM_ID)).toBe(true)
    expect(accounts.systemProgram.equals(SystemProgram.programId)).toBe(true)

    expect(sendTransaction).toHaveBeenCalledWith(transaction, connection)
    expect(connection.confirmTransaction).toHaveBeenCalledWith({
      blockhash: 'hash',
      lastValidBlockHeight: 42,
      signature: 'signature123',
    })
  })

  it('rejects invalid amounts before touching the chain', async () => {
    const { program, connection, sendTransaction } = makeMocks()
    await expect(
      depositEscrow(program, connection, USER, sendTransaction, {
        mint: MINT,
        amountUi: '0',
        decimals: 6,
      })
    ).rejects.toThrow('greater than zero')
    expect(sendTransaction).not.toHaveBeenCalled()
  })
})

describe('withdrawEscrow', () => {
  it('builds the withdraw transaction without system_program', async () => {
    const { program, connection, sendTransaction, methodChain } = makeMocks()

    const sig = await withdrawEscrow(program, connection, USER, sendTransaction, {
      mint: MINT,
      amountUi: '1',
      decimals: 6,
    })

    expect(sig).toBe('signature123')
    expect(program.methods.withdrawEscrow.mock.calls[0][0].toString()).toBe('1000000')
    const accounts = methodChain.accountsPartial.mock.calls[0][0]
    expect(accounts.systemProgram).toBeUndefined()
    expect(accounts.userWallet).toBeDefined()
    expect(accounts.userEscrow.equals(getUserEscrowPDA(USER, MINT, PROGRAM_ID))).toBe(true)
  })
})

describe('fetchEscrowBalance', () => {
  it('returns the token balance of the escrow PDA', async () => {
    const connection = {
      getTokenAccountBalance: jest
        .fn()
        .mockResolvedValue({ value: { uiAmount: 12.5, amount: '12500000' } }),
    } as any

    const balance = await fetchEscrowBalance(connection, USER, MINT, PROGRAM_ID)
    expect(balance).toEqual({ uiAmount: 12.5, raw: BigInt(12500000) })
    const queried: PublicKey = connection.getTokenAccountBalance.mock.calls[0][0]
    expect(queried.equals(getUserEscrowPDA(USER, MINT, PROGRAM_ID))).toBe(true)
  })

  it('treats a missing escrow account as zero balance', async () => {
    const connection = {
      getTokenAccountBalance: jest.fn().mockRejectedValue(new Error('could not find account')),
    } as any
    expect(await fetchEscrowBalance(connection, USER, MINT, PROGRAM_ID)).toEqual({
      uiAmount: 0,
      raw: BigInt(0),
    })
  })
})
