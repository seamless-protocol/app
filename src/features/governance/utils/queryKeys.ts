/**
 * Hierarchical query keys for governance feature
 * Follows TanStack Query best practices for cache invalidation
 */
export const governanceKeys = {
  all: ['governance'] as const,
  proposals: () => [...governanceKeys.all, 'proposals'] as const,
  organization: (orgId: string) => [...governanceKeys.proposals(), orgId] as const,
} as const
