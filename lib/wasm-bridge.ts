/**
 * WASM Bridge for Options Pricing
 * 
 * TypeScript wrapper to load and call WASM functions for
 * Black-Scholes pricing, Greeks calculations, and P&L chart generation.
 * 
 * @module wasm-bridge
 */

export interface Greeks {
    delta: number;
    gamma: number;
    vega: number;
    theta: number;
    rho: number;
}

export interface PnLData {
    prices: number[];
    pnlData: number[];
    minPnL: number;
    maxPnL: number;
}

export interface ZkCommitment {
    point: number[];
}

export interface ZkRangeProof {
    proof_data: number[];
    commitment: ZkCommitment;
}

export interface ZkEqualityProof {
    challenge: number[];
    response: number[];
}

export interface ZkTransferProof {
    amount_commitment: ZkCommitment;
    amount_range_proof: ZkRangeProof;
    remaining_range_proof: ZkRangeProof;
    balance_proof: ZkEqualityProof;
}

export interface WasmExports {
    memory: WebAssembly.Memory;
    get_buffer_ptr: () => number;
    // Options pricing
    black_scholes: (s: number, k: number, t: number, isCall: number) => number;
    delta_calc: (s: number, k: number, t: number, isCall: number) => number;
    gamma_calc: (s: number, k: number, t: number) => number;
    vega_calc: (s: number, k: number, t: number) => number;
    theta_calc: (s: number, k: number, t: number, isCall: number) => number;
    rho_calc: (s: number, k: number, t: number, isCall: number) => number;
    batch_black_scholes: (ptr: number, count: number, outPtr: number) => number;
    calc_all_greeks: (s: number, k: number, t: number, isCall: number, outPtr: number) => void;
    // P&L Chart functions
    calculate_pnl: (price: number, strikePrice: number, premium: number, contractType: number, positionType: number) => number;
    generate_pnl_batch: (strikePrice: number, premium: number, contractType: number, positionType: number, rangePercent: number, numPoints: number) => number;
    get_pnl_buffer_ptr: () => number;
    get_pnl_range: (numPoints: number, outPtr: number) => void;
    // Order book
    orderbook_init: () => void;
    orderbook_add: (id: number, side: number, price: number, quantity: number, timestamp: number) => void;
    orderbook_cancel: (id: number) => number;
    orderbook_best_bid: () => number;
    orderbook_best_ask: () => number;
    orderbook_spread: () => number;
    orderbook_mid_price: () => number;
    orderbook_match: () => number;
    orderbook_match_ptr: () => number;
    orderbook_depth: (levels: number) => number;
    orderbook_depth_ptr: () => number;
    orderbook_bid_count: () => number;
    orderbook_ask_count: () => number;
    // Grid topology
    topology_init: () => void;
    topology_load_nodes: (ptr: number, count: number) => void;
    topology_load_lines: (ptr: number, count: number) => void;
    topology_shortest_path: (start: number, end: number) => number;
    topology_path_ptr: () => number;
    topology_calc_flow: () => number;
    topology_flow_ptr: () => number;
    topology_calc_losses: (voltage: number) => number;
    topology_node_count: () => number;
    topology_line_count: () => number;
    // Crypto
    crypto_sha256: (ptr: number, len: number) => number;
    crypto_hash_ptr: () => number;
    crypto_hash_hex: () => number;
    crypto_hex_ptr: () => number;
    crypto_sign: (keyPtr: number, keyLen: number, msgPtr: number, msgLen: number) => number;
    crypto_sig_ptr: () => number;
    crypto_verify: (keyPtr: number, keyLen: number, msgPtr: number, msgLen: number, sigPtr: number) => number;
    // Energy Grid & Clustering
    calculate_bezier: (x1: number, y1: number, x2: number, y2: number, intensity: number, segments: number, ptr: number) => number;
    load_points: (ptr: number, count: number) => void;
    get_clusters: (minLng: number, minLat: number, maxLng: number, maxLat: number, zoom: number) => number;
    get_output_buffer_ptr: () => number;
    // Simulation
    init_simulation_nodes: (ptr: number, count: number) => void;
    init_simulation_flows: (ptr: number, count: number) => void;
    update_simulation: (hour: number, minute: number) => void;
    get_flow_output_ptr: () => number;
    // ZK Privacy
    create_commitment: (retptr: number, value: bigint, ptr: number, len: number) => void;
    create_range_proof: (retptr: number, amount: bigint, ptr: number, len: number) => void;
    create_transfer_proof: (retptr: number, amount: bigint, balance: bigint, sPtr: number, sLen: number, aPtr: number, aLen: number) => void;
    __wbindgen_add_to_stack_pointer: (delta: number) => number;
    __wbindgen_export: (size: number, align: number) => number;
}

