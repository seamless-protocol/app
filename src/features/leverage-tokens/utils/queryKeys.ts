/**
 * Hierarchical query keys for leverage tokens
 * Follows TanStack Query best practices for cache invalidation
 */
export const ltKeys = {
  all: ['leverage-tokens'] as const,
  factory: () => [...ltKeys.all, 'factory'] as const,
  tokens: () => [...ltKeys.all, 'tokens'] as const,
  token: (addr: `0x${string}`) => [...ltKeys.tokens(), addr] as const,
  user: (addr: `0x${string}`, owner: `0x${string}`) =>
    [...ltKeys.token(addr), 'user', owner] as const,
  supply: (addr: `0x${string}`) => [...ltKeys.token(addr), 'supply'] as const,
  price: (addr: `0x${string}`) => [...ltKeys.token(addr), 'price'] as const,
  // Live state and TVL keys
  state: (addr: `0x${string}`) => [...ltKeys.token(addr), 'state'] as const,
  tvl: (addr: `0x${string}`) => [...ltKeys.token(addr), 'tvl'] as const,
  protocolTvl: () => [...ltKeys.all, 'protocol-tvl'] as const,
  tableData: () => [...ltKeys.all, 'table-data'] as const,
  rebalancing: (addr: `0x${string}`) => [...ltKeys.token(addr), 'rebalancing'] as const,
  metadata: (addr: `0x${string}`) => [...ltKeys.token(addr), 'metadata'] as const,
  detailedMetrics: (addr: `0x${string}`) => [...ltKeys.token(addr), 'detailed-metrics'] as const,
  apy: (addr: `0x${string}`) => [...ltKeys.token(addr), 'apy'] as const,
  simulation: {
    mint: (addr: `0x${string}`, amount: bigint) =>
      [...ltKeys.token(addr), 'simulate', 'mint', amount.toString()] as const,
    redeem: (addr: `0x${string}`, amount: bigint) =>
      [...ltKeys.token(addr), 'simulate', 'redeem', amount.toString()] as const,
  },
  // External data sources (shared across all tokens)
  external: {
    etherFiApr: () => [...ltKeys.all, 'external', 'etherfi-apr'] as const,
    borrowApy: (addr: `0x${string}`) => [...ltKeys.all, 'external', 'borrow-apy', addr] as const,
    leverageRatios: (addr: `0x${string}`) =>
      [...ltKeys.all, 'external', 'leverage-ratios', addr] as const,
    rewardsApr: (addr: `0x${string}`) => [...ltKeys.all, 'external', 'rewards-apr', addr] as const,
  },
} as const
