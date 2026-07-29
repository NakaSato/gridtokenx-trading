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
(`lib/wasm/main_bg.wasm`, built from the in-repo `wasm/` crate) provides
in-browser crypto/pricing — order-book/auction simulation, Black-Scholes + Greeks, portfolio risk,
reading aggregation, and ZK/stealth helpers (commitments, range proofs, stealth keys).

It is **not** a Rust service: there is no Cargo workspace here. The folder is a self-contained
Node/Bun frontend.

## 2. Directory Layout

```
app/                    Next.js App Router (routes, layouts, route handlers)
├── layout.tsx          Root layout — page chrome + global modals
├── providers.tsx       The provider tree, composed in one place (see §3)
├── page.tsx            P2P trading terminal
├── futures/  portfolio/  wallet/  meter/  carbon-credit/  login/  verify/ …   Route segments
└── api/                Server route handlers (BFF) — auth proxy, pyth-price, option txns
features/               Feature modules — the primary unit of organisation.
│                       Each owns its components/, hooks/, lib/, types and tests.
│   ├── auth/              provider.tsx (session + useAuth), lib/{session-storage,token-refresh,password}
│   ├── trading/           futures/options/positions, contract-provider, lib/{options,liquidity}
│   ├── p2p/               order form, activity, order-fill-context
│   ├── energy-grid/       map, telemetry and grid-status hooks
│   ├── meter/  portfolio/  wallet/  carbon → via portfolio/, privacy/, notifications/
components/
│   ├── ui/                shadcn primitives
│   └── shared/            Cross-feature chrome: NavBar, Footer, Pagination, Settings, SidebarContext
lib/                    Core client logic (no feature knowledge)
│   ├── config.ts          Env-driven API/WS/Solana endpoints + helpers
│   ├── api-client.ts      Facade over lib/api/* domain modules
│   ├── api/               Domain REST clients (auth, trading, user, meters, carbon, futures, core)
│   │                      + adapters.ts (API→UI projections), useApiClient.ts
│   ├── query/keys.ts      TanStack query-key factory — every server-state key
│   ├── ws/                useWebSocket + useWsChannel over websocket-client.ts
│   ├── solana/            connection-provider.tsx (wallet adapters)
│   ├── streaming.ts       TradingView/Pyth price streaming
│   ├── wasm-bridge.ts / wasm-provider.tsx / wasm-hooks.ts  WASM loader, provider, hooks
│   ├── idl/               Anchor IDLs (trading, energy_token, governance, option_contract, …)
│   ├── pda-utils.ts / program.ts   Solana PDA + program helpers
│   ├── privacy-utils.ts   Privacy primitives (WASM-backed, via wasm-bridge)
│   └── const.ts / formatter.ts     Solana mints/oracles/connection + formatters
types/                  Shared TS types (trading, futures, meter, grid, wallet, auth, ws, …)
next.config.ts          Standalone output, image domains, /api rewrite to APISIX, WASM webpack rules
public/  scripts/  docs/  tests/
```

**Conventions.** Feature code lives in `features/<name>/`; only genuinely cross-feature UI
belongs in `components/shared/`, and only feature-agnostic infrastructure in `lib/`.
There are **no barrel files** — import the full path so the source of a symbol is
greppable. Server state goes through TanStack Query with keys from
[`lib/query/keys.ts`](lib/query/keys.ts); realtime goes through
[`lib/ws/useWsChannel.ts`](lib/ws/useWsChannel.ts). React context is reserved for
session and UI state. `eslint.config.mjs` carries a `no-restricted-imports`
ratchet listing every pre-refactor path, so a moved module cannot be
re-imported from its old location.

## 3. Architecture

### Routing & composition
App Router. `app/layout.tsx` renders the page chrome and global modals; the provider stack is
composed in one place, `app/providers.tsx` (outer → inner):
`ThemeProvider → QueryProvider → Connectionprovider → ContractProvider → AuthProvider →
PrivacyProvider → SidebarProvider → WasmProvider → OrderFillProvider →
NotificationToastProvider`, then `NavBar` / `{children}` / `Footer`. Route segments under `app/`
(`futures`, `portfolio`, `wallet`, `meter`, `carbon-credit`, `login`, `verify`, …) render inside
that shell.

`ContractProvider` used to be mounted invisibly inside the connection provider; it is explicit
here. Four providers with no consumers (Energy, Lending, Marketplace, SystemConfig) and two whose
surface was unused (Trading, Socket) were removed — see git history if a flow needs reviving.

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
`order_matched`, …) and supports public vs token-authed channels. Components consume it through
`lib/ws/useWebSocket.ts` and the generic `lib/ws/useWsChannel.ts` — the single realtime stack.
Price candles stream separately from **Pyth/TradingView** (`lib/streaming.ts`).