let wasmInstance: WebAssembly.Instance | null = null;
let wasmExports: WasmExports | null = null;
let wasmLoadPromise: Promise<WasmExports> | null = null;

/**
 * Initialize the WASM module (deferred for better performance)
 * @param wasmPath - Path to the .wasm file (default: '/gridtokenx_wasm.wasm')
 */
export async function initWasm(wasmPath: string = '/gridtokenx_wasm.wasm'): Promise<WasmExports> {
    if (wasmExports) {
        return wasmExports;
    }

    // If already loading, return the existing promise
    if (wasmLoadPromise) {
        return wasmLoadPromise;
    }

    wasmLoadPromise = (async () => {
        try {
            const response = await fetch(wasmPath);
            const bytes = await response.arrayBuffer();
            const { instance } = await WebAssembly.instantiate(bytes, {
                env: {
                    // Add any imports WASM might need
                }
            });

            wasmInstance = instance;
            wasmExports = instance.exports as unknown as WasmExports;

            return wasmExports;
        } catch (error) {
            console.error('[WASM] Failed to load module:', error);
            wasmLoadPromise = null;
            throw error;
        }
    })();

    return wasmLoadPromise;
}

/**
 * Defer WASM initialization to not block main thread
 */
export function deferWasmInit(): void {
    if (typeof window === 'undefined') return;

    if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
            initWasm().catch(() => { });
        });
    } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
            initWasm().catch(() => { });
        }, 100);
    }
}

/**
 * Check if WASM module is loaded
 */
export function isWasmLoaded(): boolean {
    return wasmExports !== null;
}

/**
 * Get raw WASM exports (for advanced usage)
 */
export function getWasmExports(): WasmExports | null {
    return wasmExports;
}

// =============================================================================
// OPTIONS PRICING FUNCTIONS
// =============================================================================

/**
 * Calculate option price using Black-Scholes formula
 * @param s - Current underlying price
 * @param k - Strike price
 * @param t - Time to expiration (in years or as fraction)
 * @param isCall - true for call option, false for put
 * @returns Option price
 */
export function blackScholes(s: number, k: number, t: number, isCall: boolean): number {
    if (!wasmExports) {
        console.warn('[WASM] Module not loaded, falling back to JS implementation');
        return blackScholesJS(s, k, t, isCall);
    }
    return wasmExports.black_scholes(s, k, t, isCall ? 1 : 0);
}

/**
 * Calculate Delta (rate of change of option price vs underlying)
 */
export function deltaCalc(s: number, k: number, t: number, isCall: boolean): number {
    if (!wasmExports) {
        return deltaCalcJS(s, k, t, isCall);
    }
    return wasmExports.delta_calc(s, k, t, isCall ? 1 : 0);
}

/**
 * Calculate Gamma (rate of change of delta)
 */
export function gammaCalc(s: number, k: number, t: number): number {
    if (!wasmExports) {
        return gammaCalcJS(s, k, t);
    }
    return wasmExports.gamma_calc(s, k, t);
}

/**
 * Calculate Vega (sensitivity to volatility)
 */
export function vegaCalc(s: number, k: number, t: number): number {
    if (!wasmExports) {
        return vegaCalcJS(s, k, t);
    }
    return wasmExports.vega_calc(s, k, t);
}

/**
 * Calculate Theta (time decay per day)
 */
export function thetaCalc(s: number, k: number, t: number, isCall: boolean): number {
    if (!wasmExports) {
        return thetaCalcJS(s, k, t, isCall);
    }
    return wasmExports.theta_calc(s, k, t, isCall ? 1 : 0);
}

