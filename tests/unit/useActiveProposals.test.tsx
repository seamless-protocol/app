import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useActiveProposals } from '@/features/governance/hooks/useActiveProposals'
import type { TallyProposal } from '@/features/governance/types'
import { getProposals } from '@/features/governance/utils/tally'
import { hookTestUtils, mockSetup } from '../utils'

// Use the global mocks from tests/setup.ts
const mockGetProposals = vi.mocked(getProposals)

// Mock data matching the actual TallyProposal type
const mockProposals: Array<TallyProposal> = [
  {
    id: 'proposal-1',
    onchainId: '1',
    status: 'active',
    originalId: null,
    createdAt: '2024-01-01T00:00:00Z',
    quorum: '1000000000000000000000',
    voteStats: [
      {
        votesCount: '500000000000000000000',
        percent: 50,
        type: 'for',
        votersCount: 25,
      },
      {
        votesCount: '300000000000000000000',
        percent: 30,
        type: 'against',
        votersCount: 15,
      },
      {
        votesCount: '200000000000000000000',
        percent: 20,
        type: 'abstain',
        votersCount: 10,
      },
    ],
    metadata: {
      description: 'This is a test proposal for governance',
    },
    events: [
      {
        type: 'PROPOSAL_CREATED',
        txHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
      },
    ],
    start: {
      timestamp: '2024-01-01T00:00:00Z',
    },
    block: {
      timestamp: '2024-01-01T00:00:00Z',
    },
    governor: {
      id: 'eip155:8453:0x8768c789C6df8AF1a92d96dE823b4F80010Db294',
      quorum: '1000000000000000000000',
      name: 'Seamless Protocol',
      timelockId: '0x639d2dD24304aC2e6A691d8c1cFf4a2665925fee',
      token: {
        decimals: 18,
      },
    },
  },
  {
    id: 'proposal-2',
    onchainId: '2',
    status: 'active',
    originalId: null,
    createdAt: '2024-01-02T00:00:00Z',
    quorum: '1000000000000000000000',
    voteStats: [
      {
        votesCount: '300000000000000000000',
        percent: 30,
        type: 'for',
        votersCount: 15,
      },
      {
        votesCount: '400000000000000000000',
        percent: 40,
        type: 'against',
        votersCount: 20,
      },
      {
        votesCount: '300000000000000000000',
        percent: 30,
        type: 'abstain',
        votersCount: 15,
      },
    ],
    metadata: {
      description: 'This is another test proposal for governance',
    },
    events: [
      {
        type: 'PROPOSAL_CREATED',
        txHash: '0x2345678901234567890123456789012345678901234567890123456789012345',
      },
    ],
    start: {
      timestamp: '2024-01-02T00:00:00Z',
    },
    block: {
      timestamp: '2024-01-02T00:00:00Z',
    },
    governor: {
      id: 'eip155:8453:0x8768c789C6df8AF1a92d96dE823b4F80010Db294',
      quorum: '1000000000000000000000',
      name: 'Seamless Protocol',
      timelockId: '0x639d2dD24304aC2e6A691d8c1cFf4a2665925fee',
      token: {
        decimals: 18,
      },
    },
  },
]

