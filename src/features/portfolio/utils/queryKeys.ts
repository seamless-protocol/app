/**
 * Hierarchical query keys for portfolio feature
 * Follows TanStack Query best practices for cache invalidation
 */
export const portfolioKeys = {
  all: ['portfolio'] as const,
  data: (address?: string) => [...portfolioKeys.all, 'data', address] as const,
  performance: (timeframe: string, address?: string) =>
    [...portfolioKeys.all, 'performance', timeframe, address] as const,
  rewards: (address?: string) => [...portfolioKeys.all, 'rewards', address] as const,
  staking: (address?: string) => [...portfolioKeys.all, 'staking', address] as const,
  positions: (address?: string) => [...portfolioKeys.all, 'positions', address] as const,
  summary: (address?: string) => [...portfolioKeys.all, 'summary', address] as const,
  positionsAPY: (tokens: Array<{ id?: string; address?: string; leverageTokenAddress?: string }>) =>
    [
      'apy',
      'tokens',
      tokens.map((t) => t.id || t.address || t.leverageTokenAddress).sort(),
    ] as const,
} as const
