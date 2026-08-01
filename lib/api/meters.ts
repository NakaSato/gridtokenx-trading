import { apiRequest, ApiResponse } from './core'
import type {
    GridTopologyResponse,
    GridFlow,
    GridFlowsResponse
} from '@/types/grid'
import type {
    PublicMeterResponse,
    MeterReading,
    MeterResponse,
    MeterMapPoint,
    RegisterMeterResponse,
    MeterStats,
    VerifyMeterResponse
} from '@/types/meter'

/** Raw meter shape returned by the GLM bus-network simulator's public endpoint. */
interface RawPublicMeter {
    meter_id?: string
    meter_type?: string
    location_name?: string
    latitude?: number | null
    longitude?: number | null
    node_id?: string
    has_solar?: boolean
    status?: string
    generation_kw?: number
    consumption_kw?: number
    voltage?: number
    zone_id?: number | null
    /** GLM simulator names the zone field zone_code (observed live 2026-07). */
    zone_code?: number | null
    capacity_kwh?: number
    efficiency_pct?: number
}

/** Raw flow shape from the public grid-flows endpoint (both naming conventions). */
interface RawGridFlow {
    from?: string
    to?: string
    from_meter_id?: string
    to_zone_id?: number | null
    power_kw?: number
    description?: string
}

/**
 * meter-service client.
 *
 * Caller-scoped routes live under `/api/v1/me/meters*` — the platform user-self
 * base (same convention as `/api/v1/me/wallets`, `/api/v1/me/orders`). The bare
 * `/api/v1/meters*` forms this client used to call are dual-served legacy
 * aliases on the backend and are slated for removal; don't reintroduce them.
 * The sole exception is `/api/v1/meters/map`, which is grid-wide rather than
 * caller-scoped and so is NOT under `/me` — see `getMetersMap()`.
 */
export class MetersApi {
    constructor(private getToken: () => string | undefined) { }

    // Reading ingest removed: meter telemetry is ingested only via the Aggregator
    // Bridge (Ed25519-signed IoT gateway), not the meter-service HTTP API. The
    // former submitMeterData() POST to /api/v1/meters/{serial}/readings is gone.

    async getMeterStats(): Promise<ApiResponse<MeterStats>> {
        return apiRequest<MeterStats>('/api/v1/me/meters/stats', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async getMyReadings(limit = 10, offset = 0): Promise<ApiResponse<MeterReading[]>> {
        const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() })
        return apiRequest<MeterReading[]>(`/api/v1/me/meters/readings?${params.toString()}`, {
            method: 'GET',
            token: this.getToken(),
        })
    }

    /**
     * Readings plus pagination metadata. The meter-service returns the total
     * count and a has-more flag in the `X-Total-Count` / `X-Has-More` response
     * headers (body stays the plain array). Falls back to the page length /
     * `false` when the headers are absent (older backend), so callers stay safe.
     */
    async getMyReadingsPage(limit = 50, offset = 0): Promise<ApiResponse<{
        readings: MeterReading[]
        total: number
        hasMore: boolean
    }>> {
        const res = await this.getMyReadings(limit, offset)
        if (res.error) {
            return { error: res.error, status: res.status }
        }
        const readings = res.data || []
        const totalHeader = res.headers?.['x-total-count']
        const parsedTotal = totalHeader ? parseInt(totalHeader, 10) : NaN
        const total = Number.isNaN(parsedTotal) ? readings.length : parsedTotal
        // Trust X-Has-More when present; otherwise derive from the total so a
        // backend (or gateway CORS filter) that only passes X-Total-Count
        // still paginates instead of silently reporting "no more".
        const hasMoreHeader = res.headers?.['x-has-more']
        const hasMore = hasMoreHeader != null
            ? hasMoreHeader === 'true'
            : offset + readings.length < total
        return { data: { readings, total, hasMore }, status: res.status }
    }

