# Map Dashboard — Real-Data API Spec

> Backend endpoints the energy-grid map (`components/EnergyGridMap.tsx` + `components/energy-grid/*`)
> needs so the map renders **only real data**. The frontend's synthetic geometry and client-side
> simulation were removed (see "Removed" below); until these endpoints return real data the map
> shows empty/idle state, not fake data.

All endpoints are **public** (no auth), served via the APISIX gateway, JSON.

---

## 1. Real meter coordinates — `GET /api/v1/public/meters` (EXISTING, must change)

The GLM bus-network simulator currently returns `latitude: null`, `longitude: null`, no `zone_id`.
The frontend no longer synthesizes positions — it **drops meters without real coordinates**.

Backend MUST populate, per meter:

| field | type | notes |
|---|---|---|
| `latitude` | number | real WGS84 lat (required to render) |
| `longitude` | number | real WGS84 lng (required to render) |
| `zone_id` | number | which grid zone the meter belongs to (required for zone polygons + flow routing) |
| `capacity_kwh` | number | meter/site rated capacity (replaces hardcoded `"100 kWh"`) |
| `efficiency_pct` | number | generator efficiency 0–100 (replaces hardcoded `"94%"`) |

Already-real fields kept as-is: `meter_type`, `is_verified`, `voltage`, `current`, `frequency`,
`power_factor`, `current_generation`, `current_consumption`, `surplus_energy`, `deficit_energy`.

---

## 2. Real grid topology — `GET /api/v1/public/grid-topology` (EXISTING, must populate)

Type already defined (`types/grid.ts: GridTopologyResponse`). Backend MUST return non-empty
`zones` with real transformer positions so synthetic per-zone transformers are no longer needed:

```jsonc
{
  "zones": {
    "1": {
      "zone_id": 1,
      "centroid_lat": 13.78,        // real transformer position
      "centroid_lon": 100.56,
      "meter_count": 12,
      "transformer_name": "TR-1",
      "capacity_kva": 500,          // NEW — replaces hardcoded "500 kVA"
      "boundary_geojson": [ ... ]   // NEW (optional) — zone polygon ring; if absent, frontend hulls real meter positions
    }
  },
  "branches": [ ... ],
  "meters": [ ... ]
}
```

---

## 3. Real energy flows — `GET /api/v1/public/grid-flows` (NEW)

Replaces the synthetic meter→transformer transfers the frontend used to derive from
surplus/deficit. Returns the actual instantaneous line flows that drive the animated flow lines:

```jsonc
{
  "flows": [
    {
      "from": "meter-<id>",        // node id: a meter id or "transformer-<zone_id>"
      "to": "transformer-1",
      "power_kw": 43.1,            // signed magnitude; drives particle speed + color
      "description": "Solar → grid (surplus 43.1 kWh)"  // optional, for hover tooltip
    }
  ]
}
```

`from`/`to` MUST match the node ids the frontend builds. Map node ids ARE the backend
`meter_id` when `/api/v1/public/meters` provides one (see `useMeterMapData.ts#generateMeterId`
and `lib/api/meters.ts#getPublicMeters`, which keeps `meter_id ?? node_id`); the synthetic
`meter-<location>-<lat>-<lng>-<idx>` form is only a fallback when the backend omits ids.
Transformers → `transformer-<zone_id>`. Raw-refs flows (`from_meter_id`/`to_zone_id`) therefore
match directly — the adapter normalizes them to the same ids.

---

## 4. Real-time telemetry stream — extend `WS /api/market/ws` (NEW message type)

Removes the client-side WASM/JS simulation that interpolated values between 30s polls. Push live
per-meter telemetry so markers reflect real values without re-simulating:

```jsonc
// channel/message
{ "type": "meter.telemetry", "data": [
  { "meter_id": "...", "generation_kw": 45.2, "consumption_kw": 2.1,
    "surplus_kw": 43.1, "deficit_kw": 0, "status": "active" }
]}
```

Until this ships, live values update only on the 30s REST poll (real, just not sub-poll-smooth).

---

## 5. Grid aggregates — `GET /api/v1/public/grid-status` (EXISTING, one new field)

Already real (`total_generation`, `total_consumption`, `co2_saved_kg`, `active_meters`, `zones`,
`frequency`, `tariff`, …). Frontend now relies on it for the stats panel + CO2 (the hardcoded
`0.431 kg/kWh` client CO2 calc was removed).

Add one field so the stats-panel progress bars scale to the real grid (was hardcoded `500 kW`):

| field | type | notes |
|---|---|---|
| `peak_capacity_kw` | number | peak grid capacity; falls back to config `500` when absent |

---

## Removed from frontend (was fake / not API-backed)

| Removed | Was | File |
|---|---|---|
| `lib/mock-meters.ts` | 2 hardcoded demo meters + transformer + transfers | (deleted earlier) |
| `lib/meter-layout.ts` | golden-spiral synthetic positions, hash zone assignment | deleted |
| `useWasmSimulation.ts`, `useEnergySimulation.ts` | client-side value simulation (`Math.random`, time-of-day) | deleted |
| `utils.ts#fluctuate` | ±15% random noise | deleted |
| synthetic per-zone transformers | hardcoded `500 kVA`, ring placement | `EnergyGridMap.tsx` |
| synthetic `realEnergyTransfers` | surplus/deficit → fake transformer routing | `EnergyGridMap.tsx` |
| hardcoded `"100 kWh"` / `"94%"` / `"50 kWh"` / `"Li-ion"` | meter capacity/efficiency/storage defaults | `useMeterMapData.ts` |
| client CO2 `× 0.431` | grid CO2 estimate | `useWasmSimulation.ts`, `utils.ts` |

## Kept (presentation only, not data)

Color thresholds (300/200/100 kW), zone colors, map zoom/center, bezier/particle animation params.
