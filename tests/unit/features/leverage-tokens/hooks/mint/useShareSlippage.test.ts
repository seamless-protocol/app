import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useShareSlippage } from '@/features/leverage-tokens/hooks/mint/useShareSlippage.ts'
import { hookTestUtils } from '../../../../../utils.tsx'

describe('useShareSlippage', () => {
  const tokenAddress = '0xBEEF'

  it('should initialize with default slippage', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    expect(result.current.shareSlippage).toBe('0.5')
    expect(result.current.shareSlippageBps).toBe(50) // 0.5% * 100 = 50 bps
  })

  it('should initialize with custom slippage', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useShareSlippage(tokenAddress, '1.0'),
    )

    expect(result.current.shareSlippage).toBe('1.0')
    expect(result.current.shareSlippageBps).toBe(100) // 1.0% * 100 = 100 bps
  })

  it('should handle valid slippage input', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('2.5')
    })
    expect(result.current.shareSlippage).toBe('2.5')
    expect(result.current.shareSlippageBps).toBe(250) // 2.5% * 100 = 250 bps
  })

  it('should handle decimal slippage', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('0.1')
    })
    expect(result.current.shareSlippage).toBe('0.1')
    expect(result.current.shareSlippageBps).toBe(10) // 0.1% * 100 = 10 bps
  })

  it('should handle zero slippage', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('0')
    })
    expect(result.current.shareSlippage).toBe('0')
    expect(result.current.shareSlippageBps).toBe(0)
  })

  it('should handle negative slippage by falling back to default', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('-1.0')
    })
    expect(result.current.shareSlippage).toBe('-1.0')
    expect(result.current.shareSlippageBps).toBe(50) // Falls back to default
  })

  it('should handle very high slippage by clamping to 100%', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('150.0')
    })
    expect(result.current.shareSlippage).toBe('150.0')
    expect(result.current.shareSlippageBps).toBe(10000) // Clamped to 100% (10000 bps)
  })

  it('should handle invalid input gracefully', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('abc')
    })
    expect(result.current.shareSlippage).toBe('abc')
    expect(result.current.shareSlippageBps).toBe(50) // Falls back to default
  })

  it('should handle empty string input', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('')
    })
    expect(result.current.shareSlippage).toBe('')
    expect(result.current.shareSlippageBps).toBe(0) // Empty string becomes '0' which is 0 bps
  })

  it('should handle undefined input gracefully', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage(undefined as any)
    })
    expect(result.current.shareSlippage).toBe(undefined)
    expect(result.current.shareSlippageBps).toBe(0) // Undefined becomes '0' which is 0 bps
  })

  it('should handle very small slippage values', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('0.01')
    })
    expect(result.current.shareSlippage).toBe('0.01')
    expect(result.current.shareSlippageBps).toBe(1) // 0.01% * 100 = 1 bps
  })

  it('should handle fractional slippage values', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('0.25')
    })
    expect(result.current.shareSlippage).toBe('0.25')
    expect(result.current.shareSlippageBps).toBe(25) // 0.25% * 100 = 25 bps
  })

  it('should maintain precision for valid inputs', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('1.234')
    })
    expect(result.current.shareSlippage).toBe('1.234')
    expect(result.current.shareSlippageBps).toBe(123) // 1.234% * 100 = 123.4 bps, rounded to 123
  })

  it('should handle edge case of exactly 100%', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('100.0')
    })
    expect(result.current.shareSlippage).toBe('100.0')
    expect(result.current.shareSlippageBps).toBe(10000) // 100% = 10000 bps
  })

  it('should handle edge case of exactly 0%', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('0.0')
    })
    expect(result.current.shareSlippage).toBe('0.0')
    expect(result.current.shareSlippageBps).toBe(0) // 0% = 0 bps
  })

  it('should handle multiple token addresses', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useShareSlippage(tokenAddress))

    act(() => {
      result.current.setShareSlippage('0.5')
    })

    const otherTokenAddress = '0xCAFE'
    const { result: otherResult } = hookTestUtils.renderHookWithQuery(() =>
      useShareSlippage(otherTokenAddress),
    )

    act(() => {
      otherResult.current.setShareSlippage('1.0')
    })

    expect(result.current.shareSlippage).toBe('0.5')
    expect(result.current.shareSlippageBps).toBe(50) // 0.5% * 100 = 50 bps
    expect(otherResult.current.shareSlippage).toBe('1.0')
    expect(otherResult.current.shareSlippageBps).toBe(100) // 1.0% * 100 = 100 bps
  })
})
