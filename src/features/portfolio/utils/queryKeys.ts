/**
 * Hierarchical query keys for portfolio feature
 * Follows TanStack Query best practices for cache invalidation
 */
export const portfolioKeys = {
  all: ['portfolio'] as const,
  data: () => [...portfolioKeys.all, 'data'] as const,
  performance: (timeframe: string, address?: string) =>
    [...portfolioKeys.all, 'performance', timeframe, address] as const,
  rewards: (address?: string) => [...portfolioKeys.all, 'rewards', address] as const,
  staking: () => [...portfolioKeys.all, 'staking'] as const,
  positions: () => [...portfolioKeys.all, 'positions'] as const,
  summary: () => [...portfolioKeys.all, 'summary'] as const,
  positionsAPY: (positions: Array<any>) =>
    [...portfolioKeys.all, 'positionsAPY', positions.length] as const,
} as const
