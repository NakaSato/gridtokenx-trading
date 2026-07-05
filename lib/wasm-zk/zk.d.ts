/* tslint:disable */
/* eslint-disable */

/**
 * wasm-bindgen version of the Instruction struct.
 * This duplication is required until https://github.com/rustwasm/wasm-bindgen/issues/3671
 * is fixed. This must not diverge from the regular non-wasm Instruction struct.
 */
export class Instruction {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
}

export class Instructions {
    free(): void;
    [Symbol.dispose](): void;
    constructor();
    push(instruction: Instruction): void;
}

/**
 * The address of a [Solana account][acc].
 *
 * Some account addresses are [ed25519] public keys, with corresponding secret
 * keys that are managed off-chain. Often, though, account addresses do not
 * have corresponding secret keys &mdash; as with [_program derived
 * addresses_][pdas] &mdash; or the secret key is not relevant to the operation
 * of a program, and may have even been disposed of. As running Solana programs
 * can not safely create or manage secret keys, the full [`Keypair`] is not
 * defined in `solana-program` but in `solana-sdk`.
 *
 * [acc]: https://solana.com/docs/core/accounts
 * [ed25519]: https://ed25519.cr.yp.to/
 * [pdas]: https://solana.com/docs/core/cpi#program-derived-addresses
 * [`Keypair`]: https://docs.rs/solana-sdk/latest/solana_sdk/signer/keypair/struct.Keypair.html
 */
export class Pubkey {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Create a new Pubkey object
     *
     * * `value` - optional public key as a base58 encoded string, `Uint8Array`, `[number]`
     */
    constructor(value: any);
    /**
     * Checks if two `Pubkey`s are equal
     */
    equals(other: Pubkey): boolean;
    /**
     * Return the `Uint8Array` representation of the public key
     */
    toBytes(): Uint8Array;
    /**
     * Return the base58 string representation of the public key
     */
    toString(): string;
}

export class WasmElGamalKeypair {
    free(): void;
    [Symbol.dispose](): void;
    decrypt(ciphertext: Uint8Array): bigint;
    static fromSecret(secret_bytes: Uint8Array): WasmElGamalKeypair;
    constructor();
    pubkey(): Uint8Array;
    secret(): Uint8Array;
}

/**
 * Create a Pedersen commitment with a specific blinding factor
 */
export function create_commitment(value: bigint, blinding: Uint8Array): any;

/**
 * Generate a real Range Proof for a u64 amount with a specific blinding factor
 */
export function create_range_proof(amount: bigint, blinding: Uint8Array): any;

/**
 * Generate a full Transfer Proof (aligned with TS bridge)
 */
export function create_transfer_proof(amount: bigint, sender_balance: bigint, sender_blinding: Uint8Array, amount_blinding: Uint8Array): any;

/**
 * Stealth Key Derivation: high-performance derivation for private links
 */
export function derive_stealth_key(root_seed: Uint8Array, index: number): Uint8Array;

/**
 * Recovery: brute-force search for small amounts (up to 1M)
 * This is a simple implementation of balance recovery from commitments
 */
export function recover_amount_from_commitment(commitment_js: any, blinding: Uint8Array): bigint | undefined;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmelgamalkeypair_free: (a: number, b: number) => void;
    readonly create_commitment: (a: bigint, b: number, c: number) => [number, number, number];
    readonly create_range_proof: (a: bigint, b: number, c: number) => [number, number, number];
    readonly create_transfer_proof: (a: bigint, b: bigint, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly derive_stealth_key: (a: number, b: number, c: number) => [number, number];
    readonly recover_amount_from_commitment: (a: any, b: number, c: number) => [number, bigint];
    readonly wasmelgamalkeypair_decrypt: (a: number, b: number, c: number) => [bigint, number, number];
    readonly wasmelgamalkeypair_fromSecret: (a: number, b: number) => [number, number, number];
    readonly wasmelgamalkeypair_new: () => number;
    readonly wasmelgamalkeypair_pubkey: (a: number) => [number, number];
    readonly wasmelgamalkeypair_secret: (a: number) => [number, number];
    readonly __wbg_instruction_free: (a: number, b: number) => void;
    readonly __wbg_instructions_free: (a: number, b: number) => void;
    readonly instructions_constructor: () => number;
    readonly instructions_push: (a: number, b: number) => void;
    readonly __wbg_pubkey_free: (a: number, b: number) => void;
    readonly pubkey_constructor: (a: any) => [number, number, number];
    readonly pubkey_equals: (a: number, b: number) => number;
    readonly pubkey_toBytes: (a: number) => [number, number];
    readonly pubkey_toString: (a: number) => [number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
