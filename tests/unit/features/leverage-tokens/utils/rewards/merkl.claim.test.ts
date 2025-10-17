import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MerklRewardClaimProvider,
  SUPPORTED_CHAIN_IDS,
} from '@/features/leverage-tokens/utils/rewards/merkl'

// Ensure global fetch is mockable
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('MerklRewardClaimProvider (user rewards fetch)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('performs a simple GET (no headers) to avoid CORS preflight', async () => {
    const provider = new MerklRewardClaimProvider()
    const user = '0x0000000000000000000000000000000000000001'
    const chainParam = SUPPORTED_CHAIN_IDS.join(',')

    // Return 404 to exercise the graceful empty-path without deeper processing
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 } as Response)

    const rewards = await provider.fetchClaimableRewards(user as `0x${string}`)
    expect(rewards).toEqual([])

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.merkl.xyz/v4/users/${user}/rewards?chainId=${chainParam}`,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    )

    // Ensure no headers are present to keep it a simple request (no preflight)
    const options = (mockFetch.mock.calls[0] as Array<unknown>)[1] as Record<string, unknown>
    expect(options['headers']).toBeUndefined()
  })
})
