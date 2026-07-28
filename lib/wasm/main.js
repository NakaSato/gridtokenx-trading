/* @ts-self-types="./main.d.ts" */

export class AuctionSimulator {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AuctionSimulatorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_auctionsimulator_free(ptr, 0);
    }
    /**
     * @param {number} id
     * @param {number} price
     * @param {number} amount
     * @param {boolean} is_bid
     */
    add_order(id, price, amount, is_bid) {
        wasm.auctionsimulator_add_order(this.__wbg_ptr, id, price, amount, is_bid);
    }
    /**
     * Calculate Uniform Clearing Price (MCP) - O(n log n).
     * Returns [clearing_price, clearing_volume].
     *
     * Walks the cumulative demand (sorted by descending bid price) and
     * cumulative supply (sorted by ascending ask price) curves together,
     * tracking the maximum volume at which the marginal bid still clears the
     * marginal ask. The crossing stops as soon as the marginal bid price
     * drops below the marginal ask price.
     * @returns {Float64Array}
     */
    calculate_clearing_price() {
        const ret = wasm.auctionsimulator_calculate_clearing_price(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    clear() {
        wasm.auctionsimulator_clear(this.__wbg_ptr);
    }
    constructor() {
        const ret = wasm.auctionsimulator_new();
        this.__wbg_ptr = ret;
        AuctionSimulatorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) AuctionSimulator.prototype[Symbol.dispose] = AuctionSimulator.prototype.free;

/**
 * WASM-exposed governance client
 */
export class GovernanceClient {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GovernanceClientFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_governanceclient_free(ptr, 0);
    }
    /**
     * Initialize connection to the blockchain
     * Returns true if connection successful
     * @returns {boolean}
     */
    connect() {
        const ret = wasm.governanceclient_connect(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Create a new proposal
     *
     * # Arguments
     * * `title` - Proposal title
     * * `description` - Proposal description
     *
     * # Returns
     * The new proposal ID
     * @param {string} title
     * @param {string} description
     * @returns {string}
     */
    create_proposal(title, description) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(title, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(description, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.governanceclient_create_proposal(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * Fetch PoA configuration from the blockchain
     * This would call the program's poAConfig account
     * @returns {any}
     */
    fetch_poa_config() {
        const ret = wasm.governanceclient_fetch_poa_config(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Get the full governance state as JSON
     * @returns {any}
     */
    get_state() {
        const ret = wasm.governanceclient_get_state(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Check if connected to the blockchain
     * @returns {boolean}
     */
    get is_connected() {
        const ret = wasm.governanceclient_is_connected(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Create a new governance client
     *
     * # Arguments
     * * `rpc_url` - Solana RPC endpoint (e.g., "http://127.0.0.1:8899")
     * * `program_id` - Governance program public key
     * @param {string} rpc_url
     * @param {string} program_id
     */
    constructor(rpc_url, program_id) {
        const ptr0 = passStringToWasm0(rpc_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(program_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.governanceclient_new(ptr0, len0, ptr1, len1);
        this.__wbg_ptr = ret;
        GovernanceClientFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Get PoA config as JSON
     * @returns {any}
     */
    get poa_config() {
        const ret = wasm.governanceclient_poa_config(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Get program ID
     * @returns {string}
     */
    get program_id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.governanceclient_program_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get current proposals as JSON
     * @returns {any}
     */
    get proposals() {
        const ret = wasm.governanceclient_proposals(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Get RPC URL
     * @returns {string}
     */
    get rpc_url() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.governanceclient_rpc_url(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
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
     * @param {string} proposal_id
     * @param {boolean} support
     * @param {bigint} private_balance
     * @param {string} _root_seed
     * @returns {string}
     */
    vote_private(proposal_id, support, private_balance, _root_seed) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(proposal_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(_root_seed, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.governanceclient_vote_private(this.__wbg_ptr, ptr0, len0, support, private_balance, ptr1, len1);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
}
if (Symbol.dispose) GovernanceClient.prototype[Symbol.dispose] = GovernanceClient.prototype.free;

export class Greeks {
    static __wrap(ptr) {
        const obj = Object.create(Greeks.prototype);
        obj.__wbg_ptr = ptr;
        GreeksFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GreeksFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_greeks_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get delta() {
        const ret = wasm.__wbg_get_greeks_delta(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get gamma() {
        const ret = wasm.__wbg_get_greeks_gamma(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get rho() {
        const ret = wasm.__wbg_get_greeks_rho(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get theta() {
        const ret = wasm.__wbg_get_greeks_theta(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get vega() {
        const ret = wasm.__wbg_get_greeks_vega(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set delta(arg0) {
        wasm.__wbg_set_greeks_delta(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set gamma(arg0) {
        wasm.__wbg_set_greeks_gamma(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set rho(arg0) {
        wasm.__wbg_set_greeks_rho(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set theta(arg0) {
        wasm.__wbg_set_greeks_theta(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set vega(arg0) {
        wasm.__wbg_set_greeks_vega(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Greeks.prototype[Symbol.dispose] = Greeks.prototype.free;

export class OrderBook {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OrderBookFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_orderbook_free(ptr, 0);
    }
    /**
     * Add an order to the book - O(log n) insertion
     * @param {number} id
     * @param {number} side
     * @param {number} price
     * @param {number} quantity
     * @param {bigint} timestamp
     */
    add_order(id, side, price, quantity, timestamp) {
        wasm.orderbook_add_order(this.__wbg_ptr, id, side, price, quantity, timestamp);
    }
    /**
     * @returns {number}
     */
    ask_count() {
        const ret = wasm.orderbook_ask_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get best ask price - O(1) with BTreeMap (lowest ask first)
     * @returns {number}
     */
    best_ask_price() {
        const ret = wasm.orderbook_best_ask_price(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get best bid price - O(1) with BTreeMap (highest bid first)
     * @returns {number}
     */
    best_bid_price() {
        const ret = wasm.orderbook_best_bid_price(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    bid_count() {
        const ret = wasm.orderbook_bid_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Cancel order - O(1) lookup with HashMap index
     * @param {number} order_id
     * @returns {boolean}
     */
    cancel_order(order_id) {
        const ret = wasm.orderbook_cancel_order(this.__wbg_ptr, order_id);
        return ret !== 0;
    }
    /**
     * Clear all orders
     */
    clear() {
        wasm.orderbook_clear(this.__wbg_ptr);
    }
    /**
     * Get depth data for visualization - optimized iteration.
     * Returns: { bids: [[price, cum_qty], ...], asks: [[price, cum_qty], ...] }
     *
     * Each BTreeMap entry is already one distinct price level (a Vec of the
     * orders resting at that price), so we walk at most `levels` entries and
     * sum the quantities at each — O(levels) with no manual grouping.
     * @param {number} levels
     * @returns {any}
     */
    get_depth(levels) {
        const ret = wasm.orderbook_get_depth(this.__wbg_ptr, levels);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Bulk load orders - optimized to avoid per-insert overhead.
     *
     * Accepts the same numeric `side` (0 = Buy, 1 = Sell) shape as
     * [`add_order`], not the `Side` enum's serde variant names, so both entry
     * points share one wire contract.
     * @param {any} orders
     */
    load_orders(orders) {
        const ret = wasm.orderbook_load_orders(this.__wbg_ptr, orders);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Match orders - optimized with BTreeMap
     * @returns {any}
     */
    match_orders() {
        const ret = wasm.orderbook_match_orders(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @returns {number}
     */
    mid_price() {
        const ret = wasm.orderbook_mid_price(this.__wbg_ptr);
        return ret;
    }
    constructor() {
        const ret = wasm.orderbook_new();
        this.__wbg_ptr = ret;
        OrderBookFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    spread() {
        const ret = wasm.orderbook_spread(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) OrderBook.prototype[Symbol.dispose] = OrderBook.prototype.free;

/**
 * Proposal status variants
 * @enum {0 | 1 | 2}
 */
export const ProposalStatus = Object.freeze({
    Active: 0, "0": "Active",
    Passed: 1, "1": "Passed",
    Failed: 2, "2": "Failed",
});

export class Simulation {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SimulationFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_simulation_free(ptr, 0);
    }
    /**
     * Returns the current state of all flows
     * @returns {any}
     */
    get_flows() {
        const ret = wasm.simulation_get_flows(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Calculate aggregate grid totals in WASM
     * @returns {any}
     */
    get_grid_totals() {
        const ret = wasm.simulation_get_grid_totals(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Returns the current state of all nodes
     * @returns {any}
     */
    get_nodes() {
        const ret = wasm.simulation_get_nodes(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    constructor() {
        const ret = wasm.simulation_new();
        this.__wbg_ptr = ret;
        SimulationFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {any} flows
     */
    set_flows(flows) {
        const ret = wasm.simulation_set_flows(this.__wbg_ptr, flows);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {any} nodes
     */
    set_nodes(nodes) {
        const ret = wasm.simulation_set_nodes(this.__wbg_ptr, nodes);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} hour
     * @param {number} minute
     */
    update(hour, minute) {
        wasm.simulation_update(this.__wbg_ptr, hour, minute);
    }
}
if (Symbol.dispose) Simulation.prototype[Symbol.dispose] = Simulation.prototype.free;

/**
 * @param {any} readings_js
 * @returns {any}
 */
export function aggregate_readings(readings_js) {
    const ret = wasm.aggregate_readings(readings_js);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {number} s
 * @param {number} k
 * @param {number} t
 * @param {boolean} is_call
 * @returns {number}
 */
export function black_scholes(s, k, t, is_call) {
    const ret = wasm.black_scholes(s, k, t, is_call);
    return ret;
}

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} curve_intensity
 * @param {number} segments
 * @returns {Float64Array}
 */
export function calculate_bezier(x1, y1, x2, y2, curve_intensity, segments) {
    const ret = wasm.calculate_bezier(x1, y1, x2, y2, curve_intensity, segments);
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
}

/**
 * @param {number} s
 * @param {number} k
 * @param {number} t
 * @param {boolean} is_call
 * @returns {Greeks}
 */
export function calculate_greeks(s, k, t, is_call) {
    const ret = wasm.calculate_greeks(s, k, t, is_call);
    return Greeks.__wrap(ret);
}

/**
 * @param {any} positions_js
 * @returns {any}
 */
export function calculate_portfolio_risk(positions_js) {
    const ret = wasm.calculate_portfolio_risk(positions_js);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Verify an HMAC-SHA256 signature
 * @param {Uint8Array} key
 * @param {Uint8Array} message
 * @param {string} signature_hex
 * @returns {boolean}
 */
export function crypto_verify(key, message, signature_hex) {
    const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(message, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(signature_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.crypto_verify(ptr0, len0, ptr1, len1, ptr2, len2);
    return ret !== 0;
}

/**
 * @param {number} s
 * @param {number} k
 * @param {number} t
 * @param {boolean} is_call
 * @returns {number}
 */
export function delta_calc(s, k, t, is_call) {
    const ret = wasm.delta_calc(s, k, t, is_call);
    return ret;
}

/**
 * @param {number} s
 * @param {number} k
 * @param {number} t
 * @returns {number}
 */
export function gamma_calc(s, k, t) {
    const ret = wasm.gamma_calc(s, k, t);
    return ret;
}

/**
 * Compute HMAC-SHA256
 * Returns hex string
 * @param {Uint8Array} key
 * @param {Uint8Array} message
 * @returns {string}
 */
export function hmac_sha256(key, message) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(message, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.hmac_sha256(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Initializes the panic hook for the WASM library.
 */
export function init_panic_hook() {
    wasm.init_panic_hook();
}

/**
 * @param {any} chars
 * @returns {any}
 */
export function perform_clustering(chars) {
    const ret = wasm.perform_clustering(chars);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {number} s
 * @param {number} k
 * @param {number} t
 * @param {boolean} is_call
 * @returns {number}
 */
export function rho_calc(s, k, t, is_call) {
    const ret = wasm.rho_calc(s, k, t, is_call);
    return ret;
}

/**
 * Compute SHA-256 hash of input bytes
 * Returns hex string
 * @param {Uint8Array} data
 * @returns {string}
 */
export function sha256(data) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.sha256(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {number} s
 * @param {number} k
 * @param {number} t
 * @param {boolean} is_call
 * @returns {number}
 */
export function theta_calc(s, k, t, is_call) {
    const ret = wasm.theta_calc(s, k, t, is_call);
    return ret;
}

/**
 * @param {number} s
 * @param {number} k
 * @param {number} t
 * @returns {number}
 */
export function vega_calc(s, k, t) {
    const ret = wasm.vega_calc(s, k, t);
    return ret;
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_92b29b0548f8b746: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_9a4e0ecb0fa16705: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_bigint_get_as_i64_d968e41184ae354f: function(arg0, arg1) {
            const v = arg1;
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_boolean_get_fa956cfa2d1bd751: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_c25d447a39f5578f: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_aca499c5de7ff5e5: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_bigint_2f76dc55065b4273: function(arg0) {
            const ret = typeof(arg0) === 'bigint';
            return ret;
        },
        __wbg___wbindgen_is_function_1ff95bcc5517c252: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_a27215656b807791: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_undefined_c05833b95a3cf397: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_eq_e659fcf7b0e32763: function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_db4c3b15f63fc170: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_number_get_394265ed1e1b84ee: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_b0ca35b86a603356: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_344f42d3211c4765: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_8a2dd23819f8a60a: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_done_89b2b13e91a60321: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_get_c7eb1f358a7654df: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_unchecked_6e0ad6d2a41b06f6: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_instanceof_ArrayBuffer_4480b9e0068a8adb: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_309b927aaf7a3fc7: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_0677c962b281d01a: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_isSafeInteger_04f36e4056f1b851: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_iterator_6f722e4a93058b71: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_length_1f0964f4a5e2c6d8: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_370319915dc99107: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_32b398fb48b6d94a: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_cd45aabdf6073e84: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_da52cf8fe3429cb2: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_next_6dbf2c0ac8cde20f: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_next_71f2aa1cb3d1e37e: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_now_86c0d4ba3fa605b8: function() {
            const ret = Date.now();
            return ret;
        },
        __wbg_prototypesetcall_4770620bbe4688a0: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_random_039a7d5d06e0d333: function() {
            const ret = Math.random();
            return ret;
        },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_8a16b38e4805b298: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_value_a5d5488a9589444a: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0) {
            // Cast intrinsic for `I64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./main_bg.js": import0,
    };
}

const AuctionSimulatorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_auctionsimulator_free(ptr, 1));
const GovernanceClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_governanceclient_free(ptr, 1));
const GreeksFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_greeks_free(ptr, 1));
const OrderBookFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_orderbook_free(ptr, 1));
const SimulationFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_simulation_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('main_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
