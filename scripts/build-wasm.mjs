#!/usr/bin/env node
/**
 * Compile the in-repo wasm crates, or fall back to the committed artifacts.
 *
 * `bun run build` calls this before `next build`. Locally that should recompile
 * wasm/ and wasm-zk/, so a crate change can never ship stale. But the build
 * outputs are checked in (lib/wasm/, lib/wasm-zk/, public/main.wasm) precisely
 * so a deploy host without a Rust toolchain — Vercel, which has no wasm-pack
 * and no cargo — can still build the app.
 *
 * So: compile when wasm-pack is available, use the committed artifacts when it
 * isn't, and fail loudly only when neither is true (no toolchain AND no
 * artifacts), which is the one case that would otherwise produce a silently
 * broken bundle.
 */

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Every file the app imports or fetches at runtime, produced by a wasm build. */
const REQUIRED_ARTIFACTS = [
  'lib/wasm/main.js', // imported by lib/wasm-bridge.ts
  'lib/wasm/main.d.ts',
  'lib/wasm/main_bg.wasm',
  'public/main.wasm', // fetched by lib/wasm-provider.tsx via initWasm('/main.wasm')
  'lib/wasm-zk/zk.js', // lazily imported by lib/wasm-bridge.ts#loadZkModule
  'lib/wasm-zk/zk.d.ts',
  'lib/wasm-zk/zk_bg.wasm',
]

// wasm-pack is commonly installed via cargo/rustup, which does not put
// ~/.cargo/bin on PATH for non-login shells (or for a CI runner).
const cargoBin = process.env.HOME ? join(process.env.HOME, '.cargo', 'bin') : null
const env = {
  ...process.env,
  PATH: cargoBin ? `${cargoBin}:${process.env.PATH ?? ''}` : (process.env.PATH ?? ''),
}

function hasWasmPack() {
  const probe = spawnSync('wasm-pack', ['--version'], { env, stdio: 'ignore' })
  return probe.status === 0
}

function missingArtifacts() {
  return REQUIRED_ARTIFACTS.filter((rel) => !existsSync(join(repoRoot, rel)))
}

function run(script) {
  console.log(`> bun run ${script}`)
  execFileSync('bun', ['run', script], { cwd: repoRoot, env, stdio: 'inherit' })
}

const skipRequested = process.env.SKIP_WASM_BUILD === '1'
const toolchainAvailable = hasWasmPack()

if (!skipRequested && toolchainAvailable) {
  run('build:wasm:main')
  run('build:wasm:zk')
  process.exit(0)
}

const missing = missingArtifacts()
if (missing.length > 0) {
  const why = skipRequested
    ? 'SKIP_WASM_BUILD=1 was set'
    : 'wasm-pack was not found on PATH (checked ~/.cargo/bin too)'
  console.error(
    [
      '',
      `✗ Cannot produce the wasm bundle: ${why}, and the committed artifacts are incomplete.`,
      '',
      'Missing:',
      ...missing.map((rel) => `  - ${rel}`),
      '',
      'Fix either side:',
      '  • install the toolchain — https://rustwasm.github.io/wasm-pack/installer/',
      '    then run `bun run build:wasm` and commit the regenerated files, or',
      '  • restore the artifacts — `git checkout -- lib/wasm lib/wasm-zk public/main.wasm`',
      '',
    ].join('\n')
  )
  process.exit(1)
}

console.warn(
  [
    '',
    skipRequested
      ? '⚠ SKIP_WASM_BUILD=1 — using the committed wasm artifacts.'
      : '⚠ wasm-pack not found — using the committed wasm artifacts instead of recompiling.',
    '  Fine on a deploy host with no Rust toolchain (this is why the build outputs are',
    '  checked in). If you changed wasm/ or wasm-zk/, this build does NOT contain your',
    '  change — install wasm-pack and rerun `bun run build:wasm` locally.',
    '',
  ].join('\n')
)
