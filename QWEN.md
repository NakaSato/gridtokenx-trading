# QWEN.md - GridTokenX Trading Platform

## Project Overview

The **GridTokenX Trading Platform** is a Next.js 16 (App Router) web application serving as the frontend for the GridTokenX P2P Energy Trading ecosystem. It provides interfaces for energy trading (P2P, futures, batch auctions), portfolio management, smart meter integration, blockchain interaction on Solana, carbon credit markets, ZK privacy features, and DAO governance.

### Core Technologies

- **Framework**: Next.js 16 (App Router, Turbopack for dev, Webpack for prod)
- **Language**: TypeScript 5.9 (strict mode)
- **Runtime**: React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui (Radix UI primitives)
- **Blockchain**: Solana Web3.js + Anchor framework
- **State Management**: React Context Providers + TanStack Query
- **Charts**: TradingView (lightweight-charts) + Chart.js + Recharts
- **Maps**: Mapbox GL JS (via react-map-gl)
- **WASM**: Rust-based WASM module (gridtokenx-wasm) for Black-Scholes pricing, Greeks calculation, ZK proofs, and energy clustering
- **Testing**: Jest (unit) + Playwright (E2E)
- **Runtime**: Bun (preferred over Node.js)

## Project Structure

```
gridtokenx-trading/
├── app/                    # Next.js App Router pages and layouts
├── components/             # Shared UI components (shadcn/ui + custom)
├── contexts/               # React Context providers (auth, trading, energy, etc.)
├── hooks/                  # Custom React hooks
├── lib/                    # Services, integrations, utilities
│   ├── api/                # API service modules
│   ├── idl/                # Anchor IDL files for Solana programs
│   ├── wasm/               # Compiled WASM module
│   └── __tests__/          # Jest test suites
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── tests/e2e/              # Playwright end-to-end tests
└── public/                 # Static assets
```

### Key Context Providers

| Provider | Purpose |
|----------|---------|
| `AuthProvider` | User authentication, JWT tokens, login/logout |
| `ConnectionProvider` | Solana connection + wallet adapter (Phantom, Solflare, Trust, SafePal) |
| `TradingProvider` | P2P energy trading, stablecoin orders, settlement |
| `EnergyProvider` | Energy token minting from meter readings |
| `PrivacyProvider` | ZK privacy (shield/unshield, stealth payments) |
| `GovernanceProvider` | DAO governance (proposals, voting) |
| `LendingProvider` | ZK-collateralized lending |
| `MarketplaceProvider` | Confidential marketplace |
| `SocketContext` | WebSocket connection management |

### Key Libraries & Utilities

- **API Client** (`lib/api-client.ts`): REST API client (900+ lines) for GridTokenX API Gateway
- **WebSocket Client** (`lib/websocket-client.ts`): Real-time data subscriptions
- **WASM Bridge** (`lib/wasm-bridge.ts`): Interface to Rust WASM module for crypto/pricing
- **Contract Actions** (`lib/contract-actions.ts`): Anchor program action helpers
- **PDA Utils** (`lib/pda-utils.ts`): Solana Program Derived Address derivation
- **ZK Utils** (`lib/zk-utils.ts`, `lib/privacy-utils.ts`, `lib/stealth-utils.ts`): Zero-knowledge proof utilities

## Building and Running

### Prerequisites

- **Bun** (recommended) or Node.js 20+
- Mapbox GL access token (for energy grid map)
- Solana RPC endpoint (local or remote)
- WASM module built (for crypto/pricing features)

### Commands

```bash
# Install dependencies
bun install

# Build WASM module (required for crypto/pricing)
bun run build:wasm

# Start development server (with Turbopack)
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Run unit tests
bun run test

# Run E2E tests (requires dev server running)
bun run test:e2e

# Lint
bun run lint

# Format code
bun run format

# Bundle analysis
bun run analyze

# Clean build artifacts
bun run clean
```

### Using Just (alternative)

```bash
just dev          # Start dev server
just build        # Production build
just test         # Unit tests
just test-e2e     # E2E tests
just lint         # ESLint
just format       # Prettier
just analyze      # Bundle analysis
just clean        # Clean artifacts
just build-wasm   # Build WASM module
```

### Docker

```bash
docker build -t gridtokenx-trading .
docker run -p 3000:3000 gridtokenx-trading
```

## Environment Variables

