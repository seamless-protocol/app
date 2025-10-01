import { act, renderHook } from '@testing-library/react'
import { parseUnits } from 'viem'
import { describe, expect, it } from 'vitest'
import { useMintForm } from '@/features/leverage-tokens/hooks/mint/useMintForm'
import { hookTestUtils } from '../../../../../utils.tsx'

describe('useMintForm', () => {
  const defaultParams = {
    decimals: 18,
    walletBalanceFormatted: '10.5',
    minAmountFormatted: '0.01',
  }

  it('should initialize with empty amount', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

    expect(result.current.amount).toBe('')
    expect(result.current.amountRaw).toBeUndefined()
    expect(result.current.isAmountValid).toBe(false)
    expect(result.current.hasBalance).toBe(false)
    expect(result.current.minAmountOk).toBe(false)
  })

  it('should handle valid amount input', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

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
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

    act(() => {
      result.current.onAmountChange('abc')
    })

    expect(result.current.amount).toBe('')
    expect(result.current.amountRaw).toBeUndefined()
    expect(result.current.isAmountValid).toBe(false)
  })

  it('should handle decimal input', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

    act(() => {
      result.current.onAmountChange('1.234567')
    })

    expect(result.current.amount).toBe('1.234567')
    expect(result.current.amountRaw).toEqual(parseUnits('1.234567', 18))
    expect(result.current.isAmountValid).toBe(true)
  })

  it('should handle zero amount', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

    act(() => {
      result.current.onAmountChange('0')
    })

    expect(result.current.amount).toBe('0')
    expect(result.current.amountRaw).toBeUndefined()
    expect(result.current.isAmountValid).toBe(false)
  })

  it('should handle negative amount', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

    act(() => {
      result.current.onAmountChange('-5')
    })

    expect(result.current.amount).toBe('')
    expect(result.current.amountRaw).toBeUndefined()
    expect(result.current.isAmountValid).toBe(false)
  })

  it('should validate balance correctly', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

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

  it('should validate minimum amount', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

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
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

    act(() => {
      result.current.onPercent(50)
    })

    expect(result.current.amount).toBe('5.250000')
    expect(result.current.amountRaw).toEqual(parseUnits('5.25', 18))
  })


  it('should use exact wallet balance for 100% (MAX)', () => {
    const params = { ...defaultParams, walletBalanceFormatted: '10.5' }
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(params))

    act(() => {
      result.current.onPercent(100)
    })

    // amountRaw should exactly equal the parsed wallet balance
    expect(result.current.amountRaw).toEqual(parseUnits(params.walletBalanceFormatted, 18))
    // string formatting maintains 6 decimals for display
    expect(result.current.amount).toBe('10.500000')
  })

  it('should floor amounts for non-100% percentages using base-unit math', () => {
    const params = { ...defaultParams, walletBalanceFormatted: '1.000000000000000001' }
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(params))

    act(() => {
      result.current.onPercent(50)
    })

    // 50% of 1.000000000000000001 in base units floors to exactly 0.5
    expect(result.current.amountRaw).toEqual(parseUnits('0.5', 18))
    expect(result.current.amount).toBe('0.500000')
  })

  it('should clamp percentage to 0-100 range', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

    // Test negative percentage
    act(() => {
      result.current.onPercent(-10)
    })
    expect(result.current.amount).toBe('0.000000')

    // Test percentage over 100
    act(() => {
      result.current.onPercent(150)
    })
    expect(result.current.amount).toBe('10.500000')
  })

  it('should handle different decimal places', () => {
    const { result } = renderHook(() =>
      useMintForm({
        ...defaultParams,
        decimals: 6,
      }),
    )

    act(() => {
      result.current.onAmountChange('1.5')
    })

    expect(result.current.amountRaw).toEqual(parseUnits('1.5', 6))
  })

  it('should handle empty wallet balance', () => {
    const { result } = renderHook(() =>
      useMintForm({
        ...defaultParams,
        walletBalanceFormatted: '0',
      }),
    )

    act(() => {
      result.current.onAmountChange('1.0')
    })

    expect(result.current.hasBalance).toBe(false)
  })

  it('should handle custom minimum amount', () => {
    const { result } = renderHook(() =>
      useMintForm({
        ...defaultParams,
        minAmountFormatted: '1.0',
      }),
    )

    act(() => {
      result.current.onAmountChange('0.5')
    })

    expect(result.current.minAmountOk).toBe(false)

    act(() => {
      result.current.onAmountChange('2.0')
    })

    expect(result.current.minAmountOk).toBe(true)
  })

  it('should handle very small amounts with precision', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

    act(() => {
      result.current.onAmountChange('0.000001')
    })

    expect(result.current.amount).toBe('0.000001')
    expect(result.current.isAmountValid).toBe(true)
    expect(result.current.minAmountOk).toBe(false) // Below 0.01 minimum
  })

  it('should handle setAmount directly', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

    act(() => {
      result.current.setAmount('3.14159')
    })

    expect(result.current.amount).toBe('3.14159')
    expect(result.current.amountRaw).toEqual(parseUnits('3.14159', 18))
  })

  it('should handle edge case with floating point precision', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintForm(defaultParams))

    act(() => {
      result.current.onAmountChange('10.499999999999999')
    })

    // Should still be considered within balance due to 1e-12 tolerance
    expect(result.current.hasBalance).toBe(true)
  })
})
