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
bun run build            # build:wasm THEN next build (output: 'standalone')
bun run lint             # eslint .
bun run format           # prettier --write .
bun run test             # jest unit tests (jsdom)
bun run test:e2e         # playwright e2e
bun run build:wasm       # rebuild lib/wasm + lib/wasm-zk from the in-repo crates
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
- **Auth = JWT + wallet, two independent things.** Backend session = JWT in web storage
  (`features/auth/provider.tsx`; all storage access via `features/auth/lib/session-storage.ts`,
  proactive renewal via `features/auth/lib/token-refresh.ts`), fed to `ApiClient`; login/register go through the BFF routes in
  `app/api/auth/*`. Wallet signing is separate (see below). The old Supabase edge-auth path
  (`middleware.ts`, `utils/supabase/`, `NEXT_PUBLIC_AUTH_MODE`) was removed in `bb26fd9` — none of
  those exist anymore; don't reintroduce them.
- **Non-custodial signing.** Solana wallet adapters (`lib/solana/connection-provider.tsx`) sign in the
  user's extension; the app holds no private keys. Only persisted secret is the backend JWT —
  don't log it. On-chain options txs go through `features/trading/contract-provider.tsx` +
  `features/trading/lib/{options,liquidity}.ts` (Anchor `Program` from `lib/idl/option_contract.json`).
- **Realtime is one stack.** A reconnecting WS client (`lib/websocket-client.ts`, channels
  `/ws/orderbook|trades|epochs`) consumed via `lib/ws/useWebSocket.ts` and the generic
  `lib/ws/useWsChannel.ts`. Price candles stream separately from Pyth/TradingView
  (`lib/streaming.ts`).
- **WASM is required for crypto/pricing.** `lib/wasm/` ships a prebuilt module (order-book/auction
  sim, Black-Scholes + Greeks, risk) compiled from the in-repo `wasm/` crate; ZK/stealth helpers
  live in `lib/wasm-zk/` from `wasm-zk/`. Rebuild with `bun run build:wasm` after changing either
  crate — **and commit the regenerated output**, because the build artifacts are checked in on
  purpose: `scripts/build-wasm.mjs` falls back to them when `wasm-pack` is absent, which is the
  only reason a Rust-less deploy host (Vercel) can build this app at all. It fails loudly if the
  toolchain *and* the artifacts are both missing. `next.config.ts` enables `asyncWebAssembly` and
  stubs `fs`/`path` on the client.
- **Feature modules are the unit of organisation.** Code lives in `features/<name>/`
  (`auth`, `trading`, `p2p`, `energy-grid`, `meter`, `portfolio`, `wallet`, `privacy`,
  `notifications`), each owning its `components/`, `hooks/`, `lib/` and tests. Only genuinely
  cross-feature UI goes in `components/shared/`, only feature-agnostic infrastructure in `lib/`.
  **No barrel files** — import full paths. `eslint.config.mjs` has a `no-restricted-imports`
  ratchet blocking every pre-refactor path.
- **Server state is TanStack Query, not hand-rolled.** Keys come from the factory in
  `lib/query/keys.ts`. Don't add `useState` + `useEffect` + `setInterval` fetching; use a query
  with `refetchInterval`. React context is for session/UI state only — the provider stack is
  composed in `app/providers.tsx` and is deliberately short.

## Conventions

- See [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md) for code/style rules, [`docs/UI_SYSTEM_DESIGN.md`](docs/UI_SYSTEM_DESIGN.md)
  and [`docs/SYSTEM_DESIGN_MOBILE.md`](docs/SYSTEM_DESIGN_MOBILE.md) for UI/responsive design.
- Config from env with dev fallbacks: every endpoint/mint/oracle is centralized in `lib/config.ts`
  and `lib/const.ts` behind `NEXT_PUBLIC_*` (listed in `.env.example`). Copy `.env.example` → `.env`.
- `next.config.ts` `rewrites()` proxy `/api/:path*` and `/health` to APISIX; thin server-side BFF
  handlers live in `app/api/*` (e.g. `app/api/auth/login/route.ts`). Standalone build, image
  domains allow-listed there.

## Search Tooling

> **Use `rg` (ripgrep), never `grep`.** When shelling out to search files, run `rg` —
> it respects `.gitignore`, skips binaries, and is far faster than `grep`/`find -exec grep`.
> Reserve plain `grep` only for piping non-file streams.
