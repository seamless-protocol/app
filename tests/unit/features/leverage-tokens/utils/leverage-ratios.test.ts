import { describe, expect, it, vi } from 'vitest'

// Mock the module to avoid global mock conflicts
vi.mock('@/features/leverage-tokens/utils/apy-calculations/leverage-ratios', async () => {
  const actual = await vi.importActual(
    '@/features/leverage-tokens/utils/apy-calculations/leverage-ratios',
  )
  return actual
})

import { collateralRatioToLeverage } from '@/features/leverage-tokens/utils/apy-calculations/leverage-ratios'

describe('leverage-ratios', () => {
  describe('collateralRatioToLeverage', () => {
    it('should convert collateral ratio to leverage ratio correctly', () => {
      // Test case 1: 2x leverage (collateral ratio = 2e18)
      const collateralRatio2x = BigInt(2 * 10 ** 18) // 2.0
      const leverage2x = Number(collateralRatioToLeverage(collateralRatio2x)) / 1e18
      expect(leverage2x).toBeCloseTo(2.0, 2)

      // Test case 2: 3x leverage (collateral ratio = 1.5e18)
      const collateralRatio3x = BigInt(1.5 * 10 ** 18) // 1.5
      const leverage3x = Number(collateralRatioToLeverage(collateralRatio3x)) / 1e18
      expect(leverage3x).toBeCloseTo(3.0, 2)

      // Test case 3: 5x leverage (collateral ratio = 1.25e18)
      const collateralRatio5x = BigInt(1.25 * 10 ** 18) // 1.25
      const leverage5x = Number(collateralRatioToLeverage(collateralRatio5x)) / 1e18
      expect(leverage5x).toBeCloseTo(5.0, 2)
    })

    it('should handle edge cases', () => {
      // Test case: Very high leverage (collateral ratio close to 1)
      const collateralRatioHigh = BigInt(1.01 * 10 ** 18) // 1.01
      const leverageHigh = Number(collateralRatioToLeverage(collateralRatioHigh)) / 1e18
      expect(leverageHigh).toBeCloseTo(101.0, 1)

      // Test case: Low leverage (high collateral ratio)
      const collateralRatioLow = BigInt(10 * 10 ** 18) // 10.0
      const leverageLow = Number(collateralRatioToLeverage(collateralRatioLow)) / 1e18
      expect(leverageLow).toBeCloseTo(1.11, 2)
    })
  })
})