/**
 * Calculate Rho (sensitivity to interest rate)
 */
export function rhoCalc(s: number, k: number, t: number, isCall: boolean): number {
    if (!wasmExports) {
        return rhoCalcJS(s, k, t, isCall);
    }
    return wasmExports.rho_calc(s, k, t, isCall ? 1 : 0);
}

/**
 * Calculate all Greeks at once (more efficient than calling individually)
 */
export function calculateGreeks(s: number, k: number, t: number, isCall: boolean): Greeks {
    if (!wasmExports) {
        return {
            delta: deltaCalcJS(s, k, t, isCall),
            gamma: gammaCalcJS(s, k, t),
            vega: vegaCalcJS(s, k, t),
            theta: thetaCalcJS(s, k, t, isCall),
            rho: rhoCalcJS(s, k, t, isCall),
        };
    }

    // Get buffer pointer and write results
    const bufferPtr = wasmExports.get_buffer_ptr();
    wasmExports.calc_all_greeks(s, k, t, isCall ? 1 : 0, bufferPtr);

    // Read results from WASM memory
    const memory = new Float64Array(wasmExports.memory.buffer, bufferPtr, 5);

    return {
        delta: memory[0],
        gamma: memory[1],
        vega: memory[2],
        theta: memory[3],
        rho: memory[4],
    };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert price from one token to USD value
 * @param amount - Amount of tokens
 * @param fromTokenPrice - Price of the token in USD
 * @returns Converted price
 */
export function convertPrice(amount: number, fromTokenPrice: number): number {
    if (!amount || !fromTokenPrice) return 0;
    return parseFloat((amount * fromTokenPrice).toFixed(8));
}

// =============================================================================
// JAVASCRIPT FALLBACKS (copied from optionsPricing.ts)
// =============================================================================

const R = 0.0;
const SIGMA = 0.5;

function normalCdf(z: number): number {
    const beta1 = -0.0004406;
    const beta2 = 0.0418198;
    const beta3 = 0.9;
    const exponent = -Math.sqrt(Math.PI) * (beta1 * Math.pow(z, 5) + beta2 * Math.pow(z, 3) + beta3 * z);
    return 1.0 / (1.0 + Math.exp(exponent));
}

function normalPdf(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function blackScholesJS(s: number, k: number, t: number, isCall: boolean): number {
    if (t <= 0 || s <= 0 || k <= 0) return 0;

    const d1 = (Math.log(s / k) + (R + 0.5 * SIGMA * SIGMA) * t) / (SIGMA * Math.sqrt(t));
    const d2 = d1 - SIGMA * Math.sqrt(t);

    const nd1 = normalCdf(d1);
    const nd2 = normalCdf(d2);
    const nNegd1 = normalCdf(-d1);
    const nNegd2 = normalCdf(-d2);

    if (isCall) {
        return s * nd1 - k * Math.exp(-R * t) * nd2;
    } else {
        return k * Math.exp(-R * t) * nNegd2 - s * nNegd1;
    }
}

function deltaCalcJS(s: number, k: number, t: number, isCall: boolean): number {
    if (t <= 0 || s <= 0 || k <= 0) return 0;
    const d1 = (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) / (SIGMA * Math.sqrt(t));
    return isCall ? normalCdf(d1) : -normalCdf(-d1);
}

function gammaCalcJS(s: number, k: number, t: number): number {
    if (t <= 0 || s <= 0 || k <= 0) return 0;
    const d1 = (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) / (SIGMA * Math.sqrt(t));
    return normalPdf(d1) / (s * SIGMA * Math.sqrt(t));
}

function vegaCalcJS(s: number, k: number, t: number): number {
    if (t <= 0 || s <= 0 || k <= 0) return 0;
    const d1 = (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) / (SIGMA * Math.sqrt(t));
    return s * normalPdf(d1) * Math.sqrt(t) * 0.01;
}

function thetaCalcJS(s: number, k: number, t: number, isCall: boolean): number {
    if (t <= 0 || s <= 0 || k <= 0) return 0;
    const d1 = (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) / (SIGMA * Math.sqrt(t));
    const d2 = d1 - SIGMA * Math.sqrt(t);

    let thetaValue: number;
    if (isCall) {
        thetaValue = (-s * normalPdf(d1) * SIGMA) / (2 * Math.sqrt(t)) - R * k * Math.exp(-R * t) * normalCdf(d2);
    } else {
        thetaValue = (-s * normalPdf(d1) * SIGMA) / (2 * Math.sqrt(t)) - R * k * Math.exp(-R * t) * normalCdf(-d2);
    }
    return thetaValue / 365;
}

function rhoCalcJS(s: number, k: number, t: number, isCall: boolean): number {
    if (t <= 0 || s <= 0 || k <= 0) return 0;
    const d1 = (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) / (SIGMA * Math.sqrt(t));
    const d2 = d1 - SIGMA * Math.sqrt(t);

    let rhoValue: number;
    if (isCall) {
        rhoValue = k * t * Math.exp(-R * t) * normalCdf(d2);
    } else {
        rhoValue = -k * t * Math.exp(-R * t) * normalCdf(-d2);
    }
    return rhoValue * 0.01;
}

// =============================================================================
// P&L CHART FUNCTIONS
// =============================================================================

/**
 * Calculate single P&L value for an option position
 * @param price - Current underlying price
 * @param strikePrice - Option strike price
 * @param premium - Premium paid/received
 * @param contractType - 'call' or 'put'
 * @param positionType - 'long' or 'short'
 */
export function calculatePnL(
    price: number,
    strikePrice: number,
    premium: number,
    contractType: 'call' | 'put' | string,
    positionType: 'long' | 'short' | string
): number {
    const contractTypeNum = contractType === 'call' ? 0 : 1;
    const positionTypeNum = positionType === 'long' ? 0 : 1;

    if (wasmExports) {
        return wasmExports.calculate_pnl(price, strikePrice, premium, contractTypeNum, positionTypeNum);
    }
    return calculatePnLJS(price, strikePrice, premium, contractType, positionType);
}

/**
 * Generate batch P&L data for chart rendering
 * @param strikePrice - Option strike price
 * @param premium - Premium paid/received
 * @param contractType - 'call' or 'put'
 * @param positionType - 'long' or 'short'
 * @param rangePercent - Price range as percentage of strike (default: 0.2 = ±20%)
 * @param numPoints - Number of data points (default: 400)
 * @returns P&L data with prices, pnl values, and min/max
 */
export function generatePnLBatch(
    strikePrice: number,
    premium: number,
    contractType: 'call' | 'put' | string,
    positionType: 'long' | 'short' | string,
    rangePercent: number = 0.2,
    numPoints: number = 400
): PnLData {
    const contractTypeNum = contractType === 'call' ? 0 : 1;
    const positionTypeNum = positionType === 'long' ? 0 : 1;

    if (wasmExports) {
        // Use WASM for batch generation
        const count = wasmExports.generate_pnl_batch(
            strikePrice, premium, contractTypeNum, positionTypeNum, rangePercent, numPoints
        );

        if (count === 0) {
            return { prices: [], pnlData: [], minPnL: 0, maxPnL: 0 };
        }

        // Read data from WASM buffer
        const bufferPtr = wasmExports.get_pnl_buffer_ptr();
        const memory = new Float64Array(wasmExports.memory.buffer, bufferPtr, count * 2);

        const prices: number[] = [];
        const pnlData: number[] = [];

        for (let i = 0; i < count; i++) {
            prices.push(memory[i * 2]);
            pnlData.push(memory[i * 2 + 1]);
        }

        // Get min/max from WASM
        const rangePtr = wasmExports.get_buffer_ptr();
        wasmExports.get_pnl_range(count, rangePtr);
        const rangeMemory = new Float64Array(wasmExports.memory.buffer, rangePtr, 2);

        return {
            prices,
            pnlData,
            minPnL: rangeMemory[0],
            maxPnL: rangeMemory[1],
        };
    }

    // JavaScript fallback
    return generatePnLBatchJS(strikePrice, premium, contractType, positionType, rangePercent, numPoints);
}

// =============================================================================
// P&L JAVASCRIPT FALLBACKS
// =============================================================================

function calculatePnLJS(
    price: number,
    strikePrice: number,
    premium: number,
    contractType: string,
    positionType: string
): number {
    if (contractType === 'call') {
        if (positionType === 'long') {
            return Math.max(price - strikePrice, 0) - premium;
        } else {
            return premium - Math.max(price - strikePrice, 0);
        }
    } else {
        if (positionType === 'long') {
            return Math.max(strikePrice - price, 0) - premium;
        } else {
            return premium - Math.max(strikePrice - price, 0);
        }
    }
}

function generatePnLBatchJS(
    strikePrice: number,
    premium: number,
    contractType: string,
    positionType: string,
    rangePercent: number,
    numPoints: number
): PnLData {
    const range = strikePrice * rangePercent;
    const minPrice = strikePrice - range;
    const maxPrice = strikePrice + range;
    const priceStep = (maxPrice - minPrice) / (numPoints - 1);

    const prices: number[] = [];
    const pnlData: number[] = [];

    for (let i = 0; i < numPoints; i++) {
        const price = minPrice + i * priceStep;
        const pnl = calculatePnLJS(price, strikePrice, premium, contractType, positionType);
        prices.push(price);
        pnlData.push(pnl);
    }

    const maxPnL = Math.max(...pnlData);
    const minPnL = Math.min(...pnlData);

    return { prices, pnlData, minPnL, maxPnL };
}

// =============================================================================
// ORDER BOOK FUNCTIONS
// =============================================================================

export interface Order {
    id: number;
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    timestamp: number;
}

export interface OrderMatch {
    buyOrderId: number;
    sellOrderId: number;
    price: number;
    quantity: number;
}

export interface DepthData {
    bids: Array<{ price: number; quantity: number }>;
    asks: Array<{ price: number; quantity: number }>;
}

/** Initialize order book */
export function orderbookInit(): void {
    if (wasmExports) {
        wasmExports.orderbook_init();
    }
}

/** Add order to book */
export function orderbookAdd(order: Order): void {
    if (wasmExports) {
        wasmExports.orderbook_add(
            order.id,
            order.side === 'buy' ? 0 : 1,
            order.price,
            order.quantity,
            order.timestamp
        );
    }
}

/** Cancel order */
export function orderbookCancel(orderId: number): boolean {
    if (wasmExports) {
        return wasmExports.orderbook_cancel(orderId) === 1;
    }
    return false;
}

/** Get best bid/ask prices */
export function orderbookBestBid(): number {
    return wasmExports?.orderbook_best_bid() ?? -1;
}

export function orderbookBestAsk(): number {
    return wasmExports?.orderbook_best_ask() ?? -1;
}

/** Get spread and mid price */
export function orderbookSpread(): number {
    return wasmExports?.orderbook_spread() ?? -1;
}

export function orderbookMidPrice(): number {
    return wasmExports?.orderbook_mid_price() ?? -1;
}

/** Match orders and return matches */
export function orderbookMatch(): OrderMatch[] {
    if (!wasmExports) return [];

    const count = wasmExports.orderbook_match();
    if (count === 0) return [];

    const ptr = wasmExports.orderbook_match_ptr();
    const memory = new Float64Array(wasmExports.memory.buffer, ptr, count * 4);
    const matches: OrderMatch[] = [];

    for (let i = 0; i < count; i++) {
        matches.push({
            buyOrderId: memory[i * 4],
            sellOrderId: memory[i * 4 + 1],
            price: memory[i * 4 + 2],
            quantity: memory[i * 4 + 3],
        });
    }
    return matches;
}

/** Get depth data for visualization */
export function orderbookDepth(levels: number = 10): DepthData {
    if (!wasmExports) return { bids: [], asks: [] };

    const count = wasmExports.orderbook_depth(levels);
    if (count === 0) return { bids: [], asks: [] };

    const ptr = wasmExports.orderbook_depth_ptr();
    const memory = new Float64Array(wasmExports.memory.buffer, ptr, 2 + count * 2);

    const bidCount = memory[0];
    const askCount = memory[1];
    const bids: Array<{ price: number; quantity: number }> = [];
    const asks: Array<{ price: number; quantity: number }> = [];

    let offset = 2;
    for (let i = 0; i < bidCount; i++) {
        bids.push({ price: memory[offset], quantity: memory[offset + 1] });
        offset += 2;
    }
    for (let i = 0; i < askCount; i++) {
        asks.push({ price: memory[offset], quantity: memory[offset + 1] });
        offset += 2;
    }

    return { bids, asks };
}

// =============================================================================
// CRYPTO FUNCTIONS
// =============================================================================

/** SHA-256 hash of a string */
export function sha256(message: string): string {
    if (!wasmExports) {
        console.warn('[WASM] Crypto module not available');
        return '';
    }

    const encoder = new TextEncoder();
    const bytes = encoder.encode(message);

    // Copy message to WASM memory
    const ptr = wasmExports.get_buffer_ptr();
    const memory = new Uint8Array(wasmExports.memory.buffer, ptr, bytes.length);
    memory.set(bytes);

    wasmExports.crypto_sha256(ptr, bytes.length);
    wasmExports.crypto_hash_hex();

    const hexPtr = wasmExports.crypto_hex_ptr();
    const hexMemory = new Uint8Array(wasmExports.memory.buffer, hexPtr, 64);
    return new TextDecoder().decode(hexMemory);
}

/** HMAC-SHA256 sign a message */
export function hmacSign(key: string, message: string): Uint8Array {
    if (!wasmExports) {
        console.warn('[WASM] Crypto module not available');
        return new Uint8Array(32);
    }

    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(key);
    const msgBytes = encoder.encode(message);

    const bufferPtr = wasmExports.get_buffer_ptr();
    const keyPtr = bufferPtr;
    const msgPtr = bufferPtr + keyBytes.length;

    const memory = new Uint8Array(wasmExports.memory.buffer);
    memory.set(keyBytes, keyPtr);
    memory.set(msgBytes, msgPtr);

    wasmExports.crypto_sign(keyPtr, keyBytes.length, msgPtr, msgBytes.length);

    const sigPtr = wasmExports.crypto_sig_ptr();
    return new Uint8Array(wasmExports.memory.buffer.slice(sigPtr, sigPtr + 32));
}

/** Verify HMAC-SHA256 signature */
export function hmacVerify(key: string, message: string, signature: Uint8Array): boolean {
    if (!wasmExports) return false;

    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(key);
    const msgBytes = encoder.encode(message);

    const bufferPtr = wasmExports.get_buffer_ptr();
    const keyPtr = bufferPtr;
    const msgPtr = bufferPtr + keyBytes.length;
    const sigPtr = msgPtr + msgBytes.length;

    const memory = new Uint8Array(wasmExports.memory.buffer);
    memory.set(keyBytes, keyPtr);
    memory.set(msgBytes, msgPtr);
    memory.set(signature, sigPtr);

    return wasmExports.crypto_verify(keyPtr, keyBytes.length, msgPtr, msgBytes.length, sigPtr) === 1;
}

// =============================================================================
// ZK PRIVACY FUNCTIONS
// =============================================================================

/**
 * Generate a Pedersen Commitment
 */
export async function createCommitment(value: number, blinding: Uint8Array): Promise<ZkCommitment> {
    if (!wasmExports) throw new Error('WASM module not loaded');

    // In a real scenario, we'd use the generated JS wrapper. 
    // For now, we'll implement a minimal helper that matches the wasm-bindgen pattern
    // or just re-import from the pkg-web if we can.
    // However, to keep it simple and consistent with existing bridge:
    const zk = await import('./zk-utils');
    return zk.createCommitment(value, blinding);
}

/**
 * Generate a ZK Range Proof
 */
export async function createRangeProof(amount: number, blinding: Uint8Array): Promise<ZkRangeProof> {
    const zk = await import('./zk-utils');
    return zk.createRangeProof(amount, blinding);
}

/**
 * Generate a ZK Transfer Proof
 */
export async function createTransferProof(
    amount: number,
    balance: number,
    senderBlinding: Uint8Array,
    amountBlinding: Uint8Array
): Promise<ZkTransferProof> {
    const zk = await import('./zk-utils');
    return zk.createTransferProof(amount, balance, senderBlinding, amountBlinding);
}

