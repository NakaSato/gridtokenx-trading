# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read [`ARCHITECTURE.md`](ARCHITECTURE.md) first.** It is the authoritative, citation-backed map
> of this folder (data flow, backend access, realtime, wallet/auth, conventions). This file only
> adds the day-to-day operating notes that aren't obvious from the code.

## What this is

The **Next.js 16 / React 19 web frontend** of GridTokenX — a P2P energy-trading, futures/options,
wallet, and grid-telemetry portal. It is a **git submodule** of the `gridtokenx-coresystem`
superproject; platform-wide rules (services, gateways, Chain Bridge as the only Solana RPC client)
live there, not here. Client-heavy app: most pages/providers are `'use client'`, server state via
TanStack Query, backend access via REST/JSON over the APISIX gateway.

Tooling: **Bun** + **Turbopack** for dev/build, **Jest** (jsdom) for unit, **Playwright** for e2e,
Tailwind 3 + shadcn/ui (`@/*` alias → repo root).

## Commands

```bash
bun run dev              # next dev --turbopack (or: just dev)
bun run build            # next build (output: 'standalone')
bun run lint             # next lint (ESLint)
bun run format           # prettier --write .
bun run test             # jest unit tests (jsdom)
bun run test:e2e         # playwright e2e
bun run build:wasm       # rebuild lib/wasm from sibling ../gridtokenx-wasm crate
bun run check:bundle     # scripts/check-bundle-size.js (bundle-size guard)
```

Run a single unit test (no `bun run` wrapper needed for flags):

```bash
bunx jest path/to/file.test.ts            # one file
bunx jest -t "matches some test name"     # by test name
```

Tests live in `__tests__/` dirs colocated with source (`testMatch` covers `**/__tests__/**` and
`*.test.*` / `*.spec.*`). E2e specs are in `tests/e2e/`.

## Architecture notes (non-obvious)

- **Gateway is the only public surface.** All REST resolves to the **APISIX** host via `lib/config.ts`
  (`NEXT_PUBLIC_API_BASE_URL`, default `…orb.local`). Never embed internal mesh/gRPC ports or
  hardcode hosts — change endpoints through `NEXT_PUBLIC_*` env vars only.
- **One fetch wrapper.** Every REST call goes through `lib/api/core.ts#apiRequest`, behind the
  `ApiClient` facade in `lib/api-client.ts` (per-domain modules in `lib/api/*`: `auth`, `trading`,
  `futures`, `meters`, `carbon`, `user`). Add a domain method — don't sprinkle raw `fetch`.
- **Two auth modes, separate from wallet.** Backend session = JWT in web storage
  (`contexts/AuthProvider.tsx`), fed to `ApiClient`. Optional edge auth via Supabase
  (`middleware.ts`, `utils/supabase/`) when `NEXT_PUBLIC_AUTH_MODE=supabase`. Wallet signing is a
  third, independent thing.
- **Non-custodial signing.** Solana wallet adapters (`contexts/connectionprovider.tsx`) sign in the
  user's extension; the app holds no private keys. Only persisted secret is the backend JWT —
  don't log it. On-chain options txs go through `contexts/contractProvider.tsx` +
  `lib/contract-actions.ts` (Anchor `Program` from `lib/idl/option_contract.json`).
- **Realtime is two streams.** App data over a reconnecting WS client (`lib/websocket-client.ts`,
  channels `/ws/orderbook|trades|epochs`, surfaced via `contexts/SocketContext.tsx`). Price candles
  stream separately from Pyth/TradingView (`lib/streaming.ts`, `lib/datafeed.ts`).
- **WASM is required for crypto/pricing.** `lib/wasm/` ships a prebuilt module (order-book/auction
  sim, Black-Scholes + Greeks, risk, ZK/stealth helpers) compiled from the sibling
  `../gridtokenx-wasm` crate. Rebuild with `bun run build:wasm` after changing that crate.
  `next.config.ts` enables `asyncWebAssembly` and stubs `fs`/`path` on the client.
- **Heavy provider stack.** State lives in `contexts/*` (`TradingProvider`, `EnergyProvider`,
  `PrivacyProvider`, `MarketplaceProvider`, …). Prefer extending an existing provider/context over
  adding ad-hoc global state.

## Conventions

- See [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md) for code/style rules, [`docs/UI_SYSTEM_DESIGN.md`](docs/UI_SYSTEM_DESIGN.md)
  and [`docs/SYSTEM_DESIGN_MOBILE.md`](docs/SYSTEM_DESIGN_MOBILE.md) for UI/responsive design.
- Config from env with dev fallbacks: every endpoint/mint/oracle is centralized in `lib/config.ts`
  and `utils/const.ts` behind `NEXT_PUBLIC_*` (listed in `.env.example`). Copy `.env.example` → `.env`.
- `next.config.ts` `rewrites()` proxy `/api/:path*` and `/health` to APISIX; thin server-side BFF
  handlers live in `app/api/*` (e.g. `app/api/auth/login/route.ts`). Standalone build, image
  domains allow-listed there.
