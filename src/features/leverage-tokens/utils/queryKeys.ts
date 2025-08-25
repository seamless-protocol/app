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
  rebalancing: (addr: `0x${string}`) => [...ltKeys.token(addr), 'rebalancing'] as const,
  metadata: (addr: `0x${string}`) => [...ltKeys.token(addr), 'metadata'] as const,
  simulation: {
    mint: (addr: `0x${string}`, amount: bigint) =>
      [...ltKeys.token(addr), 'simulate', 'mint', amount.toString()] as const,
    redeem: (addr: `0x${string}`, amount: bigint) =>
      [...ltKeys.token(addr), 'simulate', 'redeem', amount.toString()] as const,
  },
} as const