    async getMyMeters(): Promise<ApiResponse<MeterResponse[]>> {
        return apiRequest<MeterResponse[]>('/api/v1/me/meters', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    /**
     * Every located meter (latitude/longitude present) across ALL users, as map
     * markers. Requires a valid JWT but is intentionally not caller-scoped — the
     * map shows the whole grid. GET /api/v1/meters/map.
     *
     * This is the one meter route that deliberately stays OFF the `/api/v1/me`
     * base: `/me/*` means "scoped to the caller", which this is not. There is no
     * `/api/v1/me/meters/map` — the backend 404s it on purpose.
     */
    async getMetersMap(): Promise<ApiResponse<MeterMapPoint[]>> {
        return apiRequest<MeterMapPoint[]>('/api/v1/meters/map', {
            method: 'GET',
            token: this.getToken(),
        })
    }

    async registerMeter(data: { serial_number: string; meter_type?: string; location?: string; latitude?: number; longitude?: number }): Promise<ApiResponse<RegisterMeterResponse>> {
        return apiRequest<RegisterMeterResponse>('/api/v1/me/meters', {
            method: 'POST',
            body: data,
            token: this.getToken(),
        })
    }

    /**
     * Prove possession of a registered meter so its owner may open sell orders.
     *
     * Registration only CLAIMS a serial — the meter lands unverified, and the
     * trading service refuses a sell (403) from a user with no verified meter.
     * The backend passes this when the Aggregator Bridge has already accepted at
     * least one Ed25519-signed reading from the device, so it is the *device*
     * that gets verified, not the session; a meter that has never reported is
     * refused with 409 and a message naming the reason.
     *
     * Idempotent: verifying an already-verified meter succeeds with
     * `already_verified: true`.
     */
    async verifyMeter(serial: string): Promise<ApiResponse<VerifyMeterResponse>> {
        return apiRequest<VerifyMeterResponse>(
            `/api/v1/me/meters/${encodeURIComponent(serial)}/verify`,
            {
                method: 'POST',
                token: this.getToken(),
            }
        )
    }

    // Minting is server-side only: the Aggregator Bridge mints surplus per 15-min
    // billing bin (via Chain Bridge). There is no meter-service mint endpoint and
    // no client-initiated mint — the former POST .../readings/{id}/mint is gone.

    // No getGridStatus/getGridHistory: GET /api/v1/public/grid-status is gone.
    // Aggregate grid state now arrives only over the public WS
    // (features/energy-grid/hooks/useGridStatus.ts).

    async getGridTopology(): Promise<ApiResponse<GridTopologyResponse>> {
        return apiRequest<GridTopologyResponse>('/api/v1/public/grid-topology', { method: 'GET' })
    }

    async getPublicMeters(): Promise<ApiResponse<PublicMeterResponse[]>> {
        // The deployed backend wraps meters in `{ meters: [...] }` and uses
        // generation_kw/consumption_kw/location_name/status — adapt to
        // PublicMeterResponse. Real telemetry (surplus/deficit from net power)
        // feeds the map. Positions/zone come straight from the backend: meters
        // without real latitude/longitude/zone_id are NOT synthesized here and
        // are dropped by the map (see docs/MAP_REAL_DATA_API.md).
        const res = await apiRequest<{ meters?: RawPublicMeter[] } | RawPublicMeter[]>(
            '/api/v1/public/meters',
            { method: 'GET' }
        )
        if (res.error || !res.data) {
            return { data: [], status: res.status, error: res.error }
        }

        const raw = Array.isArray(res.data) ? res.data : (res.data.meters ?? [])
        const meters: PublicMeterResponse[] = raw.map((m) => {
            const generation = m.generation_kw ?? 0
            const consumption = m.consumption_kw ?? 0
            const net = generation - consumption

            return {
                // Keep the backend id: map node ids are keyed on it so that
                // grid-flow endpoints (from_meter_id) can match nodes.
                meter_id: m.meter_id ?? m.node_id,
                location: m.location_name ?? m.node_id ?? m.meter_id ?? 'Unknown Meter',
                meter_type: m.meter_type ?? '',
                is_verified: (m.status ?? '').toLowerCase() === 'active',
                latitude: m.latitude ?? undefined,
                longitude: m.longitude ?? undefined,
                current_generation: generation,
                current_consumption: consumption,
                voltage: m.voltage,
                surplus_energy: net > 0 ? net : 0,
                deficit_energy: net < 0 ? -net : 0,
                zone_id: m.zone_id ?? m.zone_code ?? undefined,
                capacity_kwh: m.capacity_kwh,
                efficiency_pct: m.efficiency_pct,
            }
        })

        return { data: meters, status: res.status, headers: res.headers }
    }

    /**
     * Real instantaneous line flows for the map's animated flow lines.
     * Tolerant of two backend shapes per flow:
     *   - node ids:  { from, to, power_kw, description }
     *   - raw refs:  { from_meter_id, to_zone_id, power_kw }  (zone → "transformer-<id>")
     * Both normalize to GridFlow { from, to, power_kw }.
     */
    async getGridFlows(): Promise<ApiResponse<GridFlowsResponse>> {
        const res = await apiRequest<{ flows?: RawGridFlow[] } | RawGridFlow[]>(
            '/api/v1/public/grid-flows',
            { method: 'GET' }
        )
        if (res.error || !res.data) {
            return { data: { flows: [] }, status: res.status, error: res.error }
        }
        const raw = Array.isArray(res.data) ? res.data : (res.data.flows ?? [])
        const flows: GridFlow[] = raw
            .map((f): GridFlow | null => {
                const from = f.from ?? f.from_meter_id
                const to = f.to ?? (f.to_zone_id != null ? `transformer-${f.to_zone_id}` : undefined)
                if (!from || !to) return null
                return {
                    from,
                    to,
                    power_kw: f.power_kw ?? 0,
                    description: f.description,
                }
            })
            .filter((f): f is GridFlow => f !== null)
        return { data: { flows }, status: res.status }
    }

}
