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

export class Clusterer {
    free(): void;
    [Symbol.dispose](): void;
    get_clusters(min_lng: number, min_lat: number, max_lng: number, max_lat: number, zoom: number): any;
    load_points(points: any): void;
    constructor();
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

export class Topology {
    free(): void;
    [Symbol.dispose](): void;
    find_critical_nodes(): any;
    find_path(start_id: string, end_id: string): any;
    constructor();
    set_graph(nodes: any, edges: any): void;
}

export function calculate_bezier(x1: number, y1: number, x2: number, y2: number, curve_intensity: number, segments: number): Float64Array;

/**
 * Calculate Black-Scholes price and Greeks
 * s: spot price
 * k: strike price
 * t: time to maturity (years)
 * r: risk-free rate
 * v: volatility
 */
export function calculate_black_scholes(s: number, k: number, t: number, r: number, v: number): any;

/**
 * Generate a Pedersen Commitment: C = v*G + b*H
 */
export function create_commitment(value: bigint, blinding: Uint8Array): any;

/**
 * Generate a Range Proof (Mock data with real commitment)
 */
export function create_range_proof(amount: bigint, blinding: Uint8Array): any;

/**
 * Generate a full Transfer Proof
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

export function init_panic_hook(): void;

/**
 * Compute SHA-256 hash of input bytes
 * Returns hex string
 */
export function sha256(data: Uint8Array): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_auctionsimulator_free: (a: number, b: number) => void;
    readonly __wbg_clusterer_free: (a: number, b: number) => void;
    readonly __wbg_orderbook_free: (a: number, b: number) => void;
    readonly __wbg_simulation_free: (a: number, b: number) => void;
    readonly __wbg_topology_free: (a: number, b: number) => void;
    readonly auction_add_order: (a: number, b: number, c: number, d: number) => void;
    readonly auction_calculate_clearing_price: () => number;
    readonly auction_clear: () => void;
    readonly auction_init: () => void;
    readonly auctionsimulator_add_order: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly auctionsimulator_calculate_clearing_price: (a: number, b: number) => void;
    readonly auctionsimulator_clear: (a: number) => void;
    readonly auctionsimulator_new: () => number;
    readonly calculate_bezier: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly calculate_black_scholes: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly clusterer_get_clusters: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly clusterer_load_points: (a: number, b: number, c: number) => void;
    readonly create_commitment: (a: number, b: bigint, c: number, d: number) => void;
    readonly create_range_proof: (a: number, b: bigint, c: number, d: number) => void;
    readonly create_transfer_proof: (a: number, b: bigint, c: bigint, d: number, e: number, f: number, g: number) => void;
    readonly crypto_msg_hash: (a: number, b: number, c: number) => void;
    readonly crypto_verify: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly hmac_sha256: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly orderbook_add_order: (a: number, b: number, c: number, d: number, e: number, f: bigint) => void;
    readonly orderbook_ask_count: (a: number) => number;
    readonly orderbook_best_ask_price: (a: number) => number;
    readonly orderbook_best_bid_price: (a: number) => number;
    readonly orderbook_bid_count: (a: number) => number;
    readonly orderbook_cancel_order: (a: number, b: number) => number;
    readonly orderbook_clear: (a: number) => void;
    readonly orderbook_get_depth: (a: number, b: number, c: number) => void;
    readonly orderbook_load_orders: (a: number, b: number, c: number) => void;
    readonly orderbook_match_orders: (a: number, b: number) => void;
    readonly orderbook_mid_price: (a: number) => number;
    readonly orderbook_new: () => number;
    readonly orderbook_spread: (a: number) => number;
    readonly sha256: (a: number, b: number, c: number) => void;
    readonly simulation_get_flows: (a: number, b: number) => void;
    readonly simulation_get_nodes: (a: number, b: number) => void;
    readonly simulation_new: () => number;
    readonly simulation_set_flows: (a: number, b: number, c: number) => void;
    readonly simulation_set_nodes: (a: number, b: number, c: number) => void;
    readonly simulation_update: (a: number, b: number, c: number) => void;
    readonly topology_find_critical_nodes: (a: number, b: number) => void;
    readonly topology_find_path: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly topology_new: () => number;
    readonly topology_set_graph: (a: number, b: number, c: number, d: number) => void;
    readonly init_panic_hook: () => void;
    readonly clusterer_new: () => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
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
