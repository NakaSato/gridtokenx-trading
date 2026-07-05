export interface MeterReading {
    id: string
    meter_serial: string
    kwh: number
    timestamp: string
    submitted_at: string
    /** Read-only token-mint status derived by meter-service: 'minted' | 'pending' | 'denied'. */
    mint_status: 'minted' | 'pending' | 'denied'
    /** On-chain mint tx signature, present when mint_status === 'minted'. */
    mint_tx_signature?: string

    // Energy Data
    energy_generated?: number
    energy_consumed?: number
    surplus_energy?: number
    deficit_energy?: number

    // Electrical Parameters
    voltage?: number
    current?: number
    power_factor?: number
    frequency?: number
    temperature?: number

    // Location (GPS)
    latitude?: number
    longitude?: number

    // Battery & Environmental
    battery_level?: number
    weather_condition?: string

    // Trading & Certification
    rec_eligible?: boolean
    carbon_offset?: number
    max_sell_price?: number
    max_buy_price?: number

    // Security
    meter_signature?: string
    meter_type?: string
}

export interface MeterResponse {
    id: string
    serial_number: string
    meter_type: string
    location: string
    is_verified: boolean
    wallet_address: string
    /** Latitude coordinate for map display */
    latitude?: number
    /** Longitude coordinate for map display */
    longitude?: number
    /** Zone ID for grid topology and pricing */
    zone_id?: number
}

/**
 * Public meter response (for unauthenticated public API).
 * Contains only privacy-safe fields - no id, serial_number, or wallet_address.
 */
export interface PublicMeterResponse {
    /**
     * Backend meter/node id (opaque, not the serial number). Used as the map
     * node id so grid-flow endpoints (from_meter_id) and WS telemetry keys
     * match nodes — see docs/MAP_REAL_DATA_API.md.
     */
    meter_id?: string
    location: string
    meter_type: string
    is_verified: boolean
    /** Latitude coordinate for map display */
    latitude?: number
    /** Longitude coordinate for map display */
    longitude?: number
    /** Latest energy generation reading (kWh) */
    current_generation?: number
    /** Latest energy consumption reading (kWh) */
    current_consumption?: number
    /** Electrical: Grid voltage in Volts */
    voltage?: number
    /** Electrical: Current in Amperes */
    current?: number
    /** Electrical: Grid frequency in Hz */
    frequency?: number
    /** Electrical: Power factor (0-1) */
    power_factor?: number
    /** Energy: Surplus energy available for trading (kWh) */
    surplus_energy?: number
    /** Energy: Deficit energy needed from grid (kWh) */
    deficit_energy?: number
    /** Zone ID for grid topology and pricing */
    zone_id?: number
    /** Rated capacity in kWh (replaces hardcoded map default). */
    capacity_kwh?: number
    /** Generator efficiency 0-100 (replaces hardcoded map default). */
    efficiency_pct?: number
}

export interface SubmitReadingRequest {
    wallet_address?: string
    kwh_amount: number
    reading_timestamp: string
    meter_signature?: string
    meter_serial?: string

    // Energy Data
    energy_generated?: number
    energy_consumed?: number
    surplus_energy?: number
    deficit_energy?: number

    // Electrical Parameters
    voltage?: number
    current?: number
    power_factor?: number
    frequency?: number
    temperature?: number

    // Location
    latitude?: number
    longitude?: number

    // Battery & Environmental
    battery_level?: number
    weather_condition?: string

    // Trading
    rec_eligible?: boolean
    carbon_offset?: number
    max_sell_price?: number
    max_buy_price?: number

    // Meter Type
    meter_type?: string
}

export interface MeterStats {
    total_produced: number
    total_consumed: number
    last_reading_time: string | null
    /** Count of readings whose tokens are minted on-chain. */
    minted_count: number
    /** Count of readings not yet minted. */
    pending_count: number
    /** Count of readings whose mint was denied/failed. */
    denied_count: number
}

export interface RegisterMeterResponse {
    success: boolean
    message: string
    meter?: MeterResponse
}
