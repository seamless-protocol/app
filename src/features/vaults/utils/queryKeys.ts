/**
 * Hierarchical query keys for vaults feature
 */
export const vaultKeys = {
  all: ['vaults'] as const,
  stats: () => [...vaultKeys.all, 'stats', 'defillama'] as const,
} as const
