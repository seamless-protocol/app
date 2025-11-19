import { useEffect, useState } from 'react'
import type { MintPlan } from '@/domain/mint/planner/plan'
import type { RedeemPlan } from '@/domain/redeem/planner/plan'

type ModalStep = 'userInput' | 'approve' | 'confirm' | 'pending' | 'success' | 'error'

interface UseMinSharesGuardParams {
  currentStep: ModalStep
  plan: MintPlan | RedeemPlan | undefined
  getMinValue: (plan: MintPlan | RedeemPlan) => bigint | undefined
  stepName: ModalStep // The step name to track (default: 'confirm')
}

interface UseMinSharesGuardResult {
  ackMinValue: bigint | undefined
  needsReack: boolean
  errorMessage: string | undefined
  onUserAcknowledge: () => void
}

/**
 * Hook to guard against quote worsening after user has acknowledged a floor value.
 *
 * Flow:
 * 1. On first entry to confirm step, locks in the current minimum value as acknowledged
 * 2. Watches for auto-refresh changes to the plan
 * 3. If minimum value worsens below acknowledged floor, requires re-acknowledgment
 * 4. If minimum value improves, silently updates the acknowledged floor
 *
 * Works with both mint plans (minShares) and redeem plans (minCollateralForSender).
 *
 * @param currentStep - Current step in the flow
 * @param plan - The plan containing the minimum value to track
 * @param getMinValue - Function to extract the minimum value from the plan
 * @param stepName - The step name to track (default: 'confirm')
 * @returns Guard state and acknowledgment handler
 */
export function useMinSharesGuard({
  currentStep,
  plan,
  getMinValue,
  stepName = 'confirm',
}: UseMinSharesGuardParams): UseMinSharesGuardResult {
  const [ackMinValue, setAckMinValue] = useState<bigint | undefined>(undefined)
  const [needsReack, setNeedsReack] = useState(false)

  // Reset state when leaving the tracked step
  useEffect(() => {
    if (currentStep !== stepName) {
      setAckMinValue(undefined)
      setNeedsReack(false)
    }
  }, [currentStep, stepName])

  // React to plan changes while on confirm step
  useEffect(() => {
    // Only act when on the tracked step
    if (currentStep !== stepName || !plan) {
      return
    }

    const currentMinValue = getMinValue(plan)
    if (currentMinValue === undefined) {
      return
    }

    // First time on confirm: lock in the floor
    if (ackMinValue === undefined) {
      setAckMinValue(currentMinValue)
      setNeedsReack(false)
      return
    }

    // Quote improved: silently update acknowledged floor
    if (currentMinValue > ackMinValue) {
      setAckMinValue(currentMinValue)
      setNeedsReack(false)
      return
    }

    // Quote worsened: require re-acknowledgment
    if (currentMinValue < ackMinValue) {
      setNeedsReack(true)
      return
    }

    // Quote stayed the same: no action needed
  }, [currentStep, stepName, plan, getMinValue, ackMinValue])

  // Generate error message when re-acknowledgment is needed
  const errorMessage = needsReack
    ? 'Guaranteed output decreased — please review and confirm again.'
    : undefined

  // Handler for user re-acknowledgment
  const onUserAcknowledge = () => {
    if (!plan) return
    const currentMinValue = getMinValue(plan)
    if (currentMinValue === undefined) return
    setAckMinValue(currentMinValue)
    setNeedsReack(false)
  }

  return {
    ackMinValue,
    needsReack,
    errorMessage,
    onUserAcknowledge,
  }
}
