import { describe, expect, it } from 'vitest'
import {
  parseUsdPrice,
  toScaledUsd,
  USD_DECIMALS,
  usdAdd,
  usdDiffFloor,
  usdToFixedString,
  usdToString,
} from '@/domain/shared/prices'

describe('USD precision utilities', () => {
  describe('USD_DECIMALS constant', () => {
    it('should be 8 decimals', () => {
      expect(USD_DECIMALS).toBe(8)
    })
  })

  describe('parseUsdPrice', () => {
    it('should parse integer prices', () => {
      expect(parseUsdPrice(1500)).toBe(150_000_000_000n) // 1500 * 10^8
    })

    it('should parse decimal prices', () => {
      expect(parseUsdPrice(1.5)).toBe(150_000_000n)
      expect(parseUsdPrice(0.01)).toBe(1_000_000n)
    })

    it('should parse string prices', () => {
      expect(parseUsdPrice('2000')).toBe(200_000_000_000n)
      expect(parseUsdPrice('0.5')).toBe(50_000_000n)
    })

    it('should handle zero', () => {
      expect(parseUsdPrice(0)).toBe(0n)
      expect(parseUsdPrice('0')).toBe(0n)
    })

    it('should handle very small values', () => {
      expect(parseUsdPrice('0.00000001')).toBe(1n) // Minimum precision
    })

    it('should handle very large values', () => {
      expect(parseUsdPrice(1_000_000)).toBe(100_000_000_000_000n)
    })
  })

  describe('toScaledUsd', () => {
    it('should convert token amount to USD (18 decimals)', () => {
      const amount = 1_000_000_000_000_000_000n // 1 token with 18 decimals
      const price = 2000_00_000_000n // $2000 with 8 decimals
      const result = toScaledUsd(amount, 18, price)
      expect(result).toBe(2000_00_000_000n) // $2000
    })

    it('should convert token amount to USD (6 decimals - USDC)', () => {
      const amount = 1_000_000n // 1 USDC with 6 decimals
      const price = 1_00_000_000n // $1.00 with 8 decimals
      const result = toScaledUsd(amount, 6, price)
      expect(result).toBe(1_00_000_000n) // $1.00
    })

    it('should handle fractional token amounts', () => {
      const amount = 500_000_000_000_000_000n // 0.5 token
      const price = 3000_00_000_000n // $3000
      const result = toScaledUsd(amount, 18, price)
      expect(result).toBe(1500_00_000_000n) // $1500
    })

    it('should return 0 for zero amount', () => {
      expect(toScaledUsd(0n, 18, 2000_00_000_000n)).toBe(0n)
    })

    it('should return 0 for zero price', () => {
      expect(toScaledUsd(1_000_000_000_000_000_000n, 18, 0n)).toBe(0n)
    })

    it('should return 0 for negative amount', () => {
      expect(toScaledUsd(-100n, 18, 2000_00_000_000n)).toBe(0n)
    })

    it('should return 0 for negative price', () => {
      expect(toScaledUsd(1_000_000_000_000_000_000n, 18, -2000n)).toBe(0n)
    })

    it('should handle very large amounts without overflow', () => {
      const largeAmount = 1_000_000_000_000_000_000_000n // 1000 tokens
      const price = 5000_00_000_000n
      const result = toScaledUsd(largeAmount, 18, price)
      expect(result).toBe(5_000_000_00_000_000n) // $5M
    })

    it('should preserve precision in division', () => {
      const amount = 1_234_567_890_123_456_789n
      const price = 1_00_000_000n // $1
      const result = toScaledUsd(amount, 18, price)
      expect(result).toBe(1_23_456_789n) // Correctly scaled
    })
  })

  describe('usdAdd', () => {
    it('should add two USD values', () => {
      const a = 1500_00_000_000n // $1500
      const b = 500_00_000_000n // $500
      expect(usdAdd(a, b)).toBe(2000_00_000_000n) // $2000
    })

    it('should handle adding zero', () => {
      const a = 1000_00_000_000n
      expect(usdAdd(a, 0n)).toBe(a)
      expect(usdAdd(0n, a)).toBe(a)
    })

    it('should handle very large additions', () => {
      const a = 999_999_999_00_000_000n
      const b = 1_00_000_000n
      expect(usdAdd(a, b)).toBe(1_000_000_000_00_000_000n)
    })
  })

  describe('usdDiffFloor', () => {
    it('should subtract when a > b', () => {
      const a = 2000_00_000_000n // $2000
      const b = 500_00_000_000n // $500
      expect(usdDiffFloor(a, b)).toBe(1500_00_000_000n) // $1500
    })

    it('should return 0 when a < b (floor behavior)', () => {
      const a = 500_00_000_000n // $500
      const b = 2000_00_000_000n // $2000
      expect(usdDiffFloor(a, b)).toBe(0n)
    })

    it('should return 0 when a == b', () => {
      const a = 1000_00_000_000n
      expect(usdDiffFloor(a, a)).toBe(0n)
    })

    it('should handle subtracting zero', () => {
      const a = 1000_00_000_000n
      expect(usdDiffFloor(a, 0n)).toBe(a)
    })

    it('should handle very small differences', () => {
      const a = 1_00_000_001n // $1.00000001
      const b = 1_00_000_000n // $1.00000000
      expect(usdDiffFloor(a, b)).toBe(1n)
    })
  })

  describe('usdToString', () => {
    it('should format USD to string', () => {
      expect(usdToString(2000_00_000_000n)).toBe('2000')
      expect(usdToString(1_50_000_000n)).toBe('1.5')
    })

    it('should handle zero', () => {
      expect(usdToString(0n)).toBe('0')
    })

    it('should handle very small values', () => {
      expect(usdToString(1n)).toBe('0.00000001')
    })

    it('should handle very large values', () => {
      expect(usdToString(1_000_000_00_000_000n)).toBe('1000000')
    })

    it('should preserve all decimals', () => {
      expect(usdToString(12_34_567_890n)).toBe('12.3456789')
    })
  })

  describe('usdToFixedString', () => {
    it('should format with 2 decimal places (default)', () => {
      expect(usdToFixedString(2000_00_000_000n)).toBe('2000.00')
      expect(usdToFixedString(1_50_000_000n)).toBe('1.50')
    })

    it('should format with custom decimal places', () => {
      expect(usdToFixedString(1234_56_789_012n, 4)).toBe('1234.5678')
      expect(usdToFixedString(1234_56_789_012n, 8)).toBe('1234.56789012')
    })

    it('should pad with zeros when needed', () => {
      expect(usdToFixedString(1000_00_000_000n, 2)).toBe('1000.00')
      expect(usdToFixedString(1_50_000_000n, 4)).toBe('1.5000')
    })

    it('should handle zero decimal places', () => {
      expect(usdToFixedString(1234_56_000_000n, 0)).toBe('1234')
    })

    it('should handle negative decimal places', () => {
      expect(usdToFixedString(1234_56_000_000n, -1)).toBe('1234')
    })

    it('should truncate extra decimals', () => {
      expect(usdToFixedString(1_23_456_789n, 2)).toBe('1.23')
    })

    it('should handle zero', () => {
      expect(usdToFixedString(0n)).toBe('0.00')
      expect(usdToFixedString(0n, 4)).toBe('0.0000')
    })

    it('should handle very small values with padding', () => {
      expect(usdToFixedString(1n, 2)).toBe('0.00') // Rounds down
      expect(usdToFixedString(1_000_000n, 2)).toBe('0.01')
    })

    it('should handle large values with formatting', () => {
      expect(usdToFixedString(999_999_99_000_000n, 2)).toBe('999999.99')
    })
  })

  describe('integration: realistic scenarios', () => {
    it('should correctly calculate equity from collateral and debt', () => {
      // Scenario: 1 ETH collateral @ $2000, 500 USDC debt @ $1
      const ethAmount = 1_000_000_000_000_000_000n // 1 ETH
      const ethPrice = parseUsdPrice(2000)
      const collateralUsd = toScaledUsd(ethAmount, 18, ethPrice)

      const usdcAmount = 500_000_000n // 500 USDC
      const usdcPrice = parseUsdPrice(1)
      const debtUsd = toScaledUsd(usdcAmount, 6, usdcPrice)

      const equity = usdDiffFloor(collateralUsd, debtUsd)
      expect(usdToFixedString(equity, 2)).toBe('1500.00')
    })

    it('should handle slippage calculations', () => {
      const inputUsd = parseUsdPrice(1000)
      const slippageBps = 50n // 0.5%
      const minOut = (inputUsd * (10000n - slippageBps)) / 10000n
      expect(usdToFixedString(minOut, 2)).toBe('995.00')
    })
  })
})
