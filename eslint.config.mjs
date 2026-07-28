import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

// Flat config (ESLint 9 / Next 16). Replaces the legacy .eslintrc.json —
// eslint-config-next@16 ships flat-config arrays, not eslintrc shareables.
const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'lib/wasm/**',
      'lib/wasm-zk/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'prefer-const': 'off',
      // Boundary ratchet: as each feature migrates to features/<x>/, its
      // legacy path is added here so nothing re-imports the old location.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/components/energy-grid/*',
                '@/components/meter/*',
                '@/components/EnergyGridMap*',
                '@/components/LiveGridStats',
                '@/components/MeterRegistrationModal',
              ],
              message:
                'Moved to features/energy-grid or features/meter — import from there.',
            },
            {
              group: ['@/components/p2p/*', '@/contexts/TradingProvider'],
              message:
                'Moved to features/p2p. Order-fill state is features/p2p/order-fill-context.',
            },
            {
              group: ['@/hooks/useApi', '@/contexts/SocketContext'],
              message:
                'Removed. Use TanStack Query (lib/query/keys.ts) and lib/ws/useWsChannel.',
            },
            {
              group: ['@/lib/data/Positions', '@/lib/data/WalletActivity'],
              message:
                'Types live in types/trading.ts and types/wallet.ts; mapApiOrderToOrder in lib/api/adapters.ts.',
            },
          ],
        },
      ],
    },
  },
]

export default eslintConfig