Key environment variables (copy `.env.example` to `.env.local`):

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | — | Mapbox GL access token |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `localnet` | Solana network (localnet/devnet/mainnet) |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `http://127.0.0.1:4000/api/v1/rpc` | Solana RPC endpoint |
| `NEXT_PUBLIC_TRADING_PROGRAM_ID` | — | Trading program address |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | API Gateway base URL |
| `NEXT_PUBLIC_WS_BASE_URL` | `ws://localhost:4000` | WebSocket base URL |

## Testing

### Jest (Unit Tests)

- Located in `lib/__tests__/` and component `__tests__/` directories
- Uses `next/jest` for Next.js config loading
- Tests API client, utilities, and component logic
- Coverage configured for `components/` and `lib/` directories

### Playwright (E2E Tests)

- Located in `tests/e2e/`
- Runs against `http://localhost:3000`
- Tests authentication flow, trading flows, meter management, P2P trading
- Retries: 2 in CI, 0 locally
- Traces and screenshots on failure

## Development Conventions

### TypeScript

- Strict mode enabled (`strict: true`)
- Path alias: `@/*` maps to project root
- No emit (Next.js handles compilation)
- Module resolution: `bundler`

### Code Style

- **Prettier**: Code formatting with Tailwind CSS plugin
- **ESLint**: Next.js recommended rules
- **shadcn/ui**: Component library using Radix UI primitives, styled with Tailwind + cva

### Import Patterns

- Use `@/` path alias for all internal imports (e.g., `@/components/ui/button`)
- Solana/Anchor imports from `@coral-xyz/anchor`, `@solana/web3.js`
- UI components from `@/components/ui/` (shadcn)

### State Management

- Prefer React Context for global state (auth, trading, energy, etc.)
- TanStack Query for server-state/data fetching
- Custom hooks encapsulate domain logic (e.g., `useTrading()`, `usePortfolio()`)

### Component Patterns

- shadcn/ui components in `components/ui/` (30+ primitives)
- Domain-specific components in feature directories (e.g., `components/futures/`, `components/p2p/`)
- Context providers in `contexts/` with corresponding hooks in `hooks/`

## External Integrations

| Service | Purpose |
|---------|---------|
| **GridTokenX API Gateway** | REST + WebSocket backend for auth, trading, meters, grid |
| **Solana Blockchain** | On-chain programs via Anchor framework |
| **Pyth Network** | Real-time price feeds (Hermes client) |
| **Mapbox GL** | Energy grid visualization |
| **WASM Module** | Black-Scholes pricing, Greeks, ZK proofs, clustering (Rust → WASM) |
| **Helius** | Solana data enrichment |

## Key Page Routes

| Route | Description |
|-------|-------------|
| `/` | Main trading dashboard (Grid Map + P2P + History) |
| `/futures` | Futures trading with leveraged positions |
| `/auction` | Batch auction energy trading |
| `/carbon` | Carbon credit marketplace (REC trading) |
| `/portfolio` | Portfolio summary, positions, history |
| `/meter` | Smart meter management & readings |
| `/bridge` | Cross-chain bridge portal |
| `/auth/*` | Authentication flows (login, signup, reset) |

## Architecture Notes

- **Next.js Output**: Standalone build for Docker deployment
- **Bundler**: Turbopack for development (fast HMR), Webpack for production
- **WASM**: Async WebAssembly support configured for crypto operations
- **API Rewrites**: `/api/*` routes proxy to backend at `localhost:4000`
- **Image Sources**: Configured for Pinata, Arweave, and ShdwDrive
- **Package Optimization**: `optimizePackageImports` configured for lucide-react, date-fns, and Solana wallet adapters

## Common Tasks

### Adding a New Page

1. Create directory under `app/` with `page.tsx`
2. Add layout if needed (`layout.tsx`)
3. Create domain-specific components in `components/<feature>/`
4. Add context provider if needed in `contexts/`
5. Add hooks in `hooks/` for data fetching logic

### Adding a New API Integration

1. Use `lib/api-client.ts` for REST calls
2. Create service module in `lib/api/` for complex integrations
3. Add TypeScript types in `types/`
4. Add tests in `lib/__tests__/`

### Working with Solana Programs

1. IDL files in `lib/idl/`
2. Use `lib/contract-actions.ts` for program interactions
3. Use `lib/pda-utils.ts` for PDA derivation
4. Add new program IDs to environment variables

### Building WASM Module

The WASM module lives in `../gridtokenx-wasm/` (sibling directory). Build with:

```bash
bun run build:wasm
```

This compiles the Rust WASM and outputs to `lib/wasm/`.
