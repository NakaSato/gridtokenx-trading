/**
 * WASM Bridge for GridTokenX Platform
 *
 * TypeScript wrapper to load and call WASM functions for
 * Options pricing, Energy Grid calculations, and Simulation.
 */

import init, {
  InitOutput,
  Simulation,
  OrderBook as WasmOrderBook,
  AuctionSimulator as WasmAuctionSimulator,
  calculate_bezier,
  create_commitment as wasm_create_commitment,
  create_range_proof as wasm_create_range_proof,
  create_transfer_proof as wasm_create_transfer_proof,
  crypto_verify as wasm_crypto_verify,
  hmac_sha256 as wasm_hmac_sha256,
  sha256 as wasm_sha256,
  sign_p2p_order as wasm_sign_p2p_order,
} from './wasm-generated/gridtokenx_wasm'

export interface Greeks {
  delta: number
  gamma: number
  vega: number
  theta: number
  rho: number
}

export interface PnLData {
  prices: number[]
  pnlData: number[]
  minPnL: number
  maxPnL: number
}

export interface ZkCommitment {
  point: number[]
}

export interface ZkRangeProof {
  proof_data: number[]
  commitment: ZkCommitment
}

export interface ZkEqualityProof {
  challenge: number[]
  response: number[]
}

export interface ZkTransferProof {
  amount_commitment: ZkCommitment
  amount_range_proof: ZkRangeProof
  remaining_range_proof: ZkRangeProof
  balance_proof: ZkEqualityProof
}

export type WasmExports = InitOutput

// Export classes for use in other components
export { Simulation, WasmOrderBook, WasmAuctionSimulator }

let wasmExports: WasmExports | null = null
let wasmLoadPromise: Promise<WasmExports | null> | null = null
let wasmLoadAttempted = false

// Singleton instances for common shared state
let orderBookInstance: WasmOrderBook | null = null
let auctionSimulatorInstance: WasmAuctionSimulator | null = null

// Helper to check if wasm is loaded
export function isWasmLoaded(): boolean {
  return wasmExports !== null
}

// Helper to check if wasm loading was attempted (even if it failed)
export function wasWasmLoadAttempted(): boolean {
  return wasmLoadAttempted
}

/**
 * Initialize the WASM module
 * Falls back gracefully if WASM is not available
 */
export async function initWasm(
  wasmPath: string = '/gridtokenx_wasm.wasm'
): Promise<WasmExports | null> {
  // Skip on server side
  if (typeof window === 'undefined') {
    console.log('[WASM] Skipping initialization on server side')
    return null
  }

  if (wasmExports) {
    return wasmExports
  }

  if (wasmLoadPromise) {
    return wasmLoadPromise
  }

  wasmLoadAttempted = true

  wasmLoadPromise = (async () => {
    try {
      // Dynamic import with error handling
      const exports = await init(wasmPath)
      wasmExports = exports
      console.log('[WASM] Module initialized successfully')
      return wasmExports
    } catch (error) {
      console.warn(
        '[WASM] Failed to load module, JS fallbacks will be used:',
        error instanceof Error ? error.message : error
      )
      wasmLoadPromise = null
      // Don't throw - allow app to continue with JS fallbacks
      return null
    }
  })()

  return wasmLoadPromise
}

/**
 * Simple currency conversion utility
 * @param amount Amount in base currency
 * @param price Current price multiplier
 * @returns Converted value
 */
export function convertPrice(amount: number, price: number): number {
  return amount * price
}

/**
 * Defer WASM initialization to not block main thread
 */
export function deferWasmInit(): void {
  if (typeof window === 'undefined') return

  if ('requestIdleCallback' in window) {
    ; (
      window as Window & { requestIdleCallback: (cb: () => void) => void }
    ).requestIdleCallback(() => {
      initWasm().catch(() => { })
    })
  } else {
    setTimeout(() => {
      initWasm().catch(() => { })
    }, 100)
  }
}

/**
 * Get raw WASM exports (for advanced usage)
 */
export function getWasmExports(): WasmExports | null {
  return wasmExports
}

// =============================================================================
// OPTIONS PRICING FUNCTIONS
// =============================================================================

export function blackScholes(
  s: number,
  k: number,
  t: number,
  isCall: boolean
): number {
  return blackScholesJS(s, k, t, isCall)
}

export function deltaCalc(
  s: number,
  k: number,
  t: number,
  isCall: boolean
): number {
  return deltaCalcJS(s, k, t, isCall)
}

export function gammaCalc(s: number, k: number, t: number): number {
  return gammaCalcJS(s, k, t)
}

export function vegaCalc(s: number, k: number, t: number): number {
  return vegaCalcJS(s, k, t)
}

export function thetaCalc(
  s: number,
  k: number,
  t: number,
  isCall: boolean
): number {
  return thetaCalcJS(s, k, t, isCall)
}

