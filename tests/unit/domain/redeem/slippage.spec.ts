import { describe, expect, it } from 'vitest'
import {
  calculateActualSlippage,
  calculateMinCollateralForSender,
} from '@/domain/redeem/utils/slippage'

describe('calculateMinCollateralForSender', () => {
  const ONE_ETH = 1000000000000000000n // 1 ETH in wei

  it('returns expected collateral when slippage is zero', () => {
    const result = calculateMinCollateralForSender(ONE_ETH, 0)
    expect(result).toBe(ONE_ETH)
  })

  it('returns expected collateral when slippage is negative', () => {
    const result = calculateMinCollateralForSender(ONE_ETH, -50)
    expect(result).toBe(ONE_ETH)
  })

  it('calculates minimum collateral with 0.5% slippage (50 bps)', () => {
    // 0.5% slippage means user accepts 99.5% of expected
    const result = calculateMinCollateralForSender(ONE_ETH, 50)
    const expected = (ONE_ETH * 9950n) / 10000n
    expect(result).toBe(expected)
  })

  it('calculates minimum collateral with 1% slippage (100 bps)', () => {
    // 1% slippage means user accepts 99% of expected
    const result = calculateMinCollateralForSender(ONE_ETH, 100)
    const expected = (ONE_ETH * 9900n) / 10000n
    expect(result).toBe(expected)
  })

  it('calculates minimum collateral with 5% slippage (500 bps)', () => {
    // 5% slippage means user accepts 95% of expected
    const result = calculateMinCollateralForSender(ONE_ETH, 500)
    const expected = (ONE_ETH * 9500n) / 10000n
    expect(result).toBe(expected)
  })

  it('returns zero for 100% slippage (10000 bps)', () => {
    // 100% slippage = accept anything
    const result = calculateMinCollateralForSender(ONE_ETH, 10000)
    expect(result).toBe(0n)
  })

  it('returns zero for slippage exceeding 100%', () => {
    const result = calculateMinCollateralForSender(ONE_ETH, 15000)
    expect(result).toBe(0n)
  })

  it('handles zero collateral amount', () => {
    const result = calculateMinCollateralForSender(0n, 50)
    expect(result).toBe(0n)
  })

  it('handles very small collateral amounts', () => {
    // 1 wei with 50 bps slippage
    const result = calculateMinCollateralForSender(1n, 50)
    expect(result).toBe(0n) // Rounds down to 0
  })

  it('handles very large collateral amounts', () => {
    const largeAmount = 1000000000000000000000000n // 1M ETH
    const result = calculateMinCollateralForSender(largeAmount, 50)
    const expected = (largeAmount * 9950n) / 10000n
    expect(result).toBe(expected)
  })

  it('rounds down when result is not exact', () => {
    // 999 wei with 33 bps slippage: 999 * 9967 / 10000 = 995.9133
    const result = calculateMinCollateralForSender(999n, 33)
    expect(result).toBe(995n) // Should round down
  })

  it('handles maximum normal slippage (99.99% = 9999 bps)', () => {
    const result = calculateMinCollateralForSender(ONE_ETH, 9999)
    const expected = (ONE_ETH * 1n) / 10000n
    expect(result).toBe(expected)
  })
})

describe('calculateActualSlippage', () => {
  const ONE_ETH = 1000000000000000000n // 1 ETH in wei

  it('returns zero when expected equals actual', () => {
    const result = calculateActualSlippage(ONE_ETH, ONE_ETH)
    expect(result).toBe(0)
  })

  it('returns zero when actual exceeds expected', () => {
    // User got more than expected (positive slippage)
    const result = calculateActualSlippage(ONE_ETH, ONE_ETH + 1000000n)
    expect(result).toBe(0)
  })

  it('returns zero when expected is zero', () => {
    const result = calculateActualSlippage(0n, 500000000000000000n)
    expect(result).toBe(0)
  })

  it('calculates 0.5% slippage correctly', () => {
    const expected = 1000000000000000000n // 1 ETH
    const actual = 995000000000000000n // 0.995 ETH (0.5% less)
    const result = calculateActualSlippage(expected, actual)
    expect(result).toBe(50) // 50 bps = 0.5%
  })

  it('calculates 1% slippage correctly', () => {
    const expected = 1000000000000000000n // 1 ETH
    const actual = 990000000000000000n // 0.99 ETH (1% less)
    const result = calculateActualSlippage(expected, actual)
    expect(result).toBe(100) // 100 bps = 1%
  })

  it('calculates 5% slippage correctly', () => {
    const expected = 1000000000000000000n // 1 ETH
    const actual = 950000000000000000n // 0.95 ETH (5% less)
    const result = calculateActualSlippage(expected, actual)
    expect(result).toBe(500) // 500 bps = 5%
  })

  it('calculates 50% slippage correctly', () => {
    const expected = 1000000000000000000n // 1 ETH
    const actual = 500000000000000000n // 0.5 ETH (50% less)
    const result = calculateActualSlippage(expected, actual)
    expect(result).toBe(5000) // 5000 bps = 50%
  })

  it('calculates 100% slippage when actual is zero', () => {
    const result = calculateActualSlippage(ONE_ETH, 0n)
    expect(result).toBe(10000) // 10000 bps = 100%
  })

  it('handles very small slippage amounts', () => {
    // 1 wei difference out of 1 ETH
    const expected = 1000000000000000000n
    const actual = 999999999999999999n
    const result = calculateActualSlippage(expected, actual)
    expect(result).toBe(0) // Rounds down to 0 bps
  })

  it('handles large slippage amounts', () => {
    const expected = 1000000n
    const actual = 1n
    const result = calculateActualSlippage(expected, actual)
    expect(result).toBeGreaterThan(9990) // Almost 100%
  })

  it('rounds down fractional basis points', () => {
    // Slippage that results in fractional bps
    const expected = 1000n
    const actual = 995n // 0.5% slippage
    const result = calculateActualSlippage(expected, actual)
    expect(result).toBe(50) // 50 bps
  })

  it('handles actual being slightly less than expected', () => {
    const expected = 100000000n
    const actual = 99950000n // 0.05% less
    const result = calculateActualSlippage(expected, actual)
    expect(result).toBe(5) // 5 bps = 0.05%
  })

  it('handles extreme slippage near 100%', () => {
    const expected = 10000000n
    const actual = 1n // Almost total loss
    const result = calculateActualSlippage(expected, actual)
    expect(result).toBeGreaterThanOrEqual(9999) // Nearly 100%
  })
})
