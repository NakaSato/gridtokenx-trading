/* tslint:disable */
/* eslint-disable */

export class AuctionSimulator {
    free(): void;
    [Symbol.dispose](): void;
    add_order(id: number, price: number, amount: number, is_bid: boolean): void;
    /**
     * Calculate Uniform Clearing Price (MCP) - O(n log n).
     * Returns [clearing_price, clearing_volume].
     *
     * Walks the cumulative demand (sorted by descending bid price) and
     * cumulative supply (sorted by ascending ask price) curves together,
     * tracking the maximum volume at which the marginal bid still clears the
     * marginal ask. The crossing stops as soon as the marginal bid price
     * drops below the marginal ask price.
     */
    calculate_clearing_price(): Float64Array;
    clear(): void;
    constructor();
}

/**
 * WASM-exposed governance client
 */
export class GovernanceClient {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Initialize connection to the blockchain
     * Returns true if connection successful
     */
    connect(): boolean;
    /**
     * Create a new proposal
     *
     * # Arguments
     * * `title` - Proposal title
     * * `description` - Proposal description
     *
     * # Returns
     * The new proposal ID
     */
    create_proposal(title: string, description: string): string;
    /**
     * Fetch PoA configuration from the blockchain
     * This would call the program's poAConfig account
     */
    fetch_poa_config(): any;
    /**
     * Get the full governance state as JSON
     */
    get_state(): any;
    /**
     * Create a new governance client
     *
     * # Arguments
     * * `rpc_url` - Solana RPC endpoint (e.g., "http://127.0.0.1:8899")
     * * `program_id` - Governance program public key
     */
    constructor(rpc_url: string, program_id: string);
    /**
     * Cast a private vote on a proposal
     *
     * # Arguments
     * * `proposal_id` - ID of the proposal to vote on
     * * `support` - true for support, false for oppose
     * * `private_balance` - ZK private balance amount for weight
     * * `root_seed` - Privacy root seed for proof generation
     *
     * # Returns
     * Transaction signature or error message
     */
    vote_private(proposal_id: string, support: boolean, private_balance: bigint, _root_seed: string): string;
    /**
     * Check if connected to the blockchain
     */
    readonly is_connected: boolean;
    /**
     * Get PoA config as JSON
     */
    readonly poa_config: any;
    /**
     * Get program ID
     */
    readonly program_id: string;
    /**
     * Get current proposals as JSON
     */
    readonly proposals: any;
    /**
     * Get RPC URL
     */
    readonly rpc_url: string;
}

export class Greeks {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    delta: number;
    gamma: number;
    rho: number;
    theta: number;
    vega: number;
}

export class OrderBook {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Add an order to the book - O(log n) insertion
     */
    add_order(id: number, side: number, price: number, quantity: number, timestamp: bigint): void;
    ask_count(): number;
    /**
     * Get best ask price - O(1) with BTreeMap (lowest ask first)
     */
    best_ask_price(): number;
    /**
     * Get best bid price - O(1) with BTreeMap (highest bid first)
     */
    best_bid_price(): number;
    bid_count(): number;
    /**
     * Cancel order - O(1) lookup with HashMap index
     */
    cancel_order(order_id: number): boolean;
    /**
     * Clear all orders
     */
    clear(): void;
    /**
     * Get depth data for visualization - optimized iteration.
     * Returns: { bids: [[price, cum_qty], ...], asks: [[price, cum_qty], ...] }
     *
     * Each BTreeMap entry is already one distinct price level (a Vec of the
     * orders resting at that price), so we walk at most `levels` entries and
     * sum the quantities at each — O(levels) with no manual grouping.
     */
    get_depth(levels: number): any;
    /**
     * Bulk load orders - optimized to avoid per-insert overhead.
     *
     * Accepts the same numeric `side` (0 = Buy, 1 = Sell) shape as
     * [`add_order`], not the `Side` enum's serde variant names, so both entry
     * points share one wire contract.
     */
    load_orders(orders: any): void;
    /**
     * Match orders - optimized with BTreeMap
     */
    match_orders(): any;
    mid_price(): number;
    constructor();
    spread(): number;
}

/**
 * Proposal status variants
 */
export enum ProposalStatus {
    Active = 0,
    Passed = 1,
    Failed = 2,
}

export class Simulation {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the current state of all flows
     */
    get_flows(): any;
    /**
     * Calculate aggregate grid totals in WASM
     */
    get_grid_totals(): any;
    /**
     * Returns the current state of all nodes
     */
    get_nodes(): any;
    constructor();
    set_flows(flows: any): void;
    set_nodes(nodes: any): void;
    update(hour: number, minute: number): void;
}

export function aggregate_readings(readings_js: any): any;

export function black_scholes(s: number, k: number, t: number, is_call: boolean): number;

export function calculate_bezier(x1: number, y1: number, x2: number, y2: number, curve_intensity: number, segments: number): Float64Array;

export function calculate_greeks(s: number, k: number, t: number, is_call: boolean): Greeks;

export function calculate_portfolio_risk(positions_js: any): any;

/**
 * Compute PDA for PoA config account
 */
export function compute_poa_config_pda(program_id: string): string;

/**
 * Double SHA-256 (hash of hash) commonly used in blockchains
 */
export function crypto_msg_hash(data: Uint8Array): string;

/**
 * Verify an HMAC-SHA256 signature
 */
export function crypto_verify(key: Uint8Array, message: Uint8Array, signature_hex: string): boolean;

