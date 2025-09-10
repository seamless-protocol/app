import type { Address } from 'viem'

/**
 * Hierarchical query keys for staking feature
 * Follows TanStack Query best practices for cache invalidation
 */
export const stakingKeys = {
  all: ['staking'] as const,
  stats: () => [...stakingKeys.all, 'stats'] as const,
  userPosition: () => [...stakingKeys.all, 'userPosition'] as const,
  rewards: (user?: Address) => [...stakingKeys.all, 'rewards', user] as const,
  cooldown: () => [...stakingKeys.all, 'cooldown'] as const,
  apr: () => [...stakingKeys.all, 'apr'] as const,
} as const
