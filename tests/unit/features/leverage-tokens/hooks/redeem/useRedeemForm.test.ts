import { act } from '@testing-library/react'
import { parseUnits } from 'viem'
import { describe, expect, it } from 'vitest'
import { useRedeemForm } from '@/features/leverage-tokens/hooks/redeem/useRedeemForm'
import { hookTestUtils } from '../../../../../utils.tsx'

describe('useRedeemForm', () => {
  const defaultParams = {
    leverageTokenDecimals: 18,
    leverageTokenBalanceFormatted: '10.5',
  }

  it('should initialize with empty amount', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    expect(result.current.amount).toBe('')
    expect(result.current.amountRaw).toBeUndefined()
    expect(result.current.isAmountValid).toBe(false)
    expect(result.current.hasBalance).toBe(false)
    expect(result.current.minAmountOk).toBe(false)
  })

  it('should handle valid amount input', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    act(() => {
      result.current.onAmountChange('5.25')
    })

    expect(result.current.amount).toBe('5.25')
    expect(result.current.amountRaw).toEqual(parseUnits('5.25', 18))
    expect(result.current.isAmountValid).toBe(true)
    expect(result.current.hasBalance).toBe(true)
    expect(result.current.minAmountOk).toBe(true)
  })

  it('should handle invalid amount input', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    act(() => {
      result.current.onAmountChange('abc')
    })

    expect(result.current.amount).toBe('')
    expect(result.current.amountRaw).toBeUndefined()
    expect(result.current.isAmountValid).toBe(false)
  })

  it('should handle decimal input', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    act(() => {
      result.current.onAmountChange('1.234567')
    })

    expect(result.current.amount).toBe('1.234567')
    expect(result.current.amountRaw).toEqual(parseUnits('1.234567', 18))
    expect(result.current.isAmountValid).toBe(true)
  })

  it('should handle zero amount', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    act(() => {
      result.current.onAmountChange('0')
    })

    expect(result.current.amount).toBe('0')
    expect(result.current.amountRaw).toBeUndefined()
    expect(result.current.isAmountValid).toBe(false)
  })

  it('should handle negative amount', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    act(() => {
      result.current.onAmountChange('-5')
    })

    expect(result.current.amount).toBe('')
    expect(result.current.amountRaw).toBeUndefined()
    expect(result.current.isAmountValid).toBe(false)
  })

  it('should validate balance correctly', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    // Amount within balance
    act(() => {
      result.current.onAmountChange('5.0')
    })
    expect(result.current.hasBalance).toBe(true)

    // Amount exceeding balance
    act(() => {
      result.current.onAmountChange('15.0')
    })
    expect(result.current.hasBalance).toBe(false)
  })

  it('should validate minimum amount (0.01)', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    // Amount below minimum
    act(() => {
      result.current.onAmountChange('0.005')
    })
    expect(result.current.minAmountOk).toBe(false)

    // Amount above minimum
    act(() => {
      result.current.onAmountChange('0.1')
    })
    expect(result.current.minAmountOk).toBe(true)
  })

  it('should handle percentage shortcuts', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    act(() => {
      result.current.onPercent(50, '10.5')
    })

    expect(result.current.amount).toBe('5.250000')
    expect(result.current.amountRaw).toEqual(parseUnits('5.25', 18))
  })

  it('should clamp percentage to 0-100 range', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    // Test negative percentage
    act(() => {
      result.current.onPercent(-10, '10.5')
    })
    expect(result.current.amount).toBe('0.000000')

    // Test percentage over 100 - should clamp to 100% and preserve full precision
    act(() => {
      result.current.onPercent(150, '10.5')
    })
    expect(result.current.amount).toBe('10.5') // 100% preserves full precision
  })

  it('should handle different decimal places', () => {
    const paramsWithDifferentDecimals = {
      ...defaultParams,
      leverageTokenDecimals: 6,
    }

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemForm(paramsWithDifferentDecimals),
    )

    act(() => {
      result.current.onAmountChange('1.5')
    })

    expect(result.current.amountRaw).toEqual(parseUnits('1.5', 6))
  })

  it('should handle empty token balance', () => {
    const paramsWithEmptyBalance = {
      ...defaultParams,
      leverageTokenBalanceFormatted: '0',
    }

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemForm(paramsWithEmptyBalance),
    )

    act(() => {
      result.current.onAmountChange('1.0')
    })

    expect(result.current.hasBalance).toBe(false)
  })

  it('should handle very small amounts with precision', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    act(() => {
      result.current.onAmountChange('0.000001')
    })

    expect(result.current.amount).toBe('0.000001')
    expect(result.current.isAmountValid).toBe(true)
    expect(result.current.minAmountOk).toBe(false) // Below 0.01 minimum
  })

  it('should handle setAmount directly', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    act(() => {
      result.current.setAmount('3.14159')
    })

    expect(result.current.amount).toBe('3.14159')
    expect(result.current.amountRaw).toEqual(parseUnits('3.14159', 18))
  })

  it('should handle edge case with floating point precision', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    act(() => {
      result.current.onAmountChange('10.499999999999999')
    })

    // Should still be considered within balance due to 1e-12 tolerance
    expect(result.current.hasBalance).toBe(true)
  })

  it('should handle percentage with different token balances', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    // Test with different token balance
    act(() => {
      result.current.onPercent(25, '20.0')
    })

    expect(result.current.amount).toBe('5.000000')

  })

  it('should floor amounts for non-100% percentages using base-unit math', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    // a balance slightly above 1.0 by 1 wei (18 decimals)
    const balanceWithRoundingEdge = '1.000000000000000001'

    act(() => {
      result.current.onPercent(50, balanceWithRoundingEdge)
    })

    // 50% floors to exactly 0.5 tokens
    expect(result.current.amountRaw).toEqual(parseUnits('0.5', 18))
    expect(result.current.amount).toBe('0.500000')
  })

  it('should handle empty string input gracefully', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    act(() => {
      result.current.onAmountChange('')
    })

    expect(result.current.amount).toBe('')
    expect(result.current.amountRaw).toBeUndefined()
    expect(result.current.isAmountValid).toBe(false)
  })

  it('should handle very large amounts', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemForm(defaultParams))

    act(() => {
      result.current.onAmountChange('999999999.999999')
    })

    expect(result.current.amount).toBe('999999999.999999')
    expect(result.current.isAmountValid).toBe(true)
    expect(result.current.hasBalance).toBe(false) // Exceeds balance
  })
})
