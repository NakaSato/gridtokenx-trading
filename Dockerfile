# syntax=docker/dockerfile:1
# Pinned tag — :latest re-pulls bust every downstream layer (incl. the rustup
# toolchain layer) whenever upstream publishes a new image.
FROM oven/bun:1.3.14 AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Rebuild the source code
FROM base AS builder
WORKDIR /app

# Rust toolchain + wasm-pack are required by `bun run build:wasm` (compiles
# the wasm/ crate into lib/wasm). Installed before the source COPY so the
# toolchain layer caches across code changes.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates build-essential git \
    && rm -rf /var/lib/apt/lists/*
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --profile minimal --target wasm32-unknown-unknown
ENV PATH="/root/.cargo/bin:${PATH}"
RUN curl --proto '=https' --tlsv1.2 -sSf https://rustwasm.github.io/wasm-pack/installer/init.sh | sh

COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_TELEMETRY_DISABLED=1
# Cache mounts: .next incremental cache + cargo registry and both wasm crates'
# target dirs — `bun run build` recompiles wasm/ and wasm-zk/ every build, so
# without these the Rust side rebuilds from scratch each time.
RUN --mount=type=cache,target=/app/.next/cache \
    --mount=type=cache,target=/root/.cargo/registry \
    --mount=type=cache,target=/app/wasm/target \
    --mount=type=cache,target=/app/wasm-zk/target \
    bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN <<EOT
    groupadd -g 1001 nodejs || true
    useradd -u 1001 -g nodejs -s /bin/sh -m nextjs || true
    mkdir .next
    chown nextjs:nodejs .next
EOT

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["bun", "server.js"]
