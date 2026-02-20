/* tslint:disable */
/* eslint-disable */

export class AuctionSimulator {
    free(): void;
    [Symbol.dispose](): void;
    add_order(id: number, price: number, amount: number, is_bid: boolean): void;
    /**
     * Calculate Uniform Clearing Price (MCP)
     * Returns [clearing_price, clearing_volume]
     */
    calculate_clearing_price(): Float64Array;
    clear(): void;
    constructor();
}

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

export class OrderBook {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Add an order to the book
     */
    add_order(id: number, side: number, price: number, quantity: number, timestamp: bigint): void;
    ask_count(): number;
    best_ask_price(): number;
    best_bid_price(): number;
    bid_count(): number;
    cancel_order(order_id: number): boolean;
    /**
     * Clear all orders
     */
    clear(): void;
    /**
     * Get depth data for visualization
     * Returns: { bids: [[price, cum_qty], ...], asks: [[price, cum_qty], ...] }
     */
    get_depth(levels: number): any;
    /**
     * Bulk check/add orders (not strictly necessary with wasm-bindgen if we just loop in JS, but nice for perf)
     */
    load_orders(orders: any): void;
    match_orders(): any;
    mid_price(): number;
    constructor();
    spread(): number;
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

export class Simulation {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the current state of all flows
     */
    get_flows(): any;
    /**
     * Returns the current state of all nodes
     */
    get_nodes(): any;
    constructor();
    set_flows(flows: any): void;
    set_nodes(nodes: any): void;
    update(hour: number, minute: number): void;
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

export function calculate_bezier(x1: number, y1: number, x2: number, y2: number, curve_intensity: number, segments: number): Float64Array;

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
 * Double SHA-256 (hash of hash) commonly used in blockchains
 */
export function crypto_msg_hash(data: Uint8Array): string;

/**
 * Verify an HMAC-SHA256 signature
 */
export function crypto_verify(key: Uint8Array, message: Uint8Array, signature_hex: string): boolean;

/**
 * Compute HMAC-SHA256
 * Returns hex string
 */
export function hmac_sha256(key: Uint8Array, message: Uint8Array): string;

/**
 * Initializes the panic hook for the WASM library.
 */
export function init_panic_hook(): void;

/**
 * Compute SHA-256 hash of input bytes
 * Returns hex string
 */
export function sha256(data: Uint8Array): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_orderbook_free: (a: number, b: number) => void;
    readonly orderbook_add_order: (a: number, b: number, c: number, d: number, e: number, f: bigint) => void;
    readonly orderbook_ask_count: (a: number) => number;
    readonly orderbook_best_ask_price: (a: number) => number;
    readonly orderbook_best_bid_price: (a: number) => number;
    readonly orderbook_bid_count: (a: number) => number;
    readonly orderbook_cancel_order: (a: number, b: number) => number;
    readonly orderbook_clear: (a: number) => void;
    readonly orderbook_get_depth: (a: number, b: number) => [number, number, number];
    readonly orderbook_load_orders: (a: number, b: any) => [number, number];
    readonly orderbook_match_orders: (a: number) => [number, number, number];
    readonly orderbook_mid_price: (a: number) => number;
    readonly orderbook_new: () => number;
    readonly orderbook_spread: (a: number) => number;
    readonly init_panic_hook: () => void;
    readonly crypto_msg_hash: (a: number, b: number) => [number, number];
    readonly crypto_verify: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly hmac_sha256: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly sha256: (a: number, b: number) => [number, number];
    readonly __wbg_simulation_free: (a: number, b: number) => void;
    readonly simulation_get_flows: (a: number) => [number, number, number];
    readonly simulation_get_nodes: (a: number) => [number, number, number];
    readonly simulation_new: () => number;
    readonly simulation_set_flows: (a: number, b: any) => [number, number];
    readonly simulation_set_nodes: (a: number, b: any) => [number, number];
    readonly simulation_update: (a: number, b: number, c: number) => void;
    readonly __wbg_auctionsimulator_free: (a: number, b: number) => void;
    readonly auction_add_order: (a: number, b: number, c: number, d: number) => void;
    readonly auction_calculate_clearing_price: () => number;
    readonly auction_clear: () => void;
    readonly auction_init: () => void;
    readonly auctionsimulator_add_order: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly auctionsimulator_calculate_clearing_price: (a: number) => [number, number];
    readonly auctionsimulator_clear: (a: number) => void;
    readonly auctionsimulator_new: () => number;
    readonly calculate_bezier: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly __wbg_wasmelgamalkeypair_free: (a: number, b: number) => void;
    readonly create_commitment: (a: bigint, b: number, c: number) => [number, number, number];
    readonly create_range_proof: (a: bigint, b: number, c: number) => [number, number, number];
    readonly create_transfer_proof: (a: bigint, b: bigint, c: number, d: number, e: number, f: number) => [number, number, number];
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
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
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