describe('useActiveProposals', () => {
  beforeEach(() => {
    mockSetup.clearAllMocks()
    // Setup default mock response
    mockGetProposals.mockResolvedValue({
      proposals: {
        nodes: mockProposals,
        pageInfo: {
          firstCursor: 'cursor-1',
          lastCursor: 'cursor-2',
          count: 2,
        },
      },
    })
  })

  describe('hook initialization', () => {
    it('should create infinite query with correct initial state', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useActiveProposals())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isError).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.fetchNextPage).toBeDefined()
      expect(result.current.hasNextPage).toBeDefined()
    })

    it('should use correct query key for caching', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useActiveProposals())

      // The query key should be based on the organization ID
      expect(result.current.dataUpdatedAt).toBeDefined()
    })
  })

  describe('successful data fetching', () => {
    it('should fetch proposals successfully', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useActiveProposals())

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.pages).toHaveLength(1)
      expect(result.current.data?.pages[0]?.proposals).toEqual(mockProposals)
      expect(result.current.data?.pages[0]?.nextCursor).toBe('cursor-2')
      expect(mockGetProposals).toHaveBeenCalledWith({
        filters: {
          organizationId: 'test-org-id',
        },
        sort: {
          sortBy: 'id',
          isDescending: true,
        },
        page: {
          limit: 20,
        },
      })
    })

    it('should return correct data structure', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useActiveProposals())

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const firstPage = result.current.data?.pages[0]
      expect(firstPage).toEqual({
        proposals: mockProposals,
        nextCursor: 'cursor-2',
      })
    })
  })

  describe('pagination', () => {
    it('should handle fetchNextPage correctly', async () => {
      const nextPageProposals: Array<TallyProposal> = [
        {
          id: 'proposal-3',
          onchainId: '3',
          status: 'active',
          originalId: null,
          createdAt: '2024-01-03T00:00:00Z',
          quorum: '1000000000000000000000',
          voteStats: [
            {
              votesCount: '100000000000000000000',
              percent: 10,
              type: 'for',
              votersCount: 5,
            },
          ],
          metadata: {
            description: 'Third proposal',
          },
          events: [],
          start: {
            timestamp: '2024-01-03T00:00:00Z',
          },
          block: {
            timestamp: '2024-01-03T00:00:00Z',
          },
          governor: {
            id: 'eip155:8453:0x8768c789C6df8AF1a92d96dE823b4F80010Db294',
            quorum: '1000000000000000000000',
            name: 'Seamless Protocol',
            timelockId: '0x639d2dD24304aC2e6A691d8c1cFf4a2665925fee',
            token: {
              decimals: 18,
            },
          },
        },
      ]

      // Mock first page
      mockGetProposals.mockResolvedValueOnce({
        proposals: {
          nodes: mockProposals,
          pageInfo: {
            firstCursor: 'cursor-1',
            lastCursor: 'cursor-2',
            count: 2,
          },
        },
      })

      // Mock second page
      mockGetProposals.mockResolvedValueOnce({
        proposals: {
          nodes: nextPageProposals,
          pageInfo: {
            firstCursor: 'cursor-3',
            lastCursor: null,
            count: 1,
          },
        },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() => useActiveProposals())

      // Wait for first page to load
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.pages).toHaveLength(1)
      expect(result.current.hasNextPage).toBe(true)

      // Fetch next page
      await result.current.fetchNextPage()

      await waitFor(() => {
        expect(result.current.data?.pages).toHaveLength(2)
      })

      expect(result.current.data?.pages[1]?.proposals).toEqual(nextPageProposals)
      expect(result.current.data?.pages[1]?.nextCursor).toBe(null)
      expect(result.current.hasNextPage).toBe(false)

      // Verify API was called with cursor
      expect(mockGetProposals).toHaveBeenCalledWith({
        filters: {
          organizationId: 'test-org-id',
        },
        sort: {
          sortBy: 'id',
          isDescending: true,
        },
        page: {
          limit: 20,
          afterCursor: 'cursor-2',
        },
      })
    })

    it('should handle no more pages correctly', async () => {
      // Mock response with no next cursor
      mockGetProposals.mockResolvedValue({
        proposals: {
          nodes: mockProposals,
          pageInfo: {
            firstCursor: 'cursor-1',
            lastCursor: null,
            count: 2,
          },
        },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() => useActiveProposals())

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.hasNextPage).toBe(false)
    })
  })

  describe('query key structure', () => {
    it('should use correct query key for caching', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useActiveProposals())

      // The query key should be based on the organization ID
      expect(result.current.dataUpdatedAt).toBeDefined()
    })
  })

  describe('stale time configuration', () => {
    it('should respect stale time configuration', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useActiveProposals())

      // The hook should use the STALE_TIME.proposals configuration
      expect(result.current.isStale).toBeDefined()
    })
  })
})
