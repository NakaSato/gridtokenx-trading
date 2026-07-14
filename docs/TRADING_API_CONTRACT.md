# Trading Service REST Contract (frontend reference)

Source of truth: `gridtokenx-trading-service/crates/trading-api/src/rest.rs`
(routes wired in `crates/trading-api/src/startup.rs`). Frontend binding lives in
`lib/api/trading.ts`, `lib/api/futures.ts`, `lib/api/carbon.ts`, `lib/api/user.ts`,
typed in `types/trading.ts`, `types/futures.ts`, `types/features.ts`,
`types/transactions.ts`, surfaced via the `ApiClient` facade (`lib/api-client.ts`).

**All routes require JWT (`UserContext`) + RBAC (`ServiceRole`)** unless marked no-auth.
**Spot / trade amounts are decimal strings** (`Decimal` → `String`), NOT floats.
Parse with `parseFloat` at use sites. `/markets/config`, `/markets/p2p/market-prices`
and futures fields are the exceptions — those are real JSON floats.

---

## Orders

| Route | Method | Frontend | Request → Response |
| --- | --- | --- | --- |
| `/api/v1/orders` | POST | `createOrder` / `createP2POrder` | `SubmitOrderRequest` → `SubmitOrderResponse` |
| `/api/v1/orders` | GET | `getOrders` | `?status&limit&offset` → `ListOrdersResponse` |
| `/api/v1/orders/{id}` | GET | `getOrder` | → `ApiOrder` |
| `/api/v1/orders/{id}` | DELETE | `cancelOrder` | → opaque JSON |

`SubmitOrderRequest` (`types/trading.ts`): `side` `buy|sell`, `order_type` `limit|market`,
`energy_amount_kwh` (string). Optional: `price_per_kwh` (string — **required** for limit +
market-buy slippage cap, omit for market-sell), `zone_id`, `meter_id`, `custodial_sign`,
`time_in_force` (`gtc|ioc|fok`, default `gtc`), `market_segment` (`realtime|interval`,
default `realtime`).
`SubmitOrderResponse`: `{ id, status, created_at }`.
`ListOrdersResponse`: `{ data: ApiOrder[], pagination: { total, limit, offset } }`.

## Quotes

`POST /api/v1/quotes` — `calculateP2PCost`. Body `{ buyer_zone_id, seller_zone_id,
energy_amount_kwh, agreed_price }` → `{ quote_id, expires_at, breakdown{energy_cost,
wheeling_charge, loss_cost, total_cost}, grid_metrics{effective_energy_kwh, loss_factor,
zone_distance_km, is_grid_compliant} }`. **STUB** — handler binds `_req` (see below).

## Order book / stats

| Route | Frontend | Response |
| --- | --- | --- |
| `GET /api/v1/zones/{id}/book` | `getOrderBook` | `OrderBookResponse` `{ zone_id, last_update_id, asks:[[p,q]], bids:[[p,q]] }` |
| `GET /api/v1/stats` | `getMarketStats` | `MarketStatsResponse` `{ timestamp, total_volume_24h_kwh, avg_price_24h, active_users, grid_stability_index, renewable_ratio }` |

## Markets (read-only)

| Route | Frontend | Notes |
| --- | --- | --- |
| `/api/v1/markets/config` | `getMarketConfig` | **floats**: base/import/export price, transaction_fee_bps, min/max_price_per_kwh |
| `/api/v1/markets/p2p/market-prices` | `getP2PMarketPrices` | **floats** + loss_allocation_model, wheeling_charges{zone:fee}, loss_factors{zone:factor} |
| `/api/v1/markets/matching-status` | `getMatchingStatus` | pending buy/sell/matches, price ranges, can_match, match_reason |
| `/api/v1/markets/settlement-stats` | `getSettlementStats` | pending/processing/confirmed/failed counts, total_settled_value (f64) |
| `/api/v1/markets/orderbook` | `getP2POrderBook` | `{ asks:[[p,q]], bids:[[p,q]] }` |
| `/api/v1/markets/clearing-epochs?limit` | `getClearingEpochs` | `ClearingEpoch[]`, limit clamped 1..=100 (default 20) |

## Trades

| Route | Frontend | Response |
| --- | --- | --- |
| `GET /api/v1/trades?limit&offset` | `getTrades` / `getTradeHistory` | `TradeHistory` `{ trades: TradeRecord[], total_count, total }` |
| `GET /api/v1/trades/export?format=csv\|json` | `exportTradingHistory` | raw file (CSV default, `apiRequestText`), not JSON-wrapped |

`TradeRecord` amounts are all strings: `quantity, energy_amount?, price, price_per_kwh?,
total_value, fee_amount?, wheeling_charge?, loss_cost?, effective_energy?` plus ids/zones/
timestamps. (`getTrades` and `getTradeHistory` are redundant; prefer `getTrades`.)

## Price alerts / Recurring orders

Fully typed (`types/features.ts`). `PriceAlert`, `RecurringOrder`(=`RecurringOrderWire`).
`pause`/`resume`/`DELETE` return opaque JSON.

## Futures (`/api/v1/futures`)

`getFuturesProducts` → `FuturesProduct[]`, `getFuturesPositions` → `FuturesPosition[]`,
`getFuturesOrders` → `FuturesOrder[]`. `createFuturesOrder` (**STUB**),
`closeFuturesPosition`, `getFuturesCandles`, `getFuturesOrderBook` → opaque/stub JSON.
Futures numeric fields (`quantity`, `price`, `leverage`) are JSON numbers, not strings.

## User data

`getBalance` (`/wallets/{addr}/balance`, opaque), `getUserAnalytics` (`/analytics/stats`),
`getUserHistory` (`/analytics/history`, opaque), `getUserTransactions` (`/transactions` →
`UserTransactionsResponse`).

## Carbon (`/api/v1/carbon`)

`getCarbonBalance`, `getCarbonHistory` → `CarbonCredit[]`, `getCarbonTransactions`,
`transferCarbonCredits` (**STUB**).

## Health (no auth, no body)

`/health`, `/health/ready`, `/metrics`.

---

## ⚠️ Known backend gaps (verify before UI settles on them)

1. **Opaque/stub handlers** return `serde_json::Value` — no compile-time contract:
   balance, carbon balance/txns, analytics/history, futures candles/book,
   cancel/delete/pause/resume. Shape is runtime-defined; treat as untyped.
2. **`_req`-binding stubs** — `create_quote`, `create_futures_order`,
   `transfer_carbon_credits` accept the request but **ignore it** (`_req`), returning
   mock responses. They do NOT execute the operation. Marked with `STUB WARNING`
   comments in the frontend. Do not settle/transfer on their output.
3. **Amount type split** — decimal **strings** on spot/trade DTOs, **floats** on
   `/markets/config`, `/markets/p2p/market-prices`, and futures. UI must handle both;
   `types/*.ts` encode the split faithfully.
