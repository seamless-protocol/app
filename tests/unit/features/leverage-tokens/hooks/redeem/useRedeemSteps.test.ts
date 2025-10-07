import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRedeemSteps } from '@/features/leverage-tokens/hooks/redeem/useRedeemSteps'
import { hookTestUtils } from '../../../../../utils.tsx'

describe('useRedeemSteps', () => {
  it('should initialize with default step', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps())

    expect(result.current.step).toBe('userInput')
  })

  it('should initialize with custom initial step', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps('approve'))

    expect(result.current.step).toBe('approve')
  })

  it('should navigate to input step', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps('confirm'))

    expect(result.current.step).toBe('confirm')

    act(() => {
      result.current.toInput()
    })
    expect(result.current.step).toBe('userInput')
  })

  it('should navigate to approve step', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps())

    act(() => {
      result.current.toApprove()
    })
    expect(result.current.step).toBe('approve')
  })

  it('should navigate to confirm step', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps())

    act(() => {
      result.current.toConfirm()
    })
    expect(result.current.step).toBe('confirm')
  })

  it('should navigate to pending step', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps())

    act(() => {
      result.current.toPending()
    })
    expect(result.current.step).toBe('pending')
  })

  it('should navigate to success step', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps())

    act(() => {
      result.current.toSuccess()
    })
    expect(result.current.step).toBe('success')
  })

  it('should navigate to error step', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps())

    act(() => {
      result.current.toError()
    })
    expect(result.current.step).toBe('error')
  })

  it('should allow direct step setting', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps())

    act(() => {
      result.current.setStep('success')
    })
    expect(result.current.step).toBe('success')

    act(() => {
      result.current.setStep('error')
    })
    expect(result.current.step).toBe('error')
  })

  it('should provide all navigation methods', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps())

    expect(typeof result.current.toInput).toBe('function')
    expect(typeof result.current.toApprove).toBe('function')
    expect(typeof result.current.toConfirm).toBe('function')
    expect(typeof result.current.toPending).toBe('function')
    expect(typeof result.current.toSuccess).toBe('function')
    expect(typeof result.current.toError).toBe('function')
    expect(typeof result.current.setStep).toBe('function')
  })

  it('should handle step transitions correctly', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps())

    // Start at input
    expect(result.current.step).toBe('userInput')

    // Move through the flow
    act(() => {
      result.current.toApprove()
    })
    expect(result.current.step).toBe('approve')

    act(() => {
      result.current.toConfirm()
    })
    expect(result.current.step).toBe('confirm')

    act(() => {
      result.current.toPending()
    })
    expect(result.current.step).toBe('pending')

    act(() => {
      result.current.toSuccess()
    })
    expect(result.current.step).toBe('success')
  })

  it('should handle error flow', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps())

    // Start at input
    expect(result.current.step).toBe('userInput')

    // Move to error from any step
    act(() => {
      result.current.toError()
    })
    expect(result.current.step).toBe('error')

    // Can go back to input from error
    act(() => {
      result.current.toInput()
    })
    expect(result.current.step).toBe('userInput')
  })

  it('should maintain step state across re-renders', () => {
    const { result, rerender } = hookTestUtils.renderHookWithQuery(() => useRedeemSteps())

    act(() => {
      result.current.toConfirm()
    })
    expect(result.current.step).toBe('confirm')

    // Re-render should maintain state
    rerender()
    expect(result.current.step).toBe('confirm')
  })
})
