import { useCallback, useState } from 'react'

export type MintStep = 'input' | 'approve' | 'confirm' | 'pending' | 'success' | 'error'

export function useMintSteps(initial: MintStep = 'input') {
  const [step, setStep] = useState<MintStep>(initial)

  return {
    step,
    setStep,
    toInput: useCallback(() => setStep('input'), []),
    toApprove: useCallback(() => setStep('approve'), []),
    toConfirm: useCallback(() => setStep('confirm'), []),
    toPending: useCallback(() => setStep('pending'), []),
    toSuccess: useCallback(() => setStep('success'), []),
    toError: useCallback(() => setStep('error'), []),
  }
}
