# gridtokenx-trading — Architecture

> The web frontend of GridTokenX: a Next.js single-page-ish App-Router portal for P2P energy
> trading, futures/options, wallet management, and live grid telemetry.
>
> This repo is a **git submodule** of the `gridtokenx-coresystem` superproject. Platform-wide rules
> (services, gateways, Chain Bridge as the only Solana RPC client) live in the superproject. This
> doc covers **only** the contents of this folder.

---

## 1. What This Is

A browser client built on **Next.js 16** (App Router, `output: 'standalone'`) with **React 19**
and **TypeScript 5** (`strict`, `moduleResolution: bundler`, `@/*` path alias rooted at the repo).
UI is **Tailwind CSS 3** + **shadcn/ui** (`new-york` style, Radix primitives, `lucide-react`
icons); charts via **Chart.js** / **Recharts** / TradingView datafeed; maps via **Mapbox GL** /
`react-map-gl`. Dev/build run on **Bun** + **Turbopack**; tests use **Jest** (jsdom) and
**Playwright**.

The app is **client-heavy**: most pages are `'use client'`, with a deep stack of React Context
providers and **TanStack Query** for server state. A compiled **WebAssembly** module
(`lib/wasm/gridtokenx_wasm_bg.wasm`, built from the sibling `gridtokenx-wasm` crate) provides
in-browser crypto/pricing — order-book/auction simulation, Black-Scholes + Greeks, portfolio risk,
reading aggregation, and ZK/stealth helpers (commitments, range proofs, stealth keys).

It is **not** a Rust service: there is no Cargo workspace here. The folder is a self-contained
Node/Bun frontend.

## 2. Directory Layout

```
app/                    Next.js App Router (routes, layouts, route handlers)
├── layout.tsx          Root layout — nests the full provider tree (see §3)
├── page.tsx            Landing / dashboard
├── futures/  portfolio/  meter/  login/  verify/ …   Route segments
├── auth/callback/      OAuth/Supabase auth return
└── api/                Server route handlers (BFF) — auth proxy, pyth-price, option txns
components/             UI — feature dirs (trading/ p2p/ auction/ charts/ energy-grid/ …) + ui/ (shadcn)
contexts/              React Context providers (Auth, Trading, Energy, Privacy, Marketplace, Socket, …)
hooks/                 Data/logic hooks (useApi, useOptions, useOracle, usePythPrice, useWebSocket, …)
lib/                   Core client logic
│   ├── config.ts          Env-driven API/WS/Solana endpoints + helpers
│   ├── api-client.ts      Facade over lib/api/* domain modules
│   ├── api/               Domain REST clients (auth, trading, user, meters, carbon, futures, core)
│   ├── websocket-client.ts  Reconnecting WS client for realtime channels
│   ├── streaming.ts / datafeed.ts  TradingView/Pyth price streaming
│   ├── wasm-bridge.ts / wasm-provider.tsx  WASM loader + React provider
│   ├── idl/               Anchor IDLs (trading, energy_token, governance, oracle, option_contract, …)
│   ├── contract-actions.ts / pda-utils.ts / program.ts  On-chain options-contract calls
│   └── zk-utils.ts / stealth-utils.ts / privacy-utils.ts  Privacy primitives (WASM-backed)
types/                 Shared TS types (trading, futures, meter, grid, wallet, auth, …)
utils/                 const.ts (Solana mints/oracles/connection), formatters, supabase/ helpers
middleware.ts          Edge auth gate (active only when NEXT_PUBLIC_AUTH_MODE=supabase)
next.config.ts         Standalone output, image domains, /api rewrite to APISIX, WASM webpack rules
public/  scripts/  docs/  tests/
```

## 3. Architecture

### Routing & composition
App Router. `app/layout.tsx` wraps every page in a fixed provider stack (outer → inner):
`ThemeProvider → QueryProvider → SystemConfigProvider → AuthProvider → SocketProvider →
EnergyProvider → PrivacyProvider → SidebarProvider → WasmProvider → LendingProvider →
MarketplaceProvider → TradingProvider → NotificationToastProvider`, then `NavBar` / `{children}` /
`Footer`. Route segments under `app/` (`futures`, `portfolio`, `meter`, `login`, `verify`, etc.)
render inside that shell.

### How it talks to the backend
All backend access is **REST/JSON over `fetch`** (not ConnectRPC/gRPC in this client). Endpoints
are built in `lib/config.ts` from env vars and hit the **APISIX gateway**, which is the only public
surface — the frontend never targets internal mesh ports.

- `API_CONFIG.baseUrl` defaults to `http://apisix.gridtokenx-coresystem.orb.local`; paths live
  under `/api/v1/*` (`auth`, `orders`, `futures`, `me`, `meters`, `public/grid-*`, …).
- `lib/api-client.ts` is a `ApiClient` **facade** delegating to per-domain modules in `lib/api/*`;
  `lib/api/core.ts#apiRequest` is the single fetch wrapper and attaches `Authorization: Bearer
  <token>` when a JWT is present.
