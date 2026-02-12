/**
 * Grid-related types and interfaces
 */

export interface ZoneGridStatus {
    zone_id: number
    generation: number
    consumption: number
    net_balance: number
    active_meters: number
}

export interface FrequencyStatus {
    value: number
    rocof: number
    angle?: number
}

export interface IslandStatus {
    is_islanded: boolean
    forming_meter?: string
}

export interface TariffStatus {
    tariff_type: string
    import_rate: number
    export_rate: number
    is_peak: boolean
    forecast: number[]
}

export interface ADREvent {
    active: boolean
    event_type: string | null
    modifier: number
}

export interface LoadForecast {
    generation: number[]
    consumption: number[]
}

export interface EVFleetStatus {
    total_evs: number
    avg_soc: number
    v2g_active: number
    available_capacity_kwh: number
}

export interface GridStatus {
    total_generation: number
    total_consumption: number
    net_balance: number
    active_meters: number
    co2_saved_kg: number
    timestamp: string
    zones?: Record<string, ZoneGridStatus>
    frequency?: FrequencyStatus
    island_status?: IslandStatus
    health_score?: number
    is_under_attack?: boolean
    tariff?: TariffStatus
    adr_event?: ADREvent
    load_forecast?: LoadForecast
    ev_fleet?: EVFleetStatus
}

export interface ZoneTopologyData {
    zone_id: number
    centroid_lat: number
    centroid_lon: number
    meter_count: number
    transformer_name: string
}

export interface MeterLink {
    meter_id: string
    zone_id: number | null
}

export interface GridTopologyResponse {
    zones: Record<string, ZoneTopologyData>
    meters: MeterLink[]
}

export interface GridHistoryStatus extends GridStatus {
    id?: string
}
