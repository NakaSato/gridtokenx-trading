# gridtokenx-wasm — Architecture

> A Rust crate compiled to WebAssembly: high-performance, client-side compute for the GridTokenX
> trading **frontend** (order matching, auction clearing, crypto/ZK, pricing, visualization).
>
> This repo is a **git submodule** of the `gridtokenx-coresystem` superproject. Platform-wide rules
> (services, gateways, Chain Bridge as the only Solana RPC client) live in the superproject. This
> doc covers **only** the contents of this folder.

---

## 1. What This Is

`gridtokenx-wasm` is a **Rust library crate compiled to WASM** — not a service, no binary. It moves
heavy client-side computation off the JS main thread: client-side order matching, uniform-price
auction clearing, SHA-256/HMAC, zero-knowledge proofs, Black-Scholes/Greeks pricing, portfolio risk,
clustering, energy simulation, and Bezier-curve geometry for flow visualization.

- Crate: `gridtokenx-wasm` v0.1.1, edition 2021.
- `[lib] crate-type = ["cdylib", "rlib"]` — `cdylib` is the WASM artifact; `rlib` lets the crate also
  be linked/unit-tested as a normal Rust lib.
- Interop is **`wasm-bindgen`** + `js-sys` + `serde-wasm-bindgen` (structs/results cross the JS
  boundary as classes and `JsValue` JSON).
- **Consumer**: the `gridtokenx-trading` frontend submodule. Its `package.json` builds this crate
  with `wasm-pack build --target web --out-dir ../gridtokenx-trading/lib/wasm --out-name
  main` — i.e. an ESM `--target web` package loaded directly by the browser app. The
  generated package (`lib/wasm/package.json`, name `gridtokenx-wasm`, `main main.js`,
  `types main.d.ts`) lives in the consumer, not here.
- This is browser-side compute only. It does **not** replace any backend service, and (despite a
  stub client, see §4) it does **not** itself reach Solana.

## 2. Module Layout

```
src/
├── lib.rs                crate root: declares `mod modules`, glob re-exports every module,
│                         exposes `init_panic_hook()` (console_error_panic_hook)
└── modules/
    ├── mod.rs            re-exports the 11 submodules
    ├── aggregation.rs    aggregate_readings() → hourly energy aggregation (RawReading → HourlyDataPoint/AggregationResult)
    ├── auction.rs        AuctionSimulator — uniform Market Clearing Price (add_order/clear/calculate_clearing_price)
    ├── bezier.rs         calculate_bezier() → quadratic Bezier points as a flat Float64Array
    ├── clustering.rs     perform_clustering() → energy-profile archetype clusters (ClusterCenter/ClusteringResult)
    ├── crypto.rs         sha256 / hmac_sha256 / crypto_verify / crypto_msg_hash (real sha2 + hmac)
    ├── governance.rs     GovernanceClient + ZK-vote helpers — STUB: simulates RPC, returns mock data (see §4)
    ├── orderbook.rs      OrderBook — price-time-priority matching engine + depth chart
    ├── portfolio.rs      calculate_portfolio_risk() → aggregated PortfolioRisk from PortfolioPosition[]
    ├── pricing.rs        black_scholes + calculate_greeks/delta/gamma/vega/theta/rho_calc (Greeks struct)
    ├── simulation.rs      Simulation — energy node/flow tick simulation with time-of-day multipliers
    └── zk.rs             WasmElGamalKeypair / WasmCommitment / WasmRangeProof / WasmTransferProof (real solana-zk-token-sdk)
```

There is **no Cargo workspace** — this is a single standalone crate. `lib.rs` glob-re-exports
everything, so all `#[wasm_bindgen]` items are flat at the package root.

## 3. Architecture

Each module follows the same shape: a `#[wasm_bindgen]` free function or a `#[wasm_bindgen]`
struct ("class" in JS) with isolated, single-threaded state. There is no shared global state and no
threading — every instance owns its data.

Two boundary styles:

- **Value functions** — primitives in, primitives/`String`/`Float64Array`/`Vec<u8>` out:
  `crypto.rs`, `bezier.rs`, `pricing.rs`.
- **Stateful classes** — constructed in JS, mutated across calls, results serialized via
  `serde-wasm-bindgen` as `JsValue` JSON: `OrderBook`, `AuctionSimulator`, `Simulation`,
  `GovernanceClient`.

`init_panic_hook()` wires `console_error_panic_hook` so Rust panics surface as readable browser
console errors; the consumer is expected to call it once on load.

### Real client-side crypto / ZK (load-bearing)