export function rhoCalc(
  s: number,
  k: number,
  t: number,
  isCall: boolean
): number {
  return rhoCalcJS(s, k, t, isCall)
}

export function calculateGreeks(
  s: number,
  k: number,
  t: number,
  isCall: boolean
): Greeks {
  return {
    delta: deltaCalcJS(s, k, t, isCall),
    gamma: gammaCalcJS(s, k, t),
    vega: vegaCalcJS(s, k, t),
    theta: thetaCalcJS(s, k, t, isCall),
    rho: rhoCalcJS(s, k, t, isCall),
  }
}

// =============================================================================
// ENERGY GRID FUNCTIONS
// =============================================================================

export function calculateBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  intensity: number,
  segments: number
): [number, number][] {
  if (!isWasmLoaded()) return []

  const points = calculate_bezier(x1, y1, x2, y2, intensity, segments)
  const result: [number, number][] = []

  for (let i = 0; i < points.length; i += 2) {
    result.push([points[i], points[i + 1]])
  }

  return result
}

// =============================================================================
// ORDER BOOK FUNCTIONS
// =============================================================================

export interface Order {
  id: number
  side: 'buy' | 'sell'
  price: number
  quantity: number
  timestamp: number
}

export function orderbookInit(): void {
  if (isWasmLoaded() && !orderBookInstance) {
    orderBookInstance = new WasmOrderBook()
  }
}

export function orderbookAdd(order: Order): void {
  if (!orderBookInstance) orderbookInit()
  if (orderBookInstance) {
    orderBookInstance.add_order(
      Number(order.id),
      order.side === 'buy' ? 0 : 1, // WASM uses u8 for side, 0=Buy, 1=Sell
      order.price,
      order.quantity,
      BigInt(order.timestamp)
    )
  }
}

export function orderbookCancel(orderId: number): boolean {
  if (orderBookInstance) {
    return orderBookInstance.cancel_order(Number(orderId))
  }
  return false
}

export function orderbookBestBid(): number {
  return orderBookInstance?.best_bid_price() ?? -1
}

export function orderbookBestAsk(): number {
  return orderBookInstance?.best_ask_price() ?? -1
}

export function orderbookSpread(): number {
  return orderBookInstance?.spread() ?? -1
}

export function orderbookMidPrice(): number {
  return orderBookInstance?.mid_price() ?? -1
}

// =============================================================================
// AUCTION FUNCTIONS
// =============================================================================

export function auctionInit(): void {
  if (isWasmLoaded() && !auctionSimulatorInstance) {
    auctionSimulatorInstance = new WasmAuctionSimulator()
  }
}

export function auctionAddOrder(
  id: number,
  price: number,
  amount: number,
  is_bid: boolean
): void {
  if (!auctionSimulatorInstance) auctionInit()
  if (auctionSimulatorInstance) {
    auctionSimulatorInstance.add_order(Number(id), price, amount, is_bid)
  }
}

export function auctionCalculateClearingPrice(): {
  price: number
  volume: number
} {
  if (!auctionSimulatorInstance) return { price: 0, volume: 0 }
  const result = auctionSimulatorInstance.calculate_clearing_price()
  // Returns [clearing_price, clearing_volume]
  return {
    price: result[0] || 0,
    volume: result[1] || 0,
  }
}

export function auctionClear(): void {
  if (auctionSimulatorInstance) {
    auctionSimulatorInstance.clear()
  }
}

// =============================================================================
// P&L CHART FUNCTIONS
// =============================================================================

export function calculatePnL(
  price: number,
  strikePrice: number,
  premium: number,
  contractType: 'call' | 'put' | string,
  positionType: 'long' | 'short' | string
): number {
  if (contractType === 'call') {
    if (positionType === 'long') {
      return Math.max(price - strikePrice, 0) - premium
    } else {
      return premium - Math.max(price - strikePrice, 0)
    }
  } else {
    if (positionType === 'long') {
      return Math.max(strikePrice - price, 0) - premium
    } else {
      return premium - Math.max(strikePrice - price, 0)
    }
  }
}

export function generatePnLBatch(
  strikePrice: number,
  premium: number,
  contractType: 'call' | 'put' | string,
  positionType: 'long' | 'short' | string,
  rangePercent: number = 0.2,
  numPoints: number = 400
): PnLData {
  const range = strikePrice * rangePercent
  const minPrice = strikePrice - range
  const maxPrice = strikePrice + range
  const priceStep = (maxPrice - minPrice) / (numPoints - 1)

  const prices: number[] = []
  const pnlData: number[] = []

  for (let i = 0; i < numPoints; i++) {
    const price = minPrice + i * priceStep
    const pnl = calculatePnL(
      price,
      strikePrice,
      premium,
      contractType,
      positionType
    )
    prices.push(price)
    pnlData.push(pnl)
  }

  return {
    prices,
    pnlData,
    minPnL: Math.min(...pnlData),
    maxPnL: Math.max(...pnlData),
  }
}

