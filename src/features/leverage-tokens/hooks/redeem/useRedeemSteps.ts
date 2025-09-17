import { useCallback, useState } from 'react'

export type RedeemStep = 'input' | 'confirm' | 'pending' | 'success' | 'error'

export function useRedeemSteps(initial: RedeemStep = 'input') {
  const [step, setStep] = useState<RedeemStep>(initial)

  return {
    step,
    setStep,
    toInput: useCallback(() => setStep('input'), []),
    toConfirm: useCallback(() => setStep('confirm'), []),
    toPending: useCallback(() => setStep('pending'), []),
    toSuccess: useCallback(() => setStep('success'), []),
    toError: useCallback(() => setStep('error'), []),
  }
}