/**
 * Decode fixed-size byte array to string (helper for PoA config)
 */
export function decode_fixed_string(bytes: Uint8Array, len: number): string;

export function delta_calc(s: number, k: number, t: number, is_call: boolean): number;

export function gamma_calc(s: number, k: number, t: number): number;

/**
 * Generate ZK proof for stake-weighted voting
 */
export function generate_zk_vote_proof(balance: bigint, root_seed: string, proposal_id: string): string;

/**
 * Compute HMAC-SHA256
 * Returns hex string
 */
export function hmac_sha256(key: Uint8Array, message: Uint8Array): string;

/**
 * Initializes the panic hook for the WASM library.
 */
export function init_panic_hook(): void;

export function perform_clustering(chars: any): any;

export function rho_calc(s: number, k: number, t: number, is_call: boolean): number;

/**
 * Compute SHA-256 hash of input bytes
 * Returns hex string
 */
export function sha256(data: Uint8Array): string;

/**
 * Standardized P2P order message construction and signing
 */
export function sign_p2p_order(side: string, amount: string, price: string, timestamp: bigint, secret_key: Uint8Array): string;

export function theta_calc(s: number, k: number, t: number, is_call: boolean): number;

export function vega_calc(s: number, k: number, t: number): number;

/**
 * Verify a ZK vote proof
 */
export function verify_zk_vote_proof(proof: string, proposal_id: string): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_auctionsimulator_free: (a: number, b: number) => void;
    readonly __wbg_get_greeks_delta: (a: number) => number;
    readonly __wbg_get_greeks_gamma: (a: number) => number;
    readonly __wbg_get_greeks_rho: (a: number) => number;
    readonly __wbg_get_greeks_theta: (a: number) => number;
    readonly __wbg_get_greeks_vega: (a: number) => number;
    readonly __wbg_governanceclient_free: (a: number, b: number) => void;
    readonly __wbg_greeks_free: (a: number, b: number) => void;
    readonly __wbg_orderbook_free: (a: number, b: number) => void;
    readonly __wbg_set_greeks_delta: (a: number, b: number) => void;
    readonly __wbg_set_greeks_gamma: (a: number, b: number) => void;
    readonly __wbg_set_greeks_rho: (a: number, b: number) => void;
    readonly __wbg_set_greeks_theta: (a: number, b: number) => void;
    readonly __wbg_set_greeks_vega: (a: number, b: number) => void;
    readonly __wbg_simulation_free: (a: number, b: number) => void;
    readonly aggregate_readings: (a: any) => [number, number, number];
    readonly auctionsimulator_add_order: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly auctionsimulator_calculate_clearing_price: (a: number) => [number, number];
    readonly auctionsimulator_clear: (a: number) => void;
    readonly auctionsimulator_new: () => number;
    readonly black_scholes: (a: number, b: number, c: number, d: number) => number;
    readonly calculate_bezier: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly calculate_greeks: (a: number, b: number, c: number, d: number) => number;
    readonly calculate_portfolio_risk: (a: any) => [number, number, number];
    readonly compute_poa_config_pda: (a: number, b: number) => [number, number, number, number];
    readonly crypto_msg_hash: (a: number, b: number) => [number, number];
    readonly crypto_verify: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly decode_fixed_string: (a: number, b: number, c: number) => [number, number];
    readonly delta_calc: (a: number, b: number, c: number, d: number) => number;
    readonly gamma_calc: (a: number, b: number, c: number) => number;
    readonly generate_zk_vote_proof: (a: bigint, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly governanceclient_connect: (a: number) => number;
    readonly governanceclient_create_proposal: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly governanceclient_fetch_poa_config: (a: number) => [number, number, number];
    readonly governanceclient_get_state: (a: number) => [number, number, number];
    readonly governanceclient_is_connected: (a: number) => number;
    readonly governanceclient_new: (a: number, b: number, c: number, d: number) => number;
    readonly governanceclient_poa_config: (a: number) => [number, number, number];
    readonly governanceclient_program_id: (a: number) => [number, number];
    readonly governanceclient_proposals: (a: number) => [number, number, number];
    readonly governanceclient_rpc_url: (a: number) => [number, number];
    readonly governanceclient_vote_private: (a: number, b: number, c: number, d: number, e: bigint, f: number, g: number) => [number, number, number, number];
    readonly hmac_sha256: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly init_panic_hook: () => void;
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
    readonly perform_clustering: (a: any) => [number, number, number];
    readonly rho_calc: (a: number, b: number, c: number, d: number) => number;
    readonly sha256: (a: number, b: number) => [number, number];
    readonly sign_p2p_order: (a: number, b: number, c: number, d: number, e: number, f: number, g: bigint, h: number, i: number) => [number, number, number, number];
    readonly simulation_get_flows: (a: number) => [number, number, number];
    readonly simulation_get_grid_totals: (a: number) => [number, number, number];
    readonly simulation_get_nodes: (a: number) => [number, number, number];
    readonly simulation_new: () => number;
    readonly simulation_set_flows: (a: number, b: any) => [number, number];
    readonly simulation_set_nodes: (a: number, b: any) => [number, number];
    readonly simulation_update: (a: number, b: number, c: number) => void;
    readonly theta_calc: (a: number, b: number, c: number, d: number) => number;
    readonly vega_calc: (a: number, b: number, c: number) => number;
    readonly verify_zk_vote_proof: (a: number, b: number, c: number, d: number) => number;
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
