import { useState } from 'react'

export type MintStep = 'input' | 'approve' | 'confirm' | 'pending' | 'success' | 'error'

export function useMintSteps(initial: MintStep = 'input') {
  const [step, setStep] = useState<MintStep>(initial)

  return {
    step,
    setStep,
    toInput: () => setStep('input'),
    toApprove: () => setStep('approve'),
    toConfirm: () => setStep('confirm'),
    toPending: () => setStep('pending'),
    toSuccess: () => setStep('success'),
    toError: () => setStep('error'),
  }
}
