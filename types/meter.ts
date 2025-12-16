export interface MeterReading {
    id: string
    meter_serial: string
    kwh: number
    timestamp: string
    submitted_at: string
    minted: boolean
    tx_signature?: string
    message?: string
}

export interface MeterResponse {
    id: string
    serial_number: string
    meter_type: string
    location: string
    is_verified: boolean
    wallet_address: string
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
