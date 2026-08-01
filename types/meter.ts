export interface MeterReading {
    id: string
    meter_serial: string
    kwh: number
    timestamp: string
    submitted_at: string
    /**
     * Read-only token-mint status derived by meter-service. 'not_applicable'
     * means the reading's 15-min billing window closed with net consumption
     * (no surplus) — nothing was ever going to mint for it.
     */
    mint_status: 'minted' | 'pending' | 'denied' | 'not_applicable'
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

/**
 * Per-zone energy flow within one `zone_id`. `net_flow > 0` = zone is a net
 * exporter; `< 0` = net importer. Mirrors meter-service `ZoneFlow`.
 */
export interface ZoneFlow {
    /** Zone partition id; null groups meters with no assigned zone (sorted last). */
    zone_id: number | null
    total_produced: number
    total_consumed: number
    /** total_produced - total_consumed for the zone. */
    net_flow: number
    reading_count: number
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
    /** Per-zone energy-flow breakdown, ordered by zone_id (unzoned last). */
    zones: ZoneFlow[]
}

/**
 * Map marker for a located meter (GET /api/v1/meters/map). Unlike
 * MeterResponse, latitude/longitude are always present — the backend query
 * filters to meters with coordinates. Returned across ALL users for the
 * dashboard map view (not caller-scoped), JWT still required.
 */
export interface MeterMapPoint {
    id: string
    serial_number: string
    meter_type: string
    location: string
    is_verified: boolean
    wallet_address: string
    /** Always present — query filters to located meters. */
    latitude: number
    /** Always present — query filters to located meters. */
    longitude: number
    zone_id?: number
}

export interface RegisterMeterResponse {
    success: boolean
    message: string
    meter?: MeterResponse
}

/**
 * Evidence a verification decision rested on. `attested_readings` counts the
 * readings from this meter whose device signature the Aggregator Bridge accepted
 * within `window_hours` — zero is why a verification is refused.
 */
export interface MeterAttestation {
    attested_readings: number
    window_hours: number
}

/**
 * Response of POST /api/v1/me/meters/{serial}/verify.
 *
 * Registering a meter only CLAIMS a serial (`is_verified: false`); this proves
 * possession against signed telemetry the bridge already accepted. Until it
 * succeeds the trading service refuses the owner's sell orders with 403.
 */
export interface VerifyMeterResponse {
    success: boolean
    message: string
    /** True when the meter was already verified and the call changed nothing. */
    already_verified: boolean
    attestation: MeterAttestation
    meter?: MeterResponse
}
