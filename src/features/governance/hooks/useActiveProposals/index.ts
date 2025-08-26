import { useInfiniteQuery } from '@tanstack/react-query'
import type { TallyProposal } from '../../types'
import { QUERY_SETTINGS, STALE_TIME, TALLY_CONFIG } from '../../utils/constants'
import { governanceKeys } from '../../utils/queryKeys'
import { getProposals } from '../../utils/tally'

interface ProposalsPage {
  proposals: Array<TallyProposal>
  nextCursor: string | null
}

/**
 * Fetches active governance proposals using infinite query for pagination
 * Handles cursor-based pagination and automatic refetching
 */
export function useActiveProposals() {
  return useInfiniteQuery<ProposalsPage>({
    queryKey: governanceKeys.organization(TALLY_CONFIG.ORGANIZATION_ID),
    initialPageParam: null,
    queryFn: async ({ pageParam }): Promise<ProposalsPage> => {
      const result = await getProposals({
        filters: {
          organizationId: TALLY_CONFIG.ORGANIZATION_ID,
        },
        sort: {
          sortBy: 'id',
          isDescending: true,
        },
        page: {
          limit: 20,
          ...(pageParam ? { afterCursor: pageParam as string } : {}),
        },
      })

      return {
        proposals: result.proposals.nodes,
        nextCursor: result.proposals.pageInfo.lastCursor || null,
      }
    },

    staleTime: STALE_TIME.proposals,
    gcTime: QUERY_SETTINGS.gcTime,
    getNextPageParam: (lastPage: ProposalsPage) => lastPage.nextCursor,
    retry: (failureCount, error) => {
      // Don't retry on 401/403 (auth errors)
      if (error instanceof Error && error.message.includes('401')) return false
      if (error instanceof Error && error.message.includes('403')) return false
      return failureCount < 3
    },
  })
}