- `next.config.ts` `rewrites()` proxies `/api/:path*` and `/health` to the same APISIX host (so
  relative calls work in the browser), and a few `app/api/*` **route handlers** act as a thin
  server-side BFF (e.g. `app/api/auth/login/route.ts` forwards to `/api/v1/auth/login`).

### Realtime
`lib/websocket-client.ts` is a reconnecting client (`WebSocketClient`) to `API_CONFIG.wsBaseUrl`
(`ws://…orb.local` by default), channels `/ws/orderbook`, `/ws/trades`, `/ws/epochs`. It carries
typed messages (`orderbook_update`, `trade_update`, `epoch_transition`, `settlement_complete`,
`order_matched`, …) and supports public vs token-authed channels. `SocketContext` exposes it to the
tree. Price candles stream separately from **Pyth/TradingView** (`lib/streaming.ts`,
`lib/datafeed.ts`).

### Wallet & on-chain access (non-custodial)
This client uses **Solana wallet adapters** directly — it is not purely server-custodial.
`contexts/connectionprovider.tsx` wires `ConnectionProvider` + `WalletProvider` with lazily
imported adapters (Phantom, Solflare, Trust, SafePal; `autoConnect`). `contexts/contractProvider.tsx`
builds an Anchor `AnchorProvider`/`Program` (from `lib/idl/option_contract.json`) against a
`@solana/web3.js` `Connection`, and `lib/contract-actions.ts` issues options-contract transactions
signed by the connected wallet. The Solana RPC endpoint comes from
`NEXT_PUBLIC_SOLANA_RPC_URL` (defaults route through the APISIX `/api/v1/rpc` shim).

Session auth is separate: `contexts/AuthProvider.tsx` stores a backend-issued **JWT** in
`localStorage`/`sessionStorage` and feeds it to `ApiClient`. An optional **Supabase** auth mode
(`middleware.ts`, `utils/supabase/`) gates routes at the edge when `NEXT_PUBLIC_AUTH_MODE=supabase`.

## 4. Conventions / Key Behaviors

1. **Gateway is the only public surface.** Backend URLs resolve to the **APISIX** host; the client
   never embeds internal mesh/gRPC ports. Change endpoints via env (`NEXT_PUBLIC_API_BASE_URL`,
   `NEXT_PUBLIC_WS_BASE_URL`), not hardcoded hosts.
2. **One fetch wrapper.** All REST goes through `lib/api/core.ts#apiRequest` via the `ApiClient`
   facade — add new calls as domain methods, don't sprinkle raw `fetch`.
3. **Config from env, with dev fallbacks.** `lib/config.ts` and `utils/const.ts` centralize every
   endpoint, mint, and oracle behind `NEXT_PUBLIC_*` vars; `.env.example` lists them.
4. **Non-custodial signing.** Transaction signing happens in the user's wallet extension via the
   adapter — the app holds no private keys. The only secret it persists is the backend JWT (in web
   storage). Don't log it or move keys client-side beyond the adapter.
5. **WASM is required for crypto/pricing.** `lib/wasm` ships the prebuilt module; rebuild with
   `bun run build:wasm` (compiles the sibling `gridtokenx-wasm` crate). `next.config.ts` enables
   `asyncWebAssembly` and stubs `fs`/`path` on the client.
6. **Standalone build.** `output: 'standalone'` (Dockerfile-friendly); image domains are
   allow-listed in `next.config.ts`. Bundle size is guarded by `scripts/check-bundle-size.js`
   (`bun run check:bundle`).
7. **Client-first.** Most interactivity lives in `'use client'` components/providers; server work is
   confined to the small `app/api/*` BFF handlers and `middleware.ts`.

## 5. Commands

Run with **Bun** (a `justfile` mirrors these as `just <recipe>`):

```bash
bun run dev              # next dev --turbopack
bun run build            # next build (standalone)
bun run start            # next start (serve the build)
bun run lint             # next lint (ESLint)
bun run format           # prettier --write .
bun run test             # jest (jsdom unit tests)
bun run test:watch       # jest --watch
bun run test:coverage    # jest --coverage
bun run test:e2e         # playwright test
bun run build:wasm       # build sibling gridtokenx-wasm crate into lib/wasm
bun run analyze          # ANALYZE=true next build (bundle analyzer)
bun run check:bundle     # scripts/check-bundle-size.js
bun run clean            # rm -rf .next
```

## 6. Further Reading (in this repo)

| File | Covers |
| :--- | :--- |
| `README.md` | Project overview, setup, and feature summary |
| `QWEN.md` | LLM working notes / orientation for this frontend |
| `next.config.ts` | Standalone output, APISIX rewrites, image domains, WASM webpack rules |
| `lib/config.ts` | Env-driven API/WS/Solana endpoint definitions |
| `lib/api-client.ts` | REST facade and the full set of backend calls |
| `docs/STYLE_GUIDE.md` | Frontend code/style conventions |
| `docs/UI_SYSTEM_DESIGN.md` | UI system / component design |
| `docs/SYSTEM_DESIGN_MOBILE.md` | Mobile layout / responsive design |
| `lib/wasm/README.md` | The bundled WASM module API |
