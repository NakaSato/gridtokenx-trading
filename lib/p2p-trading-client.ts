/**
 * P2P Trading Client for GridTokenX Platform
 *
 * This client provides a higher-level abstraction for interacting with
 * the P2P trading API, handling the client-side signing automatically.
 */

import { ApiClient } from './api-client'
import { signP2POrder, isWasmLoaded, initWasm } from './wasm-bridge'

export interface P2POrderParams {
    side: 'buy' | 'sell'
    amount: number | string
    price_per_kwh: number | string
    zone_id?: number
    meter_id?: string
}

export class P2PTradingClient {
    private apiClient: ApiClient
    private encryptionSecret?: Uint8Array

    constructor(apiClient: ApiClient, encryptionSecret?: Uint8Array | string) {
        this.apiClient = apiClient

        if (typeof encryptionSecret === 'string') {
            const encoder = new TextEncoder()
            this.encryptionSecret = encoder.encode(encryptionSecret)
        } else {
            this.encryptionSecret = encryptionSecret
        }
    }

    /**
     * Set or update the encryption secret used for signing
     */
    setEncryptionSecret(secret: Uint8Array | string): void {
        if (typeof secret === 'string') {
            const encoder = new TextEncoder()
            this.encryptionSecret = encoder.encode(secret)
        } else {
            this.encryptionSecret = secret
        }
    }

    /**
     * Create a signed P2P order
     */
    async createSignedOrder(params: P2POrderParams): Promise<any> {
        if (!this.encryptionSecret) {
            throw new Error('Encryption secret is required for signing P2P orders')
        }

        // Ensure WASM is loaded
        if (!isWasmLoaded()) {
            await initWasm()
        }

        const timestamp = Date.now()
        const amountStr = params.amount.toString()
        const priceStr = params.price_per_kwh.toString()

        // Generate HMAC signature using WASM
        const signature = signP2POrder(
            params.side,
            amountStr,
            priceStr,
            timestamp,
            this.encryptionSecret
        )

        if (!signature) {
            throw new Error('Failed to generate order signature')
        }

        // Use the existing trading API but with signature fields
        return this.apiClient.createOrder({
            side: params.side,
            energy_amount: amountStr,
            price_per_kwh: priceStr,
            order_type: 'limit',
            zone_id: params.zone_id,
            meter_id: params.meter_id,
            signature,
            timestamp
        })
    }

    /**
     * Calculate P2P transaction costs for a potential trade
     */
    async calculateCost(params: {
        buyer_zone_id: number
        seller_zone_id: number
        energy_amount: number
        agreed_price?: number
    }) {
        return this.apiClient.calculateP2PCost(params)
    }

    /**
     * Get current market pricing from the P2P simulator
     */
    async getMarketPrices() {
        return this.apiClient.getP2PMarketPrices()
    }

    /**
     * Get the current P2P orderbook
     */
    async getOrderBook() {
        return this.apiClient.getP2POrderBook()
    }
}

/**
 * Factory function to create a P2P trading client
 */
export function createP2PClient(
    apiClient: ApiClient,
    encryptionSecret?: Uint8Array | string
): P2PTradingClient {
    return new P2PTradingClient(apiClient, encryptionSecret)
}
