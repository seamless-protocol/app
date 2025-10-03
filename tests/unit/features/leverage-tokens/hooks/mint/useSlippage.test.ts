import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useSlippage } from '@/features/leverage-tokens/hooks/mint/useSlippage'
import { hookTestUtils } from '../../../../../utils.tsx'

describe('useSlippage', () => {
  it('should initialize with default slippage', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    expect(result.current.slippage).toBe('0.5')
    expect(result.current.slippageBps).toBe(50) // 0.5% * 100 = 50 bps
  })

  it('should initialize with custom slippage', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage('1.0'))

    expect(result.current.slippage).toBe('1.0')
    expect(result.current.slippageBps).toBe(100) // 1.0% * 100 = 100 bps
  })

  it('should handle valid slippage input', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('2.5')
    })
    expect(result.current.slippage).toBe('2.5')
    expect(result.current.slippageBps).toBe(250) // 2.5% * 100 = 250 bps
  })

  it('should handle decimal slippage', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('0.1')
    })
    expect(result.current.slippage).toBe('0.1')
    expect(result.current.slippageBps).toBe(10) // 0.1% * 100 = 10 bps
  })

  it('should handle zero slippage', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('0')
    })
    expect(result.current.slippage).toBe('0')
    expect(result.current.slippageBps).toBe(0)
  })

  it('should handle negative slippage by falling back to default', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('-1.0')
    })
    expect(result.current.slippage).toBe('-1.0')
    expect(result.current.slippageBps).toBe(50) // Falls back to default
  })

  it('should handle very high slippage by clamping to 100%', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('150.0')
    })
    expect(result.current.slippage).toBe('150.0')
    expect(result.current.slippageBps).toBe(10000) // Clamped to 100% (10000 bps)
  })

  it('should handle invalid input gracefully', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('abc')
    })
    expect(result.current.slippage).toBe('abc')
    expect(result.current.slippageBps).toBe(50) // Falls back to default
  })

  it('should handle empty string input', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('')
    })
    expect(result.current.slippage).toBe('')
    expect(result.current.slippageBps).toBe(0) // Empty string becomes '0' which is 0 bps
  })

  it('should handle undefined input gracefully', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage(undefined as any)
    })
    expect(result.current.slippage).toBe(undefined)
    expect(result.current.slippageBps).toBe(0) // Undefined becomes '0' which is 0 bps
  })

  it('should handle very small slippage values', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('0.01')
    })
    expect(result.current.slippage).toBe('0.01')
    expect(result.current.slippageBps).toBe(1) // 0.01% * 100 = 1 bps
  })

  it('should handle fractional slippage values', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('0.25')
    })
    expect(result.current.slippage).toBe('0.25')
    expect(result.current.slippageBps).toBe(25) // 0.25% * 100 = 25 bps
  })

  it('should maintain precision for valid inputs', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('1.234')
    })
    expect(result.current.slippage).toBe('1.234')
    expect(result.current.slippageBps).toBe(123) // 1.234% * 100 = 123.4 bps, rounded to 123
  })

  it('should handle edge case of exactly 100%', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('100.0')
    })
    expect(result.current.slippage).toBe('100.0')
    expect(result.current.slippageBps).toBe(10000) // 100% = 10000 bps
  })

  it('should handle edge case of exactly 0%', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useSlippage())

    act(() => {
      result.current.setSlippage('0.0')
    })
    expect(result.current.slippage).toBe('0.0')
    expect(result.current.slippageBps).toBe(0) // 0% = 0 bps
  })
})
