export interface MeterReading {
    id: string
    user_id: string
    wallet_address: string
    kwh_amount: string
    reading_timestamp: string
    submitted_at: string
    minted: boolean
    mint_tx_signature?: string
    meter_id?: string
    meter_serial?: string
    verification_status?: string
}

export interface SubmitReadingRequest {
    wallet_address?: string
    kwh_amount: number
    reading_timestamp: string
    meter_signature?: string
    meter_serial?: string
}

export interface MeterStats {
    total_produced: number
    last_reading_time: string | null
    total_minted: number
    pending_mint: number
}