### Wallet & on-chain access (non-custodial)
This client uses **Solana wallet adapters** directly — it is not purely server-custodial.
`lib/solana/connection-provider.tsx` wires `ConnectionProvider` + `WalletProvider` with lazily
imported adapters (Phantom, Solflare, Trust, SafePal; `autoConnect`).
`features/trading/contract-provider.tsx` builds an Anchor `AnchorProvider`/`Program` (from
`lib/idl/option_contract.json`) against a `@solana/web3.js` `Connection`, and
`features/trading/lib/{options,liquidity}.ts` issue contract transactions
signed by the connected wallet. The Solana RPC endpoint comes from
`NEXT_PUBLIC_SOLANA_RPC_URL` (defaults route through the APISIX `/api/v1/rpc` shim).

Session auth is separate: `features/auth/provider.tsx` stores a backend-issued **JWT** in
`localStorage`/`sessionStorage` (all access via `features/auth/lib/session-storage.ts`) and feeds
it to `ApiClient`. A proactive timer refreshes the token before expiry
(`features/auth/lib/token-refresh.ts`). There is no edge auth gate — the former Supabase mode,
`middleware.ts` and `utils/supabase/` were removed in `bb26fd9`.

## 4. Conventions / Key Behaviors

1. **Gateway is the only public surface.** Backend URLs resolve to the **APISIX** host; the client
   never embeds internal mesh/gRPC ports. Change endpoints via env (`NEXT_PUBLIC_API_BASE_URL`,
   `NEXT_PUBLIC_WS_BASE_URL`), not hardcoded hosts.
2. **One fetch wrapper.** All REST goes through `lib/api/core.ts#apiRequest` via the `ApiClient`
   facade — add new calls as domain methods, don't sprinkle raw `fetch`.
3. **Config from env, with dev fallbacks.** `lib/config.ts` and `lib/const.ts` centralize every
   endpoint, mint, and oracle behind `NEXT_PUBLIC_*` vars; `.env.example` lists them.
4. **Non-custodial signing.** Transaction signing happens in the user's wallet extension via the
   adapter — the app holds no private keys. The only secret it persists is the backend JWT (in web
   storage). Don't log it or move keys client-side beyond the adapter.
5. **WASM is required for crypto/pricing.** `lib/wasm` ships the prebuilt module; rebuild with
   `bun run build:wasm` (compiles the in-repo `wasm/` crate). `next.config.ts` enables
   `asyncWebAssembly` and stubs `fs`/`path` on the client.
6. **Standalone build.** `output: 'standalone'` (Dockerfile-friendly); image domains are
   allow-listed in `next.config.ts`. Bundle size is guarded by `scripts/check-bundle-size.js`
   (`bun run check:bundle`).
7. **Client-first.** Most interactivity lives in `'use client'` components/providers; server work is
   confined to the small `app/api/*` BFF handlers.
8. **Feature modules.** Code belongs to a `features/<name>/` module unless it is genuinely
   cross-feature UI (`components/shared/`) or feature-agnostic infrastructure (`lib/`). No barrel
   files. Server state via TanStack Query with keys from `lib/query/keys.ts`; realtime via
   `lib/ws/useWsChannel.ts`. The `no-restricted-imports` ratchet in `eslint.config.mjs` blocks
   imports from pre-refactor paths.

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
bun run build:wasm       # build the in-repo wasm/ crate into lib/wasm
bun run analyze          # ANALYZE=true next build (bundle analyzer)
bun run check:bundle     # scripts/check-bundle-size.js
bun run clean            # rm -rf .next
```

## 6. Further Reading (in this repo)

| File | Covers |
| :--- | :--- |
| `CLAUDE.md` | Day-to-day operating notes for this folder |
| `next.config.ts` | Standalone output, APISIX rewrites, image domains, WASM webpack rules |
| `lib/config.ts` | Env-driven API/WS/Solana endpoint definitions |
| `lib/api-client.ts` | REST facade and the full set of backend calls |
| `lib/query/keys.ts` | Query-key factory for all server state |
| `docs/STYLE_GUIDE.md` | Brand/visual identity guide (logo, colour, typography) — not code style |
| `docs/UI_SYSTEM_DESIGN.md` | UI system / component design |
| `docs/SYSTEM_DESIGN_MOBILE.md` | Mobile layout / responsive design |
| `lib/wasm/README.md` | The bundled WASM module API |