// =============================================================================
// JAVASCRIPT FALLBACKS
// =============================================================================

const R = 0.0
const SIGMA = 0.5

function normalCdf(z: number): number {
  const beta1 = -0.0004406
  const beta2 = 0.0418198
  const beta3 = 0.9
  const exponent =
    -Math.sqrt(Math.PI) *
    (beta1 * Math.pow(z, 5) + beta2 * Math.pow(z, 3) + beta3 * z)
  return 1.0 / (1.0 + Math.exp(exponent))
}

function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

function blackScholesJS(
  s: number,
  k: number,
  t: number,
  isCall: boolean
): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + 0.5 * SIGMA * SIGMA) * t) / (SIGMA * Math.sqrt(t))
  const d2 = d1 - SIGMA * Math.sqrt(t)
  if (isCall) return s * normalCdf(d1) - k * Math.exp(-R * t) * normalCdf(d2)
  return k * Math.exp(-R * t) * normalCdf(-d2) - s * normalCdf(-d1)
}

function deltaCalcJS(s: number, k: number, t: number, isCall: boolean): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) /
    (SIGMA * Math.sqrt(t))
  return isCall ? normalCdf(d1) : -normalCdf(-d1)
}

function gammaCalcJS(s: number, k: number, t: number): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) /
    (SIGMA * Math.sqrt(t))
  return normalPdf(d1) / (s * SIGMA * Math.sqrt(t))
}

function vegaCalcJS(s: number, k: number, t: number): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) /
    (SIGMA * Math.sqrt(t))
  return s * normalPdf(d1) * Math.sqrt(t) * 0.01
}

function thetaCalcJS(s: number, k: number, t: number, isCall: boolean): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) /
    (SIGMA * Math.sqrt(t))
  const d2 = d1 - SIGMA * Math.sqrt(t)
  let thetaValue =
    (-s * normalPdf(d1) * SIGMA) / (2 * Math.sqrt(t)) -
    R * k * Math.exp(-R * t) * normalCdf(isCall ? d2 : -d2)
  return thetaValue / 365
}

function rhoCalcJS(s: number, k: number, t: number, isCall: boolean): number {
  if (t <= 0 || s <= 0 || k <= 0) return 0
  const d1 =
    (Math.log(s / k) + (R + Math.pow(SIGMA, 2) / 2) * t) /
    (SIGMA * Math.sqrt(t))
  const d2 = d1 - SIGMA * Math.sqrt(t)
  return (
    (isCall ? 1 : -1) *
    k *
    t *
    Math.exp(-R * t) *
    normalCdf(isCall ? d2 : -d2) *
    0.01
  )
}

// =============================================================================
// CRYPTO & ZK
// =============================================================================

export function sha256(message: string): string {
  if (!isWasmLoaded()) return ''
  const encoder = new TextEncoder()
  return wasm_sha256(encoder.encode(message))
}

export function hmacSign(key: string, message: string): Uint8Array {
  if (!isWasmLoaded()) return new Uint8Array(32)
  const encoder = new TextEncoder()
  const hex = wasm_hmac_sha256(encoder.encode(key), encoder.encode(message))
  // Convert hex result to Uint8Array
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

export function hmacVerify(
  key: string,
  message: string,
  signature: Uint8Array
): boolean {
  if (!isWasmLoaded()) return false
  const encoder = new TextEncoder()
  const sigHex = Array.from(signature)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return wasm_crypto_verify(
    encoder.encode(key),
    encoder.encode(message),
    sigHex
  )
}

/**
 * High-level wrapper for P2P order signing
 */
export function signP2POrder(
  side: string,
  amount: string,
  price: string,
  timestamp: number,
  secret_key: Uint8Array
): string {
  if (!isWasmLoaded()) return ''
  try {
    return wasm_sign_p2p_order(side, amount, price, BigInt(timestamp), secret_key)
  } catch (e) {
    console.error('[WASM] Failed to sign P2P order:', e)
    return ''
  }
}

export async function createCommitment(
  value: number,
  blinding: Uint8Array
): Promise<ZkCommitment> {
  if (!isWasmLoaded()) throw new Error('WASM not loaded')
  return wasm_create_commitment(BigInt(value), blinding)
}

export async function createRangeProof(
  amount: number,
  blinding: Uint8Array
): Promise<ZkRangeProof> {
  if (!isWasmLoaded()) throw new Error('WASM not loaded')
  return wasm_create_range_proof(BigInt(amount), blinding)
}

export async function createTransferProof(
  amount: number,
  balance: number,
  senderBlinding: Uint8Array,
  amountBlinding: Uint8Array
): Promise<ZkTransferProof> {
  if (!isWasmLoaded()) throw new Error('WASM not loaded')
  return wasm_create_transfer_proof(
    BigInt(amount),
    BigInt(balance),
    senderBlinding,
    amountBlinding
  )
}
