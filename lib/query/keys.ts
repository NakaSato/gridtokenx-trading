/**
 * Central TanStack Query key factory. Every server-state query in the app
 * builds its key here so invalidation is greppable and collision-free.
 *
 * Convention: [domain, entity, ...params]. Spread a factory result, never
 * hand-write the array at a call site.
 */
export const queryKeys = {
  auth: {
    profile: () => ['auth', 'profile'] as const,
    wallets: () => ['auth', 'wallets'] as const,
  },
  trading: {
    all: () => ['trading'] as const,
    positions: (owner?: string) => ['trading', 'positions', owner] as const,
    openOrders: (owner?: string) => ['trading', 'open-orders', owner] as const,
    orderHistory: (owner?: string) =>
      ['trading', 'order-history', owner] as const,
    tradeHistory: (symbol?: string) =>
      ['trading', 'trade-history', symbol] as const,
    expiredOptions: (owner?: string) =>
      ['trading', 'expired-options', owner] as const,
    marketData: (symbol?: string) => ['trading', 'market-data', symbol] as const,
  },
  p2p: {
    all: () => ['p2p'] as const,
    orders: (zone?: number | string) => ['p2p', 'orders', zone] as const,
    activity: (owner?: string) => ['p2p', 'activity', owner] as const,
    epoch: () => ['p2p', 'epoch'] as const,
  },
  futures: {
    all: () => ['futures'] as const,
    products: () => ['futures', 'products'] as const,
    orderBook: (symbol: string) => ['futures', 'order-book', symbol] as const,
    positions: (owner?: string) => ['futures', 'positions', owner] as const,
  },
  meters: {
    all: () => ['meters'] as const,
    mine: (owner?: string) => ['meters', 'mine', owner] as const,
    public: () => ['meters', 'public'] as const,
    readings: (meterId?: string, page?: number) =>
      ['meters', 'readings', meterId, page] as const,
  },
  grid: {
    status: (zone?: number | string) => ['grid', 'status', zone] as const,
    topology: () => ['grid', 'topology'] as const,
    flows: () => ['grid', 'flows'] as const,
  },
  portfolio: {
    all: (owner?: string) => ['portfolio', owner] as const,
    stats: (owner?: string) => ['portfolio', 'stats', owner] as const,
  },
  carbon: {
    balance: (owner?: string) => ['carbon', 'balance', owner] as const,
    history: (owner?: string) => ['carbon', 'history', owner] as const,
  },
  pyth: {
    price: (feedId: string) => ['pyth', 'price', feedId] as const,
    history: (feedId: string, resolution?: string) =>
      ['pyth', 'history', feedId, resolution] as const,
  },
  wallet: {
    balance: (owner?: string, mint?: string) =>
      ['wallet', 'balance', owner, mint] as const,
    activity: (owner?: string) => ['wallet', 'activity', owner] as const,
  },
  notifications: {
    list: () => ['notifications'] as const,
    preferences: () => ['notifications', 'preferences'] as const,
  },
} as const
