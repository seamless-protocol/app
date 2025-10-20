import { describe, expect, it } from 'vitest'
import type { BalanceChange, LeverageTokenState, UserPosition } from '@/lib/graphql/types/portfolio'
import {
  generatePortfolioPerformanceData,
  type GetUsdPriceAt,
} from '@/features/portfolio/utils/portfolio-calculations'

function us(sec: number) {
  return String(sec * 1_000_000)
}

describe('generatePortfolioPerformanceData', () => {
  it('includes exact window start and uses baseline + historical USD', () => {
    const now = Math.floor(Date.now() / 1000)
    const from = now - 30 * 24 * 60 * 60

    // Single position on a leverage token with collateral at address 0xCOLL
    const userPositions: Array<UserPosition> = [
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
        balance: String(1n * 10n ** 18n), // 1 LT
        totalEquityDepositedInCollateral: '0',
        totalEquityDepositedInDebt: '0',
      },
    ]

    // Token states: equityPerToken grows over time
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
            equityPerTokenInCollateral: String(1n * 10n ** 18n), // 1 unit
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
            equityPerTokenInCollateral: String(2n * 10n ** 18n), // 2 units
            equityPerTokenInDebt: '0',
            timestamp: us(from + 20),
            blockNumber: '0',
          },
        ],
      ],
    ])

    // Balance changes include a baseline before the window start
    const balanceChanges: Array<BalanceChange> = [
      {
        id: 'b0',
        position: { id: 'pos-1', leverageToken: { id: '0xLT' } },
        timestamp: us(from - 5), // before window
        amount: String(1n * 10n ** 18n), // held 1 LT before window
      },
    ]

    // Historical USD accessor: 0xCOLL = $100 at from+10, $105 at from+20
    const getUsdPriceAt: GetUsdPriceAt = (_chainId, address, ts) => {
      if (address.toLowerCase() !== '0xcoll') return undefined
      if (ts >= from + 20) return 105
      if (ts >= from + 10) return 100
      return undefined
    }

    // Decimals/chain maps
    const collateralDecimalsByLeverageToken = { '0xlt': 18 }
    const chainIdByLeverageToken = { '0xlt': 1 }

    const points = generatePortfolioPerformanceData(
      userPositions,
      leverageTokenStates,
      balanceChanges,
      '30D',
      getUsdPriceAt,
      collateralDecimalsByLeverageToken,
      chainIdByLeverageToken,
      {},
    )

    expect(points.length).toBeGreaterThan(0)
    // First grid point equals exact window start
    const firstTs = points[0]?.timestamp
    expect(firstTs).toBeDefined()
    expect(firstTs).toBeGreaterThanOrEqual(from)
    expect(firstTs).toBeLessThanOrEqual(from + 60) // within a minute of start due to flooring

    // After from+20, value = 1 * 2 (equity per token) * $105 = $210
    const ptAfter20 = points.find((p) => (p.timestamp ?? 0) >= from + 20)
    expect(ptAfter20?.value).toBe(210)
  })
})