- `crypto.rs` does **real** SHA-256, double-SHA-256, and HMAC-SHA256 via `sha2` + `hmac`, hex-encoded
  output; `crypto_verify` checks an HMAC signature.
- `zk.rs` is built on **`solana-zk-token-sdk` 2.3.1** — real ElGamal keypairs
  (`ElGamalKeypair`), Pedersen commitments (`PedersenCommitment`/`PedersenOpening`), and
  `RangeProofU64Data` range proofs, plus a transfer proof with balance equality. `getrandom` is
  pulled with the **`js`** feature so randomness works in-browser. This is the substantive reason the
  crate exists in Rust rather than TS: confidential-trading primitives run client-side.

## 4. Stubbed Governance Client (verified — not yet wired to chain)

`governance.rs` exports `GovernanceClient` (constructed with `rpc_url` + `program_id`) and helpers,
but the on-chain integration is **not implemented**. Verified in source:

- `connect()` ignores `rpc_url` and just sets `is_connected = true` (`// For now, we simulate a
  successful connection`).
- `fetch_poa_config()` returns a **hardcoded mock** `PoAConfig`, not data fetched from Solana.
- `vote_private()` / `create_proposal()` simulate rather than build/sign/send a transaction.
- Dependencies confirm this: there is **no** `reqwest`, `solana-client`, or any RPC/HTTP crate in
  `Cargo.toml`. The crate cannot actually make network calls; `rpc_url` is stored and echoed back.

The module's own doc comments mark each path as "In a real implementation, this would…". Treat
`GovernanceClient` as a typed placeholder/UI scaffold, **not** a working governance path. The ZK
proof helpers it leans on (`zk.rs`) are real; the Solana I/O around them is not.

> This is consistent with the superproject rule that no client touches Solana RPC directly — but note
> the rule is currently satisfied by the integration simply being absent, not by routing through
> Chain Bridge.

## 5. Key Behaviors / Invariants

1. **Single-threaded, instance-isolated state.** Every stateful export owns its data; no globals, no
   threads. Safe for the single-threaded WASM runtime.
2. **`crate-type` must stay `["cdylib", "rlib"]`.** `cdylib` produces the WASM; `rlib` keeps the
   crate unit-testable as plain Rust. Dropping either breaks a workflow.
3. **`getrandom` needs the `js` feature.** Without it, ZK keypair/proof generation has no entropy
   source in the browser. Keep the feature.
4. **`wasm-opt = false`** in `[package.metadata.wasm-pack.profile.release]` — release builds
   intentionally skip `wasm-opt`. (Likely a toolchain-compat workaround; reason not documented in
   source — **unverified why**.)
5. **`Cargo.lock` is gitignored** (`/target`, `Cargo.lock`, `/pkg` all ignored) — this is an
   application-style crate, but the lockfile is not committed here.
6. **The published JS package name is `gridtokenx-wasm`** with entry `main.js` /
   `main.d.ts` (set by `--out-name main` in the wasm-pack call).
7. **Exports are flat at the package root** because `lib.rs` glob-re-exports every module; name
   collisions across modules would clash at the JS boundary.

## 6. Commands

```bash
# Primary path the consumer uses (ESM for the browser):
wasm-pack build --target web --out-dir ../gridtokenx-trading/lib/wasm --out-name main

# Other wasm-pack targets the README documents (not wired into the consumer build):
wasm-pack build --target bundler --out-dir pkg        # webpack/vite bundlers
wasm-pack build --target nodejs  --out-dir pkg-node   # Node.js
wasm-pack build --target web     --out-dir pkg-web    # direct <script type="module">

# Raw WASM artifact without wasm-pack:
cargo build --target wasm32-unknown-unknown --release

# Plain-Rust checks (work via the rlib crate-type):
cargo build
cargo test          # inline #[cfg(test)] unit tests (e.g. governance.rs has tests)
cargo fmt --check
cargo clippy --all-targets
```

> The README lists three checked-out target dirs (`pkg/`, `pkg-node/`, `pkg-web/`), but none are
> committed (all `pkg`-like output is gitignored), and the consumer's `build:wasm` script only emits
> the `--target web` package into `gridtokenx-trading/lib/wasm`. The multi-target instructions are
> documentation, not an enforced build matrix — **verify against the consumer before relying on the
> node/bundler outputs**.

## 7. Further Reading (in this repo)

| File | Covers |
| :--- | :--- |
| `README.md` | Per-module export tables (signatures) + the three documented wasm-pack targets |
| `QWEN.md` | LLM working notes for this submodule |
| `Cargo.toml` | Authoritative crate-type, deps, and `wasm-pack` release profile |
