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

export interface GridStatus {
    total_generation: number
    total_consumption: number
    net_balance: number
    active_meters: number
    co2_saved_kg: number
    timestamp: string
    zones?: Record<string, ZoneGridStatus>
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
