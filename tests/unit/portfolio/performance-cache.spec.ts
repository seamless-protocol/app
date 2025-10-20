import { describe, expect, it, vi } from 'vitest'
import { computePerformancePointsFromCache } from '@/features/portfolio/utils/performance'
import type { BalanceChange, LeverageTokenState, UserPosition } from '@/lib/graphql/types/portfolio'

// Mock leverage token config access to provide chainId + collateral decimals
vi.mock('@/features/leverage-tokens/leverageTokens.config', () => ({
  getLeverageTokenConfig: (addr: string) => {
    if (addr.toLowerCase() === '0xlt') {
      return {
        address: '0xLT',
        chainId: 8453,
        collateralAsset: { symbol: 'WETH', name: 'WETH', decimals: 18 },
        debtAsset: { symbol: 'weETH', name: 'weETH', decimals: 18 },
      }
    }
    return undefined
  },
}))

function us(sec: number) {
  return String(sec * 1_000_000)
}

describe('computePerformancePointsFromCache', () => {
  it('uses nearest-prior USD history with baseline and correct decimals', () => {
    const now = Math.floor(Date.now() / 1000)
    const from = now - 30 * 24 * 60 * 60

    const rawUserPositions: Array<UserPosition> = [
      {
        id: 'pos-1',
        leverageToken: {
          id: '0xLT',
          collateralRatio: '0',
          totalCollateral: '0',
          totalSupply: '0',
          lendingAdapter: {
            collateralAsset: '0xCOLL',
            debtAsset: '0xDEBT',
            oracle: { id: '0xORACLE', price: '0', decimals: 18 },
          },
        },
        balance: String(0n), // not used; historical balance comes from balanceChanges
        totalEquityDepositedInCollateral: '0',
        totalEquityDepositedInDebt: '0',
      },
    ]

    const leverageTokenStates = new Map<string, Array<LeverageTokenState>>([
      [
        '0xLT',
        [
          {
            id: 's1',
            leverageToken: '0xLT',
            collateralRatio: '0',
            totalCollateral: '0',
            totalDebt: '0',
            totalEquityInCollateral: '0',
            totalEquityInDebt: '0',
            totalSupply: '0',
            equityPerTokenInCollateral: String(1n * 10n ** 18n),
            equityPerTokenInDebt: '0',
            timestamp: us(from + 10),
            blockNumber: '0',
          },
          {
            id: 's2',
            leverageToken: '0xLT',
            collateralRatio: '0',
            totalCollateral: '0',
            totalDebt: '0',
            totalEquityInCollateral: '0',
            totalEquityInDebt: '0',
            totalSupply: '0',
            equityPerTokenInCollateral: String(2n * 10n ** 18n),
            equityPerTokenInDebt: '0',
            timestamp: us(from + 20),
            blockNumber: '0',
          },
        ],
      ],
    ])

    const balanceChanges: Array<BalanceChange> = [
      {
        id: 'b0',
        position: { id: 'pos-1', leverageToken: { id: '0xLT' } },
        timestamp: us(from - 5),
        amount: String(1n * 10n ** 18n),
      },
    ]

    // Price history: at from+10 -> $100, at from+20 -> $110
    const usdHistory = {
      8453: {
        '0xcoll': [
          [from + 10, 100],
          [from + 20, 110],
        ] as Array<[number, number]>,
      },
    } as Record<number, Record<string, Array<[number, number]>>>

    const points = computePerformancePointsFromCache({
      rawUserPositions,
      leverageTokenStates,
      balanceChanges,
      timeframe: '30D',
      usdHistory,
    })

    expect(points.length).toBeGreaterThan(0)

    // Find first point at or after from+20; value should be 1 * 2 (E/T) * $110 = $220
    const ptAfter20 = points.find((p) => (p.timestamp ?? 0) >= from + 20)
    expect(ptAfter20).toBeDefined()
    expect(ptAfter20?.value).toBe(220)
  })
})
