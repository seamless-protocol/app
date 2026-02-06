import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePercentSlippageInput } from '@/features/leverage-tokens/hooks/usePercentSlippageInput'
import { hookTestUtils } from '../../../../utils'

describe('usePercentSlippageInput', () => {
  let storageKeyCounter = 0
  const nextStorageKey = () => `percent-slippage-input-test-${storageKeyCounter++}`

  it('initializes with default slippage', () => {
    const storageKey = nextStorageKey()
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      usePercentSlippageInput({ storageKey, initial: '0.5', fallbackBps: 50 }),
    )

    expect(result.current.value).toBe('0.5')
    expect(result.current.valueBps).toBe(50)
  })

  it('parses percent sign input', () => {
    const storageKey = nextStorageKey()
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      usePercentSlippageInput({ storageKey, initial: '0.5', fallbackBps: 50 }),
    )

    act(() => {
      result.current.setValue('2%')
    })

    expect(result.current.value).toBe('2%')
    expect(result.current.valueBps).toBe(200)
  })

  it('falls back on invalid input', () => {
    const storageKey = nextStorageKey()
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      usePercentSlippageInput({ storageKey, initial: '0.5', fallbackBps: 50 }),
    )

    act(() => {
      result.current.setValue('abc')
    })

    expect(result.current.value).toBe('abc')
    expect(result.current.valueBps).toBe(50)
  })
})
