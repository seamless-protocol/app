/**
 * Hierarchical query keys for portfolio feature
 * Follows TanStack Query best practices for cache invalidation
 */
export const portfolioKeys = {
  all: ['portfolio'] as const,
  data: () => [...portfolioKeys.all, 'data'] as const,
  performance: (timeframe: string) => [...portfolioKeys.all, 'performance', timeframe] as const,
  rewards: (address?: string) => [...portfolioKeys.all, 'rewards', address] as const,
  staking: () => [...portfolioKeys.all, 'staking'] as const,
  positions: () => [...portfolioKeys.all, 'positions'] as const,
  summary: () => [...portfolioKeys.all, 'summary'] as const,
} as const
