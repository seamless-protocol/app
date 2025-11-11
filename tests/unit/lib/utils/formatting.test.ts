import { describe, expect, it } from 'vitest'
import { formatTokenAmountFromBase } from '@/lib/utils/formatting'

describe('formatTokenAmountFromBase', () => {
  describe('basic formatting', () => {
    it('should format a simple token amount with default 6 decimals', () => {
      const result = formatTokenAmountFromBase(1234567890n, 6, 6)
      expect(result).toBe('1234.567890')
    })

    it('should format USDC amount (6 decimals)', () => {
      const result = formatTokenAmountFromBase(1000000n, 6, 6)
      expect(result).toBe('1.000000')
    })

    it('should format ETH amount (18 decimals)', () => {
      const result = formatTokenAmountFromBase(1000000000000000000n, 18, 6)
      expect(result).toBe('1.000000')
    })

    it('should format with custom display decimals', () => {
      const result = formatTokenAmountFromBase(1234567n, 6, 2)
      expect(result).toBe('1.23')
    })
  })

  describe('precision preservation', () => {
    it('should preserve precision without Number conversion loss', () => {
      // Large USDC amount that could lose precision with Number conversion
      const largeAmount = 999999999999999n // 999,999,999.999999 USDC
      const result = formatTokenAmountFromBase(largeAmount, 6, 6)
      expect(result).toBe('999999999.999999')
    })

    it('should handle very large amounts correctly', () => {
      // Amount larger than JavaScript's MAX_SAFE_INTEGER
      const veryLarge = 10000000000000000n // 10 trillion USDC
      const result = formatTokenAmountFromBase(veryLarge, 6, 6)
      expect(result).toBe('10000000000.000000')
    })

    it('should round correctly for high-precision (24 -> 18 decimals)', () => {
      // 1.123456789012345683500000 (24 decimals) -> 1.123456789012345684 (18 display decimals)
      const highPrecision = 1123456789012345683500000n
      const result = formatTokenAmountFromBase(highPrecision, 24, 18)
      expect(result).toBe('1.123456789012345684')
    })
  })

  describe('rounding behavior', () => {
    it('should round up when next digit is 5 or greater', () => {
      // 0.0226185 should round to 0.022619 (6 decimals)
      const result = formatTokenAmountFromBase(22618500000000000n, 18, 6)
      expect(result).toBe('0.022619')
    })

    it('should round down when next digit is less than 5', () => {
      // 0.0226184 should round to 0.022618 (6 decimals)
      const result = formatTokenAmountFromBase(22618400000000000n, 18, 6)
      expect(result).toBe('0.022618')
    })

    it('should handle rounding at boundary (exactly 5)', () => {
      // 1.2345 should round to 1.235 (3 decimals)
      const result = formatTokenAmountFromBase(1234500n, 6, 3)
      expect(result).toBe('1.235')
    })

    it('should handle carry-over when rounding 999... to 1000...', () => {
      // 0.999999 should round to 1.000000 (6 decimals)
      const result = formatTokenAmountFromBase(999999500000000000n, 18, 6)
      expect(result).toBe('1.000000')
    })

    it('should round integer part when displayDecimals is 0', () => {
      // 1.5 USDC should round to 2
      const result = formatTokenAmountFromBase(1500000n, 6, 0)
      expect(result).toBe('2')
    })

    it('should not round integer part when first decimal < 5', () => {
      // 1.4 USDC should round to 1
      const result = formatTokenAmountFromBase(1400000n, 6, 0)
      expect(result).toBe('1')
    })

    it('should match toFixed() rounding behavior', () => {
      // Test case matching the bug report: ensure mmm and UI show same value
      // 1.999999 with 2 decimals should round to 2.00
      const result = formatTokenAmountFromBase(1999999n, 6, 2)
      expect(result).toBe('2.00')
    })
  })

  describe('decimal handling', () => {
    it('should pad zeros when value has fewer decimals than display', () => {
      const result = formatTokenAmountFromBase(1500000n, 6, 6)
      expect(result).toBe('1.500000')
    })

    it('should round when value has more decimals than display', () => {
      // 1.234567 rounds to 1.2346 (not truncates to 1.2345)
      const result = formatTokenAmountFromBase(1234567n, 6, 4)
      expect(result).toBe('1.2346')
    })

    it('should handle 0 display decimals', () => {
      const result = formatTokenAmountFromBase(1234567n, 6, 0)
      expect(result).toBe('1')
    })

    it('should format whole numbers with padding', () => {
      const result = formatTokenAmountFromBase(5000000n, 6, 6)
      expect(result).toBe('5.000000')
    })

    it('should format whole numbers without decimal point when displayDecimals is 0', () => {
      const result = formatTokenAmountFromBase(5000000n, 6, 0)
      expect(result).toBe('5')
    })
  })

  describe('edge cases', () => {
    it('should return "0" for undefined value', () => {
      const result = formatTokenAmountFromBase(undefined, 6, 6)
      expect(result).toBe('0')
    })

    it('should handle zero value', () => {
      const result = formatTokenAmountFromBase(0n, 6, 6)
      expect(result).toBe('0.000000')
    })

    it('should handle very small amounts', () => {
      const result = formatTokenAmountFromBase(1n, 18, 6)
      expect(result).toBe('0.000000')
    })

    it('should handle very small amounts with high display precision', () => {
      const result = formatTokenAmountFromBase(1n, 18, 18)
      expect(result).toBe('0.000000000000000001')
    })

    it('should handle whole numbers without decimal point in source', () => {
      // When formatUnits returns "123" instead of "123.0"
      const result = formatTokenAmountFromBase(123000000n, 6, 2)
      expect(result).toBe('123.00')
    })
  })

  describe('real-world scenarios', () => {
    it('should format USDC debt amount correctly (issue #478)', () => {
      // Example from the bug report: USDC debt with 6 decimals
      const debtAmount = 1234567890n // 1234.56789 USDC
      const result = formatTokenAmountFromBase(debtAmount, 6, 6)
      expect(result).toBe('1234.567890')
    })

    it('should match formatUnits precision for display', () => {
      // Ensure our formatting preserves the same precision as formatUnits with rounding
      // 0.123456789012345678 rounds to 0.123457 (7th digit is 7 >= 5)
      const amount = 123456789012345678n // Large ETH amount
      const result = formatTokenAmountFromBase(amount, 18, 6)
      expect(result).toBe('0.123457')
    })

    it('should handle stablecoin amounts with 2 decimal display', () => {
      const usdcAmount = 10550000n // 10.55 USDC
      const result = formatTokenAmountFromBase(usdcAmount, 6, 2)
      expect(result).toBe('10.55')
    })
  })
})
