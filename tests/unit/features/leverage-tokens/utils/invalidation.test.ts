import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { invalidateLeverageTokenQueries } from '@/features/leverage-tokens/utils/invalidation'
import { makeAddr } from '../../../../utils'

describe('invalidateLeverageTokenQueries', () => {
  it('invalidates state, tableData, protocolTvl, and optionally user queries with refetchType=active', async () => {
    const token = makeAddr('token')
    const owner = makeAddr('owner')

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    const spy = vi.spyOn(qc, 'invalidateQueries')

    await invalidateLeverageTokenQueries(qc, {
      token: token as `0x${string}`,
      chainId: 8453,
      owner: owner as `0x${string}`,
      includeUser: true,
      refetchType: 'active',
    })

    // Expect at least 5 invalidations: state, collateral, tableData, protocolTvl, user
    expect(spy).toHaveBeenCalled()

    // Build expected calls
    const expected = [
      {
        queryKey: ['leverage-tokens', 'tokens', token, 'state'] as const,
        refetchType: 'active' as const,
      },
      {
        queryKey: ['leverage-tokens', 'tokens', token, 'collateral'] as const,
        refetchType: 'active' as const,
      },
      { queryKey: ['leverage-tokens', 'table-data'] as const, refetchType: 'active' as const },
      { queryKey: ['leverage-tokens', 'protocol-tvl'] as const, refetchType: 'active' as const },
      {
        queryKey: ['leverage-tokens', 'tokens', token, 'user', owner] as const,
        refetchType: 'active' as const,
      },
    ]

    // Check that all expected calls are included (order-agnostic)
    for (const exp of expected) {
      expect(spy.mock.calls.some((args) => deepPartialMatch(args[0], exp))).toBe(true)
    }
  })
})

function deepPartialMatch(actual: any, expected: any): boolean {
  if (typeof expected !== 'object' || expected === null) return actual === expected
  if (typeof actual !== 'object' || actual === null) return false
  for (const key of Object.keys(expected)) {
    if (!deepPartialMatch(actual[key], expected[key])) return false
  }
  return true
}
